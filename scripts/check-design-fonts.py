"""Check the actual bundled SFNT files before native font registration."""

import hashlib
import json
from pathlib import Path
import struct


ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / "assets/fonts"
manifest = json.loads((FONT_DIR / "sources.json").read_text())
for entry in manifest:
    path = FONT_DIR / entry["file"]
    assert hashlib.sha256(path.read_bytes()).hexdigest() == entry["sha256"], path

seen = set()
runtime_fonts = []
for path in sorted(FONT_DIR.glob("*.ttf")):
    if "variable" in path.name:
        continue
    data = path.read_bytes()
    assert data[:4] in (b"\x00\x01\x00\x00", b"OTTO"), path
    count = struct.unpack_from(">H", data, 4)[0]
    tables = {}
    for index in range(count):
        tag, _, offset, length = struct.unpack_from(">4sIII", data, 12 + index * 16)
        assert offset + length <= len(data), (path, tag)
        tables[tag] = data[offset : offset + length]
    assert b"fvar" not in tables, (path, "runtime faces must be static")
    names = tables[b"name"]
    _, count, string_offset = struct.unpack_from(">HHH", names)
    postscript_names = set()
    for index in range(count):
        platform, _, _, name_id, length, offset = struct.unpack_from(
            ">HHHHHH", names, 6 + index * 12
        )
        if name_id == 6 and platform in (0, 3):
            value = names[string_offset + offset : string_offset + offset + length]
            postscript_names.add(value.decode("utf-16-be"))
    assert len(postscript_names) == 1, (path, postscript_names)
    postscript = postscript_names.pop()
    assert postscript not in seen, (
        path,
        f"duplicate PostScript name {postscript}: CoreText can serve the wrong face",
    )
    seen.add(postscript)
    weight = struct.unpack_from(">H", tables[b"OS/2"], 4)[0]
    if path.stem.rsplit("-", 1)[-1].isdigit():
        assert weight == int(path.stem.rsplit("-", 1)[-1]), path
    runtime_fonts.append({"file": path.name, "postScript": postscript, "weight": weight})

assert len(runtime_fonts) == 11, len(runtime_fonts)
print(json.dumps({"fonts": runtime_fonts, "checks": "SFNT bounds, source hashes, static weights and unique native face names passed"}, indent=2))
