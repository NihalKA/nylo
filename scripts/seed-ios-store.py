"""Seed human-authored screenshot examples into a fresh disposable CI simulator.

This is ordinary AppData, never a shipping startup path or a provider request.
"""
import argparse
import json
import os
from pathlib import Path
import sqlite3

parser = argparse.ArgumentParser()
parser.add_argument("--container", required=True)
parser.add_argument("--manifest", required=True)
args = parser.parse_args()
container = Path(args.container).resolve()
if os.environ.get("GITHUB_ACTIONS") != "true" or not {"CoreSimulator", "Devices", "Application"}.issubset(container.parts):
    raise SystemExit("Store seeding is restricted to disposable GitHub CI simulators.")
db_path = container / "Documents/SQLite/nylo.db"
if not db_path.is_file():
    raise SystemExit("Launch the fresh app before seeding its database.")

stamp = 1794120000000
models = ["gpt-5.6-luna", "gpt-6.1-sol", "gpt-6-astra"]


def chat(identifier, title, question=None, answer=None, agent=None, age=0):
    messages = [] if question is None else [
        dict(id=identifier + "-user", role="user", text=question, status="complete", createdAt=stamp-age),
        dict(id=identifier + "-answer", role="assistant", text=answer, model=models[0], status="complete", createdAt=stamp-age),
    ]
    value = dict(id=identifier, title=title, connectionId="store-provider", messages=messages,
                 createdAt=stamp-age, updatedAt=stamp-age)
    if agent:
        value["agentId"] = agent
    return value


note = "Workshop outline\n\nWelcome and introductions\nSketch one idea\nShare feedback\nChoose a next step\n"
attachment = dict(id="store-workshop-note", name="Workshop outline.txt", mimeType="text/plain",
                  size=len(note.encode()), blobId="store-workshop-note")
draft = chat("store-workshop", "Example: Workshop notes", age=2000)
draft.update(draft="Help me turn this outline into a welcoming workshop.", draftAttachments=[attachment])
data = dict(version=1, connections=[dict(
    id="store-provider", name="NyloHQ", protocol="openai", provider="custom",
    baseUrl="https://codex.nylohq.com/v1", model=models[0], models=models,
)], defaultConnectionId="store-provider", agents=[dict(
    id="store-writer", name="Example: Writing partner", description="Clear words, in your voice.",
    instructions="Write with warmth and clarity. Keep suggestions practical.", connectionId="store-provider",
    color="#246B58", createdAt=stamp, memories=[], shareRecentChats=False, workflow="direct",
)], conversations=[
    chat("store-morning", "Example: A focused morning",
         "Help me make room for one meaningful task this morning.",
         "Start small and leave room to breathe.\n\n**A simple plan**\n• Choose the task that matters most.\n• Give it 40 minutes with notifications off.\n• Take a short walk before deciding what comes next.\n\nA little space can make a busy day feel more manageable."),
    chat("store-update", "Example: A thoughtful update",
         "Help me write a friendly update for our reading group.",
         "Hi everyone — our next gathering is Saturday.\n\nBring one passage you enjoyed and a question you would like to explore. There is no need to finish the book; everyone is welcome to join the conversation.",
         agent="store-writer", age=1000),
    draft,
])

with sqlite3.connect(db_path) as db:
    row = db.execute("SELECT json FROM app_state WHERE id=1").fetchone()
    previous = json.loads(row[0]) if row else {}
    if any(previous.get(key) for key in ("connections", "agents", "conversations")) or db.execute("SELECT count(*) FROM attachment_blobs").fetchone()[0]:
        raise SystemExit("Refusing to replace a nonempty app database.")
    db.execute("INSERT INTO attachment_blobs(id,data) VALUES(?,?)", (attachment["id"], note))
    db.execute("INSERT INTO app_state(id,json) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json", (json.dumps(data),))

Path(args.manifest).write_text(json.dumps(dict(
    status="seeded_awaiting_native_capture_and_visual_review", purpose="App Store screenshot proposal only",
    disclosure="Human-authored illustrative conversations and attachment; not live AI output, customer data, catalog discovery, or provider request evidence.",
    provider="NyloHQ", models=models, credentials="No SecureStore key is created; no credentialId or provider consent is seeded.",
    memory="Starts empty. The flow explicitly saves a human-authored preference through the native local Save memory action; no AI tool approval is claimed.",
    branding="Existing original Nylo UI only; text attachment is original illustrative content.",
    captures=[], uploadApproved=False,
), indent=2) + "\n")
print("Seeded 3 human-authored Example conversations; no keys or provider requests.")
