#!/usr/bin/env bash
# CI-only UI qualification of the existing signed APK, never a native rebuild.
set -euo pipefail
test "${GITHUB_ACTIONS:-}" = true
test "${ANDROID_VERSION_CODE:-}" = 46
nylo_fixture_pid=""
nylo_tunnel_pid=""
nylo_record_pid=""
finish_demo() {
  adb shell pkill -2 screenrecord 2>/dev/null || true
  if [ -n "$nylo_record_pid" ]; then wait "$nylo_record_pid" || true; fi
  adb pull /sdcard/nylo-foreground-review.mp4 artifacts/android-ui/nylo-foreground-review.mp4 2>/dev/null || true
  if [ -f "$RUNNER_TEMP/foreground-server.log" ]; then
    cp "$RUNNER_TEMP/foreground-server.log" artifacts/android-ui/foreground-fixture-log.txt
  fi
  for pid in "$nylo_fixture_pid" "$nylo_tunnel_pid"; do
    if [ -n "$pid" ]; then kill "$pid" 2>/dev/null || true; fi
  done
}
trap finish_demo EXIT
adb root
adb wait-for-device
python3 scripts/android/foreground-demo-server.py > "$RUNNER_TEMP/foreground-server.log" 2>&1 &
nylo_fixture_pid=$!
curl -fsSL --retry 3 --connect-timeout 15 --max-time 120 https://github.com/cloudflare/cloudflared/releases/download/2026.11.0/cloudflared-linux-amd64 -o "$RUNNER_TEMP/nylo-cloudflared"
echo "51f7c68b57ed7269164075d7e789efce5b59355982f06392deeb037d982a51fd  $RUNNER_TEMP/nylo-cloudflared" | sha256sum -c -
chmod +x "$RUNNER_TEMP/nylo-cloudflared"
# Public TLS terminates at this disposable tunnel, whose only upstream is the
# synthetic stream above. No user data, real API key or provider proxy exists.
"$RUNNER_TEMP/nylo-cloudflared" tunnel --no-autoupdate --url http://127.0.0.1:8765 > "$RUNNER_TEMP/foreground-tunnel.log" 2>&1 &
nylo_tunnel_pid=$!
python3 - <<'PY'
import json, os, re, time, urllib.request
from pathlib import Path
log=Path(os.environ['RUNNER_TEMP'])/'foreground-tunnel.log'
for _ in range(120):
    text=log.read_text() if log.exists() else ''
    match=re.search(r'https://[a-z0-9-]+[.]trycloudflare[.]com',text)
    if match:
        try:
            with urllib.request.urlopen(match[0]+'/health',timeout=10) as response:
                assert json.load(response)['ready']
            break
        except Exception:
            pass
    time.sleep(1)
else: raise SystemExit('Disposable synthetic TLS fixture unavailable')
stamp=1794640000000
connection=dict(id='review-provider',name='Synthetic review demo',provider='custom',protocol='openai',baseUrl=match[0]+'/v1',model='qa-foreground',models=['qa-foreground'])
chat=dict(id='review-foreground',title='Synthetic background demo',connectionId=connection['id'],model='qa-foreground',draft='Demonstrate a user-initiated synthetic download continuing on Home.',messages=[],createdAt=stamp,updatedAt=stamp)
data=dict(version=1,connections=[connection],defaultConnectionId=connection['id'],agents=[],conversations=[chat])
Path('artifacts/android-ui/Nylo-foreground-demo.json').write_text(json.dumps(data)+'\n')
Path('artifacts/android-ui/foreground-disclosure.txt').write_text('Actual signed Android46; one owned synthetic stream via a disposable HTTPS tunnel; no real provider, user data or credentials. API32 emulator, not physical device timing.\n')
PY
adb push artifacts/android-ui/Nylo-foreground-demo.json /sdcard/Download/Nylo-foreground-demo.json
maestro="$RUNNER_TEMP/android-maestro/maestro/bin/maestro"
"$maestro" test --test-output-dir "$PWD/artifacts/android-ui/setup" --format junit --output artifacts/android-ui/setup.xml e2e/android-foreground-setup.yaml
adb shell settings put system show_touches 1
adb shell screenrecord --bit-rate 2000000 --size 720x1600 --time-limit 180 /sdcard/nylo-foreground-review.mp4 > "$RUNNER_TEMP/foreground-recorder.log" 2>&1 &
nylo_record_pid=$!
"$maestro" test --test-output-dir "$PWD/artifacts/android-ui/demo" --format junit --output artifacts/android-ui/results.xml e2e/android-foreground-demo.yaml
python3 - <<'PY'
import json
from pathlib import Path
events=[json.loads(line) for line in Path('artifacts/android-ui/foreground-events.jsonl').read_text().splitlines()]
assert sum(e['event']=='request' for e in events)==1
ordered=[next(e['time'] for e in events if e['event']==name) for name in ['request','home_with_foreground_service','stream_finished','durable_complete_while_home']]
assert ordered==sorted(ordered)
assert next(e for e in events if e['event']=='durable_complete_while_home')['serviceReleased']
Path('artifacts/android-ui/foreground-verification.json').write_text(json.dumps(dict(nativeBuild=46,realProviderRequests=0,syntheticRequests=1,completionWhileHome=True,serviceReleased=True,scope='Actual signed APK on disposable API32 emulator; no physical/lock-screen/duration claim'),indent=2)+'\n')
PY
