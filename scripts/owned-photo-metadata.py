"""TEST ONLY: add and validate known synthetic Artist/GPS EXIF, using stdlib only."""
import argparse
import hashlib
from pathlib import Path
import struct
import zlib

MARKER = b"NYLO_SYNTHETIC_OWNED_PHOTO_ONLY"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def owned_png():
    def chunk(kind, data):
        return (struct.pack(">I", len(data)) + kind + data +
                struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff))
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", 32, 32, 8, 2, 0, 0, 0)) +
            chunk(b"IDAT", zlib.compress((b"\0" + bytes([36, 107, 88]) * 32) * 32)) + chunk(b"IEND", b""))


def synthetic_exif():
    # TIFF offsets are relative to its header. IFD0: Artist and GPSInfo pointer.
    # GPS IFD: version 2.3.0.0, N 12deg34'56", E 65deg43'21" (synthetic).
    artist = MARKER + b"\0"
    artist_offset = 38
    gps_offset = artist_offset + len(artist)
    if gps_offset % 2:
        gps_offset += 1
    rational_offset = gps_offset + 2 + 5 * 12 + 4
    entry = lambda tag, kind, count, value: struct.pack("<HHI", tag, kind, count) + value
    offset = lambda value: struct.pack("<I", value)
    tiff = b"II" + struct.pack("<HI", 42, 8)
    tiff += struct.pack("<H", 2)
    tiff += entry(0x013b, 2, len(artist), offset(artist_offset))
    tiff += entry(0x8825, 4, 1, offset(gps_offset)) + offset(0)
    tiff += artist
    tiff += b"\0" * (gps_offset - len(tiff))
    tiff += struct.pack("<H", 5)
    tiff += entry(0, 1, 4, b"\x02\x03\0\0")
    tiff += entry(1, 2, 2, b"N\0\0\0")
    tiff += entry(2, 5, 3, offset(rational_offset))
    tiff += entry(3, 2, 2, b"E\0\0\0")
    tiff += entry(4, 5, 3, offset(rational_offset + 24)) + offset(0)
    tiff += b"".join(struct.pack("<II", n, 1) for n in (12, 34, 56, 65, 43, 21))
    return b"Exif\0\0" + tiff


def jpeg_segments(data):
    """Parse JPEG headers and entropy scans, rejecting truncated/trailing input."""
    require(data[:2] == b"\xff\xd8", "Expected JPEG SOI")
    pos = 2
    while pos < len(data):
        start = pos
        require(data[pos] == 255, "Malformed JPEG marker")
        while pos < len(data) and data[pos] == 255:
            pos += 1
        require(pos < len(data), "Truncated JPEG marker")
        marker = data[pos]
        pos += 1
        if marker == 0xd9:
            require(pos == len(data), "Trailing bytes after JPEG EOI")
            yield marker, b"", start, pos
            return
        require(marker not in (0, 0xd8, 1) and not 0xd0 <= marker <= 0xd7,
                "Unexpected standalone JPEG marker")
        require(pos + 2 <= len(data), "Missing JPEG segment length")
        length = struct.unpack_from(">H", data, pos)[0]
        require(length >= 2 and pos + length <= len(data), "Truncated JPEG segment")
        end = pos + length
        yield marker, data[pos + 2:end], start, end
        pos = end
        if marker == 0xda:
            # Entropy bytes escape FF as FF00; restart markers stay in the scan.
            while True:
                pos = data.find(b"\xff", pos)
                require(pos != -1, "JPEG scan lacks EOI")
                next_pos = pos + 1
                while next_pos < len(data) and data[next_pos] == 255:
                    next_pos += 1
                require(next_pos < len(data), "Truncated JPEG scan")
                if data[next_pos] == 0 or 0xd0 <= data[next_pos] <= 0xd7:
                    pos = next_pos + 1
                else:
                    break
    raise ValueError("JPEG lacks EOI")


def inspect_jpeg(data):
    segments = list(jpeg_segments(data))
    frames = [payload for marker, payload, _, _ in segments
              if marker in (0xc0, 0xc1, 0xc2)]
    require(len(frames) == 1 and len(frames[0]) >= 6, "Expected one JPEG frame")
    height, width = struct.unpack_from(">HH", frames[0], 1)
    require((width, height) == (32, 32), "Expected owned 32x32 JPEG")
    require(any(marker == 0xda for marker, _, _, _ in segments), "Missing JPEG scan")
    return segments


def validate_source(data):
    segments = inspect_jpeg(data)
    exif = [payload for marker, payload, _, _ in segments
            if marker == 0xe1 and payload.startswith(b"Exif\0\0")]
    # Exact known TIFF checks all tags, types, counts, offsets and rational values;
    # merely finding a marker string is insufficient source-validity evidence.
    require(exif == [synthetic_exif()], "Source lacks exact valid owned Artist/GPS EXIF")
    require(data.count(MARKER) == 1, "Source owned marker missing or duplicated")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--png", required=True)
    parser.add_argument("--jpeg", required=True, help="Fresh sips conversion; rewritten with owned EXIF")
    args = parser.parse_args()
    require(Path(args.png).read_bytes() == owned_png(), "Refusing anything except exact owned green PNG")
    path = Path(args.jpeg)
    data = path.read_bytes()
    segments = inspect_jpeg(data)
    require(MARKER not in data, "Expected fresh conversion, not already tagged input")
    # Replace any converter EXIF, retaining the actual sips-encoded JPEG pixels.
    exif = synthetic_exif()
    removed = [(start, end) for marker, payload, start, end in segments
               if marker == 0xe1 and payload.startswith(b"Exif\0\0")]
    cursor = 2
    result = b"\xff\xd8\xff\xe1" + struct.pack(">H", len(exif) + 2) + exif
    for start, end in removed:
        result += data[cursor:start]
        cursor = end
    result += data[cursor:]
    validate_source(result)
    path.write_bytes(result)
    print(f"PASS: owned 32x32 JPEG; valid synthetic Artist/GPS EXIF; SHA256 {hashlib.sha256(result).hexdigest()}")


if __name__ == "__main__":
    main()
