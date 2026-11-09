#!/usr/bin/env python3
"""Assert actual Android composer bounds clear the real OS navigation area."""
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

source = Path(sys.argv[1])
mode = sys.argv[2]
root = ET.parse(source).getroot()

def bounds(node):
    values = [int(value) for value in re.findall(r"\d+", node.get("bounds", ""))]
    return values if len(values) == 4 else None

nodes = list(root.iter("node"))
nav_ids = {"navigation_bar_frame", "navigation_bar_view", "navigation_inflater", "home_handle", "navigation_handle"}
nav = [bounds(n) for n in nodes if n.get("package") == "com.android.systemui" and n.get("resource-id", "").rsplit("/", 1)[-1] in nav_ids]
nav = [b for b in nav if b and b[2] > b[0] and b[3] > b[1]]
navigation_source = "SystemUI XML"
if not nav:
    # API35's UIAutomator dump contains only the focused app window. The
    # navigation InsetsSource remains independently reported by WindowManager.
    window_dump = source.with_name("navigation-window-insets.txt")
    text = window_dump.read_text() if window_dump.exists() else ""
    for line in text.splitlines():
        if not re.search(r"(?:mType|type)=navigationBars\b", line):
            continue
        if not re.search(r"(?:mVisible|visible)=true\b", line):
            continue
        match = re.search(r"(?:mFrame|frame)=\[(-?\d+),\s*(-?\d+)\]\[(-?\d+),\s*(-?\d+)\]", line)
        if match:
            b = [int(x) for x in match.groups()]
            if b[2] > b[0] and b[3] > b[1] and b[1] > 0:
                nav.append(b)
    navigation_source = "WindowManager visible navigationBars InsetsSource"
assert nav, "No real SystemUI navigation bounds found; inspect retained hierarchy and WindowManager dump"
nav_top = min(b[1] for b in nav)
controls = {}
for node in nodes:
    label = node.get("content-desc", "")
    resource = node.get("resource-id", "")
    name = "composer" if resource.endswith("chat-message") else "attachments" if label == "Add attachment" else "model" if label.startswith("Choose model connection") else None
    if name:
        b = bounds(node)
        if b and b[3] > b[1]:
            assert b[3] <= nav_top, f"{name} overlaps system navigation: {b} vs top {nav_top}"
            controls[name] = b
assert {"composer", "attachments", "model"}.issubset(controls), "Final composer controls missing; inspect actual flow state"
result = {"navigation": mode, "navigationTop": nav_top, "navigationBoundsSource": navigation_source, "controls": controls, "result": "PASS", "scope": "Final chat with keyboard dismissed; keyboard/menu states retained in smoke captures"}
source.with_name("navigation-insets-check.json").write_text(json.dumps(result, indent=2) + "\n")
print("PASS: composer, attachment and model controls clear actual system navigation")
