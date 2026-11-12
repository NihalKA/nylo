"""Local synthetic SSE, never a provider proxy. No request content/key logging."""
import http.server
import json
from pathlib import Path
import sqlite3
import ssl
import sys
import threading
import time

cert, key, db_path, evidence = map(Path, sys.argv[1:])
lock = threading.Lock()
counts = {}
home = {kind: threading.Event() for kind in ["background", "memory"]}
def record(event, **facts):
    with lock:
        with evidence.open('a') as f: f.write(json.dumps(dict(event=event, time=time.time(), **facts))+'\n')
class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *_): pass
    def do_POST(self):
        if self.server.server_port != 8765 or self.path != '/v1/responses':
            self.send_error(404); return
        n = int(self.headers.get('Content-Length', '0'))
        if n > 100000: self.send_error(413); return
        body = json.loads(self.rfile.read(n));model = body.get('model')
        if model not in ['qa-background', 'qa-memory', 'qa-stop'] or self.headers.get('Authorization') != 'Bearer nylo-ci-placeholder':
            self.send_error(403); return
        with lock: counts[model] = counts.get(model, 0)+1
        record('request', model=model)
        self.send_response(200);self.send_header('Content-Type','text/event-stream');self.end_headers()
        def event(value):
            self.wfile.write(('data: '+json.dumps(value)+'\n\n').encode());self.wfile.flush()
        try:
            event(dict(type='response.created', response=dict(id='resp_owned', created_at=1, model=model)))
            message = dict(type='message', id='msg_owned', role='assistant', status='completed', content=[])
            event(dict(type='response.output_item.added', output_index=0, item=message))
            event(dict(type='response.output_text.delta', item_id='msg_owned', delta='Phase one. '))
            if model == 'qa-stop':
                time.sleep(30)
            else:
                # The final output/tool is produced only after the driver's Home
                # action and control request. Slow CI cannot finish it in foreground.
                if not home[model.removeprefix('qa-')].wait(60):
                    record('home_gate_timeout', model=model)
                    return
                time.sleep(.5)
            if model == 'qa-memory':
                event(dict(type='response.output_item.done', output_index=0, item=message))
                call = dict(type='function_call', id='fc_owned', status='completed', call_id='owned-call', name='remember_fact', arguments=json.dumps(dict(text='Owned QA memory must not save in background')))
                event(dict(type='response.output_item.added', output_index=1, item=call))
                event(dict(type='response.output_item.done', output_index=1, item=call))
            else:
                event(dict(type='response.output_text.delta',item_id='msg_owned',delta='Completed in background.'))
                event(dict(type='response.output_item.done', output_index=0, item=message))
            record('final_output_sent', model=model)
            event(dict(type='response.completed', response=dict(usage=dict(input_tokens=1, output_tokens=1, total_tokens=2))));record('stream_finished', model=model)
        except (BrokenPipeError,ConnectionResetError,ssl.SSLError): record('client_stopped',model=model)
    def do_GET(self):
        if self.server.server_port != 8766 or self.path not in ['/complete','/memory']:
            self.send_error(404);return
        kind = 'background' if self.path == '/complete' else 'memory'
        record('home_gate_entered', kind=kind)
        home[kind].set()
        ready = False
        for _ in range(120):
            try:
                with sqlite3.connect(db_path.as_uri()+'?mode=ro',uri=True) as db:
                    data=json.loads(db.execute('SELECT json FROM app_state WHERE id=1').fetchone()[0])
                chat=next(x for x in data['conversations'] if x['id']=='background-'+kind)
                messages=chat['messages']
                expected='complete' if kind=='background' else 'interrupted'
                ready=bool(messages and messages[-1].get('status')==expected)
                if ready:
                    assert not data['agents'][0]['memories'], 'Unapproved memory mutation'
                    if kind=='background': assert messages[-1]['text']=='Phase one. Completed in background.'
                    assert counts.get('qa-'+kind)==1,'Unexpected repeat request'
                    record('durable_while_home',kind=kind,status=expected);break
            except (sqlite3.Error,StopIteration): pass
            time.sleep(.5)
        payload=json.dumps(dict(ready=ready)).encode();self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(payload)
server=http.server.ThreadingHTTPServer(('127.0.0.1',8765),Handler)
context=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER);context.load_cert_chain(cert,key);server.socket=context.wrap_socket(server.socket,server_side=True)
control=http.server.ThreadingHTTPServer(('127.0.0.1',8766),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
control.serve_forever()
