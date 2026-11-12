"""Disposable CI emulator input bridge; never serves app/provider data."""
import http.server
import json
import re
import subprocess


class Handler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/double-tap' or int(self.headers.get('Content-Length', '0')) > 128:
            self.send_error(400)
            return
        self.rfile.read(int(self.headers.get('Content-Length', '0')))
        try:
            size = subprocess.check_output(['adb', 'shell', 'wm', 'size'], text=True, timeout=10)
            width, height = map(int, re.findall(r'(\d+)x(\d+)', size)[-1])
            result = subprocess.run([
                'adb', 'shell', 'CLASSPATH=/data/local/tmp/nylo-gesture-input.dex',
                'app_process', '/system/bin', 'NyloGestureInput', str(width // 2), str(height // 2),
            ], capture_output=True, text=True, timeout=20)
            if result.returncode or 'Native double-tap injected; gapMs=' not in result.stdout:
                raise RuntimeError('Native input failed: ' + (result.stderr + result.stdout)[:1500])
            body = json.dumps({'result': result.stdout.strip()}).encode()
            print(result.stdout.strip(), flush=True)
            code = 200
        except Exception as error:
            body = json.dumps({'error': str(error)}).encode()
            code = 500
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


http.server.HTTPServer(('127.0.0.1', 8766), Handler).serve_forever()
