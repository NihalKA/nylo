"""Owned localhost-only stream fixtures for a disposable native CI app."""
import json
import os
from pathlib import Path
import sqlite3
import sys

container = Path(sys.argv[1]).resolve()
if os.environ.get('GITHUB_ACTIONS') != 'true' or not {'CoreSimulator', 'Devices', 'Application'}.issubset(container.parts):
    raise SystemExit('Background fixtures are restricted to disposable GitHub simulators.')
p = container / 'Documents/SQLite/nylo.db'
assert p.is_file()
stamp = 1794200000000
connection = dict(id='background-provider', name='Owned localhost QA', provider='custom', protocol='openai', baseUrl='https://localhost:8765/v1', model='qa-background', models=['qa-background', 'qa-memory', 'qa-stop'])
agent = dict(id='background-agent', name='QA background agent', description='Owned local memory fixture', instructions='No real provider or user data.', color='#246B58', createdAt=stamp, memories=[])
chats = []
for kind in ['background', 'memory', 'stop']:
    chat = dict(id='background-'+kind, title='Example: '+kind+' stream', connectionId=connection['id'], model='qa-'+kind, draft='Owned QA '+kind, messages=[], createdAt=stamp, updatedAt=stamp)
    if kind == 'memory': chat['agentId'] = agent['id']
    chats.append(chat)
data = dict(version=1, connections=[connection], defaultConnectionId=connection['id'], agents=[agent], conversations=chats)
with sqlite3.connect(p) as db:
    row = db.execute('SELECT json FROM app_state WHERE id=1').fetchone()
    prev = json.loads(row[0]) if row else {}
    assert not any(prev.get(k) for k in ['connections', 'agents', 'conversations']), 'Refusing nonempty app state'
    assert db.execute('SELECT count(*) FROM attachment_blobs').fetchone()[0] == 0
    db.execute('INSERT INTO app_state(id,json) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json', (json.dumps(data),))
print('Owned localhost-only fixtures seeded; no real credentials/provider destinations.')
