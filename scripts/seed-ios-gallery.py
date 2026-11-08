"""Seed synthetic, offline UI examples into a fresh CI simulator only."""
import argparse
import json
import os
from pathlib import Path
import sqlite3

parser = argparse.ArgumentParser()
parser.add_argument("--container", required=True)
parser.add_argument("--expected-copy", required=True)
args = parser.parse_args()
container = Path(args.container).resolve()
if os.environ.get("GITHUB_ACTIONS") != "true" or not {"CoreSimulator", "Devices", "Application"}.issubset(container.parts):
    raise SystemExit("Gallery seeding is restricted to disposable GitHub CI simulators.")
db_path = container / "Documents/SQLite/nylo.db"
if not db_path.is_file():
    raise SystemExit("Launch the fresh app before seeding its database.")

stamp = 1794120000000


def message(identifier, role, text, status="complete", error=None):
    value = dict(id=identifier, role=role, text=text, status=status, createdAt=stamp)
    if role == "assistant":
        value["model"] = "Synthetic QA example"
    if error:
        value["error"] = error
    return value


def chat(identifier, title, messages, agent=None, age=0):
    value = dict(id=identifier, title=title, connectionId="", messages=messages,
                 createdAt=stamp-age, updatedAt=stamp-age)
    if agent:
        value["agentId"] = agent
    return value


focused_response = "Start with one meaningful task.\n\n**Your first hour**\n• 10 minutes: clear your desk and choose a priority.\n• 40 minutes: work with notifications off.\n• 10 minutes: take a break and decide what comes next.\n\nLeave some room between tasks. A useful morning does not need to be a crowded one."

history = []
for index in range(100):
    history.extend([
        message(f"history-user-{index}", "user", f"Example question {index + 1}: what is the next useful step?"),
        message(f"history-answer-{index}", "assistant",
                "Latest example answer: history is intact." if index == 99 else
                f"Example answer {index + 1}: choose one clear task, finish it, then review what changed."),
    ])
data = dict(version=1, connections=[dict(id="gallery-provider", name="Offline QA provider", protocol="openai", provider="custom", baseUrl="https://example.invalid/v1", model="synthetic-no-network"), dict(id="gallery-alternate", name="Offline QA alternate", protocol="openai", provider="custom", baseUrl="https://alternate.example.invalid/v1", model="synthetic-alternate")], defaultConnectionId="gallery-provider", agents=[dict(
    id="gallery-writer", name="Writing partner", description="Clear words, in your voice.",
    instructions="Write with warmth and clarity.", connectionId="", color="#246B58", createdAt=stamp,
    memories=[dict(id="gallery-memory", text="Use friendly, direct language.", createdAt=stamp)],
)], conversations=[
    chat("gallery-morning", "Example: A focused morning", [
        message("morning-user", "user", "Help me plan a calm, focused morning."),
        message("morning-answer", "assistant", focused_response),
    ]),
    chat("gallery-update", "Example: A clear project update", [
        message("update-user", "user", "Help me send a concise project update."),
        message("update-answer", "assistant", "Hi team — the first draft is ready.\n\n**Done:** the main flow and initial review.\n**Next:** check the small-screen layout and address feedback.\n\nPlease send any comments by Thursday so I can include them in the next version."),
    ], agent="gallery-writer", age=1000),
    chat("gallery-error", "Example: Recover a connection", [
        message("error-user", "user", "Can we continue where we left off?"),
        message("error-answer", "assistant", "", status="error",
                error="Example: connection unavailable. Your draft and earlier messages are still saved."),
    ], age=2000),
    chat("gallery-history", "Example: A longer conversation", history, age=3000),
])

# Harmless owned pixel fixture; never a live provider answer or customer file.
import base64
import struct
import zlib

def png_chunk(kind, content):
    return struct.pack(">I", len(content)) + kind + content + struct.pack(">I", zlib.crc32(kind + content) & 0xffffffff)
owned_png = b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", struct.pack(">IIBBBBB", 32, 32, 8, 2, 0, 0, 0)) + png_chunk(b"IDAT", zlib.compress(b"".join(b"\x00" + bytes([36,107,88]) * 32 for _ in range(32)))) + png_chunk(b"IEND", b"")
photo = dict(id="gallery-owned-image",name="QA image.png",mimeType="image/png",size=len(owned_png),data=base64.b64encode(owned_png).decode())
text_file = dict(id="gallery-owned-text",name="QA note.txt",mimeType="text/plain",size=25,data="Synthetic attachment note")
data["connections"][0]["models"] = ["synthetic-no-network", "synthetic-secondary"]
data["agents"][0].update(shareRecentChats=True,goal="Keep the project moving",workflow="plan")
prior = chat("gallery-agent-prior","Example: Project context",[message("prior-user","user","Our launch date is Friday."),message("prior-answer","assistant","We will use Friday as the launch date.")],agent="gallery-writer",age=5000)
attachments_chat = chat("gallery-attachments","Example: Attachments ready",[],age=6000)
attachments_chat.update(draft="Review these files",draftAttachments=[photo,text_file])
data["conversations"].extend([prior,attachments_chat])

with sqlite3.connect(db_path) as db:
    row = db.execute("SELECT json FROM app_state WHERE id=1").fetchone()
    previous = json.loads(row[0]) if row else {}
    if any(previous.get(key) for key in ("connections", "agents", "conversations")):
        raise SystemExit("Refusing to replace a nonempty app database.")
    db.execute("INSERT INTO app_state(id,json) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json", (json.dumps(data),))
Path(args.expected_copy).write_text(focused_response)
print("Seeded four explicitly synthetic offline QA conversations; no keys or live provider calls.")
