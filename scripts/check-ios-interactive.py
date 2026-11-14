"""Verify saved synthetic UI choices without exporting the simulator database."""
import argparse
import json
import os
from pathlib import Path
import sqlite3

parser = argparse.ArgumentParser()
parser.add_argument("--container", required=True)
parser.add_argument("--output", required=True)
args = parser.parse_args()
container = Path(args.container).resolve()
if os.environ.get("GITHUB_ACTIONS") != "true" or not {"CoreSimulator", "Devices", "Application"}.issubset(container.parts):
    raise SystemExit("Interactive verification is restricted to disposable CI simulators.")
with sqlite3.connect(f"file:{container / 'Documents/SQLite/nylo.db'}?mode=ro", uri=True) as db:
    row = db.execute("SELECT json FROM app_state WHERE id=1").fetchone()
data = json.loads(row[0])
if any(c.get("baseUrl") != "https://example.invalid/v1" for c in data["connections"]):
    raise SystemExit("Refusing a real-provider database.")
expected = {
    "interactive-expenses": {"category": "All"},
    "interactive-planning": {"goal": "A quiet weekend", "notes": ""},
    "interactive-phones": {"budget": 41000, "priority": "Camera"},
}
for identifier, values in expected.items():
    chat = next(c for c in data["conversations"] if c["id"] == identifier)
    reply = next(m for m in chat["messages"] if m["role"] == "assistant")
    if reply["interactive"]["values"] != values:
        raise SystemExit(f"Saved choices do not match for {identifier}.")
    if len(chat["messages"]) != 2:
        raise SystemExit("Local-only controls unexpectedly added a model turn.")
Path(args.output).write_text(json.dumps({
    "status": "passed",
    "scope": "Synthetic native UI choices persisted after restart; no provider request.",
    "verifiedConversations": list(expected),
}, indent=2) + "\n")
print("Native form, slider and selector values persisted; no extra user/model turns.")
