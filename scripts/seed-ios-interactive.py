"""Seed synthetic interactive replies only in a fresh, disposable CI simulator."""
import argparse
import json
import os
from pathlib import Path
import sqlite3

parser = argparse.ArgumentParser()
parser.add_argument("--container", required=True)
args = parser.parse_args()
container = Path(args.container).resolve()
if os.environ.get("GITHUB_ACTIONS") != "true" or not {"CoreSimulator", "Devices", "Application"}.issubset(container.parts):
    raise SystemExit("Interactive seeding is restricted to disposable GitHub CI simulators.")
database = container / "Documents/SQLite/nylo.db"
if not database.is_file():
    raise SystemExit("Launch the disposable app before seeding.")
fixture = json.loads((Path(__file__).resolve().parents[1] / "e2e/fixtures/interactive.json").read_text())
with sqlite3.connect(database) as db:
    row = db.execute("SELECT json FROM app_state WHERE id=1").fetchone()
    previous = json.loads(row[0]) if row else {}
    # Home may have created an empty draft on its first launch. Only that
    # content-free startup state may be replaced, never any actual conversation.
    occupied = any(previous.get(k) for k in ("connections", "agents")) or any(
        c.get("messages") or c.get("draft") or c.get("draftAttachments") or c.get("agentId")
        for c in previous.get("conversations", [])
    )
    if occupied or db.execute("SELECT count(*) FROM attachment_blobs").fetchone()[0]:
        raise SystemExit("Refusing to replace a nonempty app database.")
    db.execute("INSERT INTO app_state(id,json) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json", (json.dumps(fixture),))
print("Seeded 3 synthetic interactive replies; no credentials or provider requests.")
