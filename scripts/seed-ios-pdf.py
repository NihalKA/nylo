"""Owned PDF draft for disposable CI only; no credentials or live requests."""
import argparse
import base64
import json
import os
from pathlib import Path
import sqlite3

parser = argparse.ArgumentParser()
parser.add_argument('--container', required=True)
args = parser.parse_args()
container = Path(args.container).resolve()
if os.environ.get('GITHUB_ACTIONS') != 'true' or not {'CoreSimulator', 'Devices', 'Application'}.issubset(container.parts):
    raise SystemExit('PDF seeding is restricted to disposable GitHub CI simulators.')
db_path = container / 'Documents/SQLite/nylo.db'
if not db_path.is_file():
    raise SystemExit('Launch the fresh app before seeding its database.')
pdf = b'%PDF-1.4\n% Owned synthetic QA document; no personal policy content.\n%%EOF\n'
attachment = dict(id='pdf-owned', name='QA policy.pdf', mimeType='application/pdf', size=len(pdf), data=base64.b64encode(pdf).decode())
stamp = 1794120000000
connections = [dict(id='pdf-chat-completions', name='QA Chat Completions', provider='custom', protocol='compatible', baseUrl='https://example.invalid/v1', model='synthetic-model'), dict(id='pdf-responses', name='QA Responses', provider='custom', protocol='openai', baseUrl='https://responses.example.invalid/v1', model='synthetic-model')]
chat = dict(id='pdf-removal', title='Example: PDF removal', connectionId=connections[0]['id'], draft='Explain this test policy', draftAttachments=[attachment], messages=[], createdAt=stamp, updatedAt=stamp)
route_chat = {**chat, 'id': 'pdf-connection', 'title': 'Example: PDF connection', 'draftAttachments': [{**attachment, 'id': 'pdf-owned-route'}], 'updatedAt': stamp-1}
data = dict(version=1, connections=connections, defaultConnectionId=connections[0]['id'], agents=[], conversations=[chat, route_chat])
with sqlite3.connect(db_path) as db:
    row = db.execute('SELECT json FROM app_state WHERE id=1').fetchone()
    previous = json.loads(row[0]) if row else {}
    if any(previous.get(key) for key in ('connections', 'agents', 'conversations')):
        raise SystemExit('Refusing to replace a nonempty app database.')
    if db.execute("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='attachment_blobs'").fetchone()[0] and db.execute('SELECT count(*) FROM attachment_blobs').fetchone()[0]:
        raise SystemExit('Refusing to replace existing attachment blobs.')
    db.execute('INSERT INTO app_state(id,json) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json', (json.dumps(data),))
print('Seeded owned PDF removal draft, no keys and no network-capable endpoints.')
