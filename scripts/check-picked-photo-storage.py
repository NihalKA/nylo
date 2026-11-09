"""TEST ONLY: inspect the retained owned picker JPEG in disposable CI SQLite."""
import argparse
import base64
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import sqlite3
import struct

spec = importlib.util.spec_from_file_location("owned_photo", Path(__file__).with_name("owned-photo-metadata.py"))
owned = importlib.util.module_from_spec(spec)
spec.loader.exec_module(owned)
require = owned.require
DRAFT = "QA photo draft stays safe after camera fallback"
CHAT_MESSAGES = {
    "gallery-morning": ["morning-user", "morning-answer"],
    "gallery-update": ["update-user", "update-answer"],
    "gallery-error": ["error-user", "error-answer"],
    "gallery-history": [name for i in range(100) for name in (f"history-user-{i}", f"history-answer-{i}")],
    "gallery-agent-prior": ["prior-user", "prior-answer"],
    "gallery-attachments": [],
}


def exif_tag_inventory(payload):
    """Bounded tag inventory; only scalar encoder values, never a payload dump."""
    data = payload[6:]
    require(data[:2] in (b"II", b"MM"), "Unknown TIFF byte order")
    endian = "<" if data[:2] == b"II" else ">"
    def u16(offset):
        require(0 <= offset <= len(data) - 2, "Truncated TIFF word")
        return struct.unpack_from(endian + "H", data, offset)[0]
    def u32(offset):
        require(0 <= offset <= len(data) - 4, "Truncated TIFF offset")
        return struct.unpack_from(endian + "I", data, offset)[0]
    require(u16(2) == 42, "Unknown TIFF header")
    pending = [("IFD0", u32(4))]
    seen = set()
    result = []
    while pending and len(result) < 4:
        name, offset = pending.pop(0)
        require(offset not in seen, "Cyclic TIFF directory")
        seen.add(offset)
        count = u16(offset)
        require(count <= 64 and offset + 2 + count * 12 + 4 <= len(data), "Invalid TIFF directory")
        tags = []
        for index in range(count):
            entry = offset + 2 + index * 12
            tag, kind, amount = u16(entry), u16(entry + 2), u32(entry + 4)
            item = dict(tag=f"0x{tag:04x}", type=kind, count=amount)
            if amount == 1 and kind in (3, 4):
                item["value"] = u16(entry + 8) if kind == 3 else u32(entry + 8)
            elif amount == 1 and kind == 5:
                value_offset = u32(entry + 8)
                item["value"] = [u32(value_offset), u32(value_offset + 4)]
            tags.append(item)
            if tag in (0x8769, 0x8825) and kind == 4 and amount == 1:
                pending.append(("GPS" if tag == 0x8825 else "Exif", u32(entry + 8)))
        require(len({tag["tag"] for tag in tags}) == len(tags), "Duplicate TIFF tag")
        require(u32(offset + 2 + count * 12) == 0, "Unexpected linked TIFF directory")
        result.append(dict(directory=name, tags=tags))
    require(not pending, "Too many TIFF directories")
    return result


def validate_encoder_metadata(segments):
    """Original Artist/GPS are forbidden; only observed fresh encoder fields allowed."""
    exif_count = 0
    allowed = {
        "IFD0": {
            "0x0112": ((3,), 1),       # Upright orientation, original orientation baked into pixels.
            "0x011a": ((5,), [72, 1]), # Fresh encoder resolution, not source/camera metadata.
            "0x011b": ((5,), [72, 1]),
            "0x0128": ((3,), 2),
            "0x8769": ((4,), None),    # Offset only; referenced Exif directory is checked too.
        },
        "Exif": {
            "0xa001": ((3,), 1),       # sRGB.
            "0xa002": ((3, 4), 32),    # Dimensions independently match the JPEG frame.
            "0xa003": ((3, 4), 32),
        },
    }
    inventories = []
    for marker, payload, _, _ in segments:
        if marker != 0xe1:
            continue
        require(payload.startswith(b"Exif\0\0"), "Unexpected APP1 metadata")
        exif_count += 1
        require(exif_count <= 1, "Multiple EXIF segments")
        inventory = exif_tag_inventory(payload)
        for directory in inventory:
            require(directory["directory"] in allowed, "Original GPS or unexpected metadata directory")
            for item in directory["tags"]:
                require(item["tag"] in allowed[directory["directory"]], "Original Artist/GPS or unexpected EXIF tag")
                kinds, value = allowed[directory["directory"]][item["tag"]]
                require(item["type"] in kinds and item["count"] == 1, "Unexpected encoder tag type/count")
                require(value is None or item.get("value") == value, "Unexpected encoder metadata value")
        inventories.append(inventory)
    return inventories


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--container", required=True)
    parser.add_argument("--simulator-id", required=True)
    parser.add_argument("--source-jpeg", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()
    container = Path(args.container).resolve()
    require(os.environ.get("GITHUB_ACTIONS") == "true", "Restricted to disposable GitHub CI simulators")
    uuid = r"[0-9A-Fa-f]{8}(?:-[0-9A-Fa-f]{4}){3}-[0-9A-Fa-f]{12}"
    require(re.fullmatch(uuid, args.simulator_id) is not None, "Invalid simulator ID")
    suffix = rf"/CoreSimulator/Devices/{re.escape(args.simulator_id)}/data/Containers/Data/Application/{uuid}"
    require(re.search(suffix + r"$", str(container)) is not None, "Wrong disposable CoreSimulator container")
    # Validate the retained source before reading any database payload.
    source = Path(args.source_jpeg).read_bytes()
    owned.validate_source(source)
    db_path = container / "Documents/SQLite/nylo.db"
    require(db_path.is_file() and not db_path.is_symlink(), "Missing real simulator SQLite database")
    require(db_path.resolve().is_relative_to(container), "Database escapes disposable container")
    with sqlite3.connect(db_path.as_uri() + "?mode=ro", uri=True) as db:
        db.execute("PRAGMA query_only=ON")
        db.execute("BEGIN")  # One consistent read snapshot, including committed WAL.
        rows = db.execute("SELECT json FROM app_state WHERE id=1").fetchall()
        require(len(rows) == 1, "Missing app metadata")
        metadata = json.loads(rows[0][0])
        chats = metadata["conversations"]
        require(len(chats) == len(CHAT_MESSAGES) and {c["id"] for c in chats} == set(CHAT_MESSAGES),
                "Refusing non-synthetic or unexpected chats")
        require({c["id"] for c in metadata["connections"]} == {"gallery-provider", "gallery-alternate"} and
                all(c["baseUrl"] in ("https://example.invalid/v1", "https://alternate.example.invalid/v1")
                    for c in metadata["connections"]), "Refusing non-synthetic connections")
        require([a["id"] for a in metadata["agents"]] == ["gallery-writer"], "Unexpected agents")
        references = []
        for chat in chats:
            require(chat["title"].startswith("Example: ") and
                    [m["id"] for m in chat["messages"]] == CHAT_MESSAGES[chat["id"]],
                    "Refusing unexpected synthetic fixture history")
            attachments = chat.get("draftAttachments", []) + [a for m in chat["messages"] for a in m.get("attachments", [])]
            for attachment in attachments:
                require("data" not in attachment, "File payload embedded in metadata")
                require(isinstance(attachment.get("blobId"), str) and attachment["blobId"] == attachment["id"],
                        "Invalid metadata blob reference")
                references.append(attachment["blobId"])
        target = next(c for c in chats if c["id"] == "gallery-morning")
        require(target.get("draft") == DRAFT, "Exact retained draft missing")
        photos = target.get("draftAttachments", [])
        require(len(photos) == 1, "Expected exactly one retained owned photo")
        photo = photos[0]
        require(photo["name"] == "Photo.jpg" and photo["mimeType"] == "image/jpeg", "Wrong retained photo")
        require(re.fullmatch(r"[a-z0-9]+-[a-z0-9]{1,9}", photo["id"]) is not None,
                "Expected fresh picker-generated identity")
        # Only the two untouched gallery seeds and this retained picker photo may be referenced.
        require(len(references) == 3 and set(references) ==
                {"gallery-owned-image", "gallery-owned-text", photo["blobId"]}, "Unexpected fixture attachments")
        stored = {row[0] for row in db.execute("SELECT id FROM attachment_blobs")}
        require(stored == set(references), "Orphaned or missing attachment blob (including removed first import)")
        # Never load all payloads: extract ONLY the target chat's Photo.jpg.
        blobs = db.execute("SELECT data FROM attachment_blobs WHERE id=?", (photo["blobId"],)).fetchall()
        require(len(blobs) == 1 and isinstance(blobs[0][0], str), "Missing target photo blob")
        data = base64.b64decode(blobs[0][0], validate=True)
        require(base64.b64encode(data).decode("ascii") == blobs[0][0], "Noncanonical photo base64")
    require(type(photo["size"]) is int and photo["size"] == len(data), "Actual photo byte size differs from metadata")
    segments = owned.inspect_jpeg(data)
    # All CI/synthetic identity, target-only payload, size and JPEG guards above
    # must pass before retaining even this owned diagnostic image.
    output = Path(args.output_dir)
    output.mkdir(parents=True, exist_ok=True)
    (output / "owned-picked-output.jpg").write_bytes(data)
    exif_reports = []
    for marker, payload, _, _ in segments:
        if marker == 0xe1 and payload.startswith(b"Exif\0\0"):
            report = dict(bytes=len(payload))
            try:
                report["directories"] = exif_tag_inventory(payload)
            except (ValueError, struct.error) as error:
                report["parseError"] = str(error)
            exif_reports.append(report)
    (output / "picked-photo-metadata-diagnostic.json").write_text(json.dumps(dict(
        diagnosticOnly=True,
        sourceSHA256=hashlib.sha256(source).hexdigest(),
        outputSHA256=hashlib.sha256(data).hexdigest(),
        outputBytes=len(data),
        syntheticMarkerPresent=owned.MARKER in data,
        exifSegments=exif_reports,
        hasExif=bool(exif_reports),
        metadataContract="Original Artist/GPS absent; only explicitly allowlisted fresh encoder fields permitted",
    ), indent=2) + "\n")
    validate_encoder_metadata(segments)
    require(owned.MARKER not in data, "Stored picker JPEG still contains synthetic Artist marker")
    (output / "picked-photo-storage-check.txt").write_text(
        "PASS: exact draft and single Photo.jpg retained after cold restart; all stored blob IDs equal all-chat references; "
        "removed first-import orphan absent. Target base64, byte size, JPEG SOI/EOI and 32x32 dimensions valid; "
        "original Artist/GPS and synthetic marker absent; only allowlisted encoder EXIF fields present. Synthetic CI fixture only.\n"
        f"Source SHA256: {hashlib.sha256(source).hexdigest()}\nOutput SHA256: {hashlib.sha256(data).hexdigest()}\n"
        "Limit: pipeline outcome only; Photos may strip EXIF before Nylo. No physical camera, HEIC, universal files, "
        "temporary-file deletion or native resource/task lifetime claim.\n")
    print("PASS: owned picker metadata outcome and SQLite blob-reference cleanup; see retained synthetic artifacts")


if __name__ == "__main__":
    main()
