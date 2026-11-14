"""Disposable CI synthetic stream; never a provider proxy or credential logger."""
import http.server
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import tempfile
import threading
import time

assert os.environ.get('GITHUB_ACTIONS') == 'true'
root = Path('artifacts/android-ui')
home = threading.Event()
finished = threading.Event()
requests = 0
lock = threading.Lock()
answer = 'Receiving the synthetic test stream. Finished while Nylo was in the background.'


def record(event, **facts):
    with lock:
        with (root / 'foreground-events.jsonl').open('a') as f:
            f.write(json.dumps(dict(event=event, time=time.time(), **facts)) + '\n')


def adb(*args):
    return subprocess.check_output(['adb', *args], timeout=15, stderr=subprocess.DEVNULL)


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_POST(self):
        global requests
        if self.server.server_port != 8765 or self.path != '/v1/responses':
            self.send_error(404)
            return
        if self.headers.get('Transfer-Encoding', '').lower() == 'chunked':
            chunks = []
            total = 0
            while True:
                size = int(self.rfile.readline(1024).strip().split(b';')[0], 16)
                assert 0 <= size <= 100000 and total + size <= 100000
                if size == 0:
                    for _ in range(16):
                        if self.rfile.readline(1024) in [b'\r\n', b'\n']:
                            break
                    break
                chunks.append(self.rfile.read(size))
                total += size
                assert self.rfile.read(2) == b'\r\n'
            raw = b''.join(chunks)
        else:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length < 100000:
                self.send_error(413)
                return
            raw = self.rfile.read(length)
        body = json.loads(raw)
        if body.get('model') != 'qa-foreground' or self.headers.get('Authorization') != 'Bearer nylo-ci-placeholder':
            self.send_error(403)
            return
        with lock:
            requests += 1
            count = requests
        if count != 1:
            self.send_error(409)
            return
        record('request', count=count)
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Accel-Buffering', 'no')
        self.end_headers()

        def event(value):
            self.wfile.write(('data: ' + json.dumps(value) + '\n\n').encode())
            self.wfile.flush()

        try:
            event(dict(type='response.created', response=dict(id='review-response', created_at=1, model='qa-foreground')))
            item = dict(type='message', id='review-message', status='completed', role='assistant', content=[])
            event(dict(type='response.output_item.added', output_index=0, item=item))
            event(dict(type='response.output_text.delta', item_id='review-message', delta='Receiving the synthetic test stream. '))
            assert home.wait(90), 'Home gate not reached'
            time.sleep(20)
            event(dict(type='response.output_text.delta', item_id='review-message', delta='Finished while Nylo was in the background.'))
            event(dict(type='response.output_item.done', output_index=0, item=item))
            event(dict(type='response.completed', response=dict(usage=dict(input_tokens=1, output_tokens=1, total_tokens=2))))
            record('stream_finished')
            finished.set()
        except (BrokenPipeError, ConnectionResetError):
            record('client_disconnected')

    def do_GET(self):
        if self.path == '/health':
            result = dict(ready=True)
        elif self.server.server_port == 8766 and self.path == '/home':
            services = adb('shell', 'dumpsys', 'activity', 'services', 'com.nylohq.nylo').decode()
            (root / 'foreground-service-while-home.txt').write_text(services)
            for _ in range(10):
                activities = adb('shell', 'dumpsys', 'activity', 'activities').decode()
                # Android versions report either mResumedActivity or
                # topResumedActivity. Retain the actual dump, not just a guess
                # at one platform version's field name.
                resumed = '\n'.join(line for line in activities.splitlines() if 'ResumedActivity' in line)
                if 'launcher' in resumed.lower():
                    break
                time.sleep(.5)
            (root / 'foreground-activities-while-home.txt').write_text(activities)
            (root / 'foreground-resumed-while-home.txt').write_text(resumed)
            assert 'launcher' in resumed.lower(), 'Nylo must be on Home'
            assert 'NyloResponseService' in services and 'isForeground=true' in services
            record('home_with_foreground_service')
            home.set()
            result = dict(ready=True)
        elif self.server.server_port == 8766 and self.path == '/complete':
            assert finished.wait(60), 'Stream did not finish'
            ready = False
            with tempfile.TemporaryDirectory(dir=os.environ['RUNNER_TEMP']) as directory:
                for _ in range(30):
                    for suffix in ['', '-wal', '-shm']:
                        subprocess.run(['adb', 'pull', '/data/user/0/com.nylohq.nylo/files/SQLite/nylo.db' + suffix, directory + '/nylo.db' + suffix], capture_output=True, timeout=15)
                    try:
                        with sqlite3.connect(directory + '/nylo.db') as db:
                            data = json.loads(db.execute('SELECT json FROM app_state WHERE id=1').fetchone()[0])
                        chat = next(c for c in data['conversations'] if c['id'] == 'review-foreground')
                        ready = chat['messages'][-1].get('status') == 'complete' and chat['messages'][-1].get('text') == answer
                        if ready:
                            break
                    except (sqlite3.Error, IndexError, StopIteration, TypeError):
                        pass
                    time.sleep(1)
            assert ready and requests == 1, 'Durable exact completion/no replay required'
            for _ in range(10):
                services = adb('shell', 'dumpsys', 'activity', 'services', 'com.nylohq.nylo').decode()
                if 'isForeground=true' not in services:
                    break
                time.sleep(1)
            (root / 'foreground-service-after-complete.txt').write_text(services)
            assert 'isForeground=true' not in services, 'Foreground service must release'
            record('durable_complete_while_home', requests=requests, serviceReleased=True)
            result = dict(ready=True)
        else:
            self.send_error(404)
            return
        payload = json.dumps(result).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(payload)


stream = http.server.ThreadingHTTPServer(('127.0.0.1', 8765), Handler)
control = http.server.ThreadingHTTPServer(('127.0.0.1', 8766), Handler)
threading.Thread(target=stream.serve_forever, daemon=True).start()
record('ready', disclosure='Owned synthetic stream only; no real provider or personal data.')
control.serve_forever()
