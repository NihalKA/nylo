"""Owned offline backup, restored through the normal Android document picker."""
import base64
import json
from pathlib import Path
import struct
import sys
import zlib

stamp = 1794120000000

def message(identifier, role, text):
    return dict(id=identifier, role=role, text=text, status='complete', createdAt=stamp)

def chat(identifier, title, messages=None, **extra):
    return dict(id=identifier, title=title, connectionId='gallery-provider',
                messages=messages or [], createdAt=stamp, updatedAt=stamp, **extra)

def chunk(kind, content):
    return struct.pack('>I', len(content)) + kind + content + struct.pack('>I', zlib.crc32(kind + content) & 0xffffffff)

png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 32, 32, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(b''.join(b'\x00' + bytes([36, 107, 88]) * 32 for _ in range(32)))) + chunk(b'IEND', b'')
pdf = b'%PDF-1.4\n% Owned synthetic QA document; no personal content.\n%%EOF\n'
response = 'Start with one meaningful task.\n\nChoose a priority, work with notifications off, then take a break. This is a human-authored offline QA example.'
data = dict(version=1, defaultConnectionId='gallery-provider', connections=[
    dict(id='gallery-provider', name='Offline QA provider', protocol='openai', provider='custom', baseUrl='https://example.invalid/v1', model='synthetic-no-network', models=['synthetic-no-network', 'synthetic-secondary']),
    dict(id='gallery-compatible', name='QA Chat Completions', protocol='compatible', provider='custom', baseUrl='https://alternate.example.invalid/v1', model='synthetic-model'),
], agents=[dict(id='gallery-writer', name='Writing partner', description='Clear words, in your voice.', instructions='Write with warmth and clarity.', connectionId='', color='#1E2B58', createdAt=stamp, goal='Keep the project moving', workflow='plan', shareRecentChats=False, memories=[dict(id='gallery-memory', text='Use friendly, direct language.', createdAt=stamp)])], conversations=[
    chat('gallery-morning', 'Example: A focused morning', [message('morning-user', 'user', 'Help me plan a calm, focused morning.'), message('morning-answer', 'assistant', response)]),
    chat('gallery-prior', 'Example: Project context', [message('prior-user', 'user', 'Our launch date is Friday.'), message('prior-answer', 'assistant', 'We will use Friday as the launch date.\n\n**Done:** The draft is ready.\n**Next:** Review the small-screen layout.')], agentId='gallery-writer'),
    chat('gallery-files', 'Example: Attachments ready', draft='Review these files', draftAttachments=[dict(id='gallery-image', name='QA image.png', mimeType='image/png', size=len(png), data=base64.b64encode(png).decode()), dict(id='gallery-text', name='QA note.txt', mimeType='text/plain', size=25, data='Synthetic attachment note')]),
    {**chat('gallery-pdf', 'Example: PDF connection', draft='Explain this test policy', draftAttachments=[dict(id='gallery-pdf-file', name='QA policy.pdf', mimeType='application/pdf', size=len(pdf), data=base64.b64encode(pdf).decode())]), 'connectionId': 'gallery-compatible'},
])
assert all(c['baseUrl'].split('/')[2].endswith('.invalid') for c in data['connections'])
Path(sys.argv[1]).write_text(json.dumps(data, indent=2) + '\n')
print('Created owned synthetic backup: no credentials, no callable provider endpoints.')
