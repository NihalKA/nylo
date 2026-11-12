"""Export only the known synthetic SDK sample files from a disposable CI database."""
import base64
import json
import sqlite3
import sys
from pathlib import Path

database, output = Path(sys.argv[1]).resolve(), Path(sys.argv[2])
with sqlite3.connect(database.as_uri() + '?mode=ro', uri=True) as db:
    state = json.loads(db.execute('SELECT json FROM app_state WHERE id=1').fetchone()[0])
    assert len(state['conversations']) == 1, 'Refuse to export a non-synthetic database'
    chat = state['conversations'][0]
    assert chat['title'] == 'Example: SDK image'
    connection = next(c for c in state['connections'] if c['id'] == chat['connectionId'])
    assert connection['baseUrl'] == 'https://example.invalid/v1'
    assert connection['model'] == 'synthetic-no-network'
    assert chat['messages'][0]['text'].startswith('Synthetic offline SDK example.')
    files = chat['messages'][0]['generatedFiles']
    assert len(files) == 3
    output.mkdir(parents=True, exist_ok=True)
    for mime, expected, destination in [
        ('application/pdf', 'Offline SDK report.pdf', 'sdk-report.pdf'),
        ('text/plain', 'Offline SDK text.txt', 'sdk-notes.txt'),
    ]:
        file = next(f for f in files if f['mimeType'] == mime)
        assert file['name'] == expected
        assert 'data' not in file, 'Expected persisted blob storage'
        data = db.execute('SELECT data FROM attachment_blobs WHERE id=?', (file['blobId'],)).fetchone()[0]
        payload = data.encode('utf-8') if mime == 'text/plain' else base64.b64decode(data, validate=True)
        assert len(payload) == file['size']
        assert payload.startswith(b'%PDF-') if mime == 'application/pdf' else 'Synthetic offline sample.' in data
        (output / destination).write_bytes(payload)
print('Exported synthetic SDK PDF/text files; no database or credentials copied to artifacts.')
