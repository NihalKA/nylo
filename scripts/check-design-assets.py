"""Verify that local design artwork still matches the original MCP exports."""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
directory = root / "assets/figma"
manifest = json.loads((directory / "provenance.json").read_text())
assert len(manifest) == 45, "Unexpected design artwork inventory"
for name, item in manifest.items():
    path = directory / item["file"]
    data = path.read_bytes()
    assert data and hashlib.sha256(data).hexdigest() == item["sha256"], name
    svg = ET.fromstring(data)
    assert float(svg.attrib["width"]) == item["width"], name
    assert float(svg.attrib["height"]) == item["height"], name
    assert item["fileKey"] == "WNCRguvh0wqYTgBUlbXZ9G" and item["node"], name
print(f"Original SVG bytes, intrinsic dimensions and source nodes verified for {len(manifest)} design assets.")
