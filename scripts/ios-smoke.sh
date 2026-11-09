#!/usr/bin/env bash
set -euo pipefail
: "${SOURCE_RUN_ID:?Pass the native validation run ID}"
: "${GH_TOKEN:?Artifact read token required}"
mkdir -p artifacts/e2e
profile="${UI_PROFILE:-large}"
scenario="${UI_SCENARIO:-smoke}"
case "$profile" in compact|large|large-text) ;; *) echo 'Unknown UI profile'; exit 1 ;; esac
case "$scenario" in smoke|gallery|attachments|store|pdf|background) ;; *) echo 'Unknown UI scenario'; exit 1 ;; esac
if [ "$scenario" = store ] && { [ "$profile" != large ] || [ "${REFRESH_JS_BUNDLE:-false}" != false ]; }; then
  echo 'Store captures require the large profile and the original native JS bundle.'
  exit 1
fi
simulator_id=""
background_server_pid=""
phase="resolve-native-source"
mark_phase() {
  phase="$1"
  printf '%s\n' "$phase" > artifacts/e2e/phase.txt
}
collect_diagnostics() {
  result=$?
  printf 'Exit status: %s\nPhase: %s\nScenario: %s\nProfile: %s\n' "$result" "$phase" "$scenario" "$profile" > artifacts/e2e/execution.txt
  if [ -d "$HOME/.maestro/tests" ]; then
    mkdir -p artifacts/e2e/driver-diagnostics
    cp -R "$HOME/.maestro/tests/." artifacts/e2e/driver-diagnostics/ || true
  fi
  if [ -n "$background_server_pid" ]; then
    kill "$background_server_pid" || true
    xcrun simctl spawn "$simulator_id" log show --last 15m --style compact --predicate 'process == "Nylo" AND eventMessage CONTAINS "[NyloBackgroundResponse]"' > artifacts/e2e/background-native.log 2>&1 || true
  fi
  if [ "$scenario" = background ]; then
    # Simulator process signatures are also checked by the macOS host. Keep
    # its reason separately from SpringBoard's generic launch denial.
    sudo log show --last 5m --style compact --predicate 'process == "taskgated-helper" OR process == "taskgated" OR process == "amfid"' > artifacts/e2e/background-host-signing.log 2>&1 || true
  fi
  if [ -n "$simulator_id" ]; then
    if [ "$scenario" = background ]; then
      # Preserve the OS denial reason even if install/launch fails before the
      # owned server starts. These disposable fixtures contain no real keys.
      xcrun simctl spawn "$simulator_id" log show --last 5m --style compact --predicate 'eventMessage CONTAINS "com.nylohq.nylo" OR process == "amfid" OR process == "Nylo"' > artifacts/e2e/background-launch.log 2>&1 || true
      mkdir -p artifacts/e2e/crash-reports
      find "$HOME/Library/Logs/DiagnosticReports" -maxdepth 1 -name 'Nylo*.ips' -exec cp '{}' artifacts/e2e/crash-reports/ \; 2>/dev/null || true
    fi
    xcrun simctl shutdown "$simulator_id" || true
    xcrun simctl delete "$simulator_id" || true
  fi
}
trap collect_diagnostics EXIT
mark_phase resolve-native-source
gh api "repos/$GITHUB_REPOSITORY/actions/runs/$SOURCE_RUN_ID" > artifacts/e2e/native-source-run.json
source_sha="$(python3 - artifacts/e2e/native-source-run.json "$GITHUB_REPOSITORY" <<'PYRUN'
import json, re, sys
run=json.load(open(sys.argv[1]))
if (run.get("name") != "iOS native validation" or run.get("conclusion") != "success" or
    run.get("head_branch") != "main" or run.get("head_repository", {}).get("full_name") != sys.argv[2] or
    not re.fullmatch(r"[0-9a-f]{40}", run.get("head_sha", ""))):
    raise SystemExit("Use a successful native validation run from this repository's main branch.")
print(run["head_sha"])
PYRUN
)"
flow_sha="$(git rev-parse HEAD)"
js_source_sha="$source_sha"
if [ "${REFRESH_JS_BUNDLE:-false}" = true ]; then js_source_sha="$flow_sha"; fi
printf 'Native source: %s\nUI flows: %s\n' "$source_sha" "$flow_sha" > artifacts/e2e/source.txt
printf 'Refreshed JS bundle: %s\nJS source: %s\n' "${REFRESH_JS_BUNDLE:-false}" "$js_source_sha" >> artifacts/e2e/source.txt
printf 'Scenario: %s\nProfile: %s\nNative run: %s\nUI run: %s\n' "$scenario" "$profile" "$SOURCE_RUN_ID" "${GITHUB_RUN_ID:-manual}" >> artifacts/e2e/source.txt
shasum -a 256 "e2e/ios-$scenario.yaml" scripts/ios-smoke.sh scripts/seed-ios-gallery.py > artifacts/e2e/fixture-sha256.txt
if [ "$scenario" = pdf ]; then
  shasum -a 256 scripts/seed-ios-pdf.py >> artifacts/e2e/fixture-sha256.txt
fi
if [ "$scenario" = background ]; then
  shasum -a 256 scripts/seed-ios-background.py scripts/background-stream-server.py scripts/background-wait.js >> artifacts/e2e/fixture-sha256.txt
fi
if [ "$scenario" = attachments ]; then
  shasum -a 256 scripts/owned-photo-metadata.py scripts/check-picked-photo-storage.py >> artifacts/e2e/fixture-sha256.txt
fi
if [ "$scenario" = store ]; then
  shasum -a 256 scripts/seed-ios-store.py >> artifacts/e2e/fixture-sha256.txt
fi
mark_phase download-native-artifact
gh run download "$SOURCE_RUN_ID" --repo "$GITHUB_REPOSITORY" --name "ios-simulator-$source_sha" -D artifacts/native
unzip -q artifacts/native/Nylo-simulator.zip -d "$RUNNER_TEMP/nylo-app"
if [ "${REFRESH_JS_BUNDLE:-false}" = true ]; then
  mark_phase refresh-js-bundle
  git fetch --no-tags origin "$source_sha" --depth=1
  # Native modules, Expo config and native icon assets must match the seed app.
  # This path supplies UI iteration evidence, never a signed release candidate.
  git diff --exit-code "$source_sha" HEAD -- package.json package-lock.json app.json \
    'app.config.*' assets modules plugins config ios android
  npx expo export:embed --platform ios --dev false --bytecode \
    --entry-file node_modules/expo-router/entry.js \
    --bundle-output "$RUNNER_TEMP/nylo-app/Nylo.app/main.jsbundle" \
    --assets-dest "$RUNNER_TEMP/nylo-app/Nylo.app" --max-workers 2
fi
mark_phase discover-simulator
xcrun simctl list -j > artifacts/e2e/simulator-inventory.json
device_type="$(python3 - "$profile" <<'PY'
import json, sys
inventory = json.load(open('artifacts/e2e/simulator-inventory.json'))
names = (['iPhone SE (3rd generation)', 'iPhone 16e', 'iPhone 17']
         if sys.argv[1] == 'compact' else ['iPhone 17 Pro Max', 'iPhone 16 Pro Max'])
types = {x['name']: x['identifier'] for x in inventory['devicetypes']}
print(next((types[n] for n in names if n in types), ''))
PY
)"
runtime_id="$(python3 - <<'PY'
import json
inventory = json.load(open('artifacts/e2e/simulator-inventory.json'))
runtimes = [x for x in inventory['runtimes'] if x.get('isAvailable') and x['name'].startswith('iOS')]
# Match the installed runtime used by the successful earlier XCTest session.
# Newer installed runtimes are a separate compatibility target, not an implicit upgrade.
runtimes.sort(key=lambda x: (not x['version'].startswith('26.2'), tuple(-int(n) for n in x['version'].split('.'))))
print(runtimes[0]['identifier'] if runtimes else '')
PY
)"
test -n "$device_type"
test -n "$runtime_id"
printf 'Device type: %s\nRuntime: %s\n' "$device_type" "$runtime_id" >> artifacts/e2e/source.txt
simulator_id="$(xcrun simctl create "Nylo $profile QA" "$device_type" "$runtime_id")"
test -n "$simulator_id"
mark_phase boot-simulator
xcrun simctl boot "$simulator_id" || true
xcrun simctl bootstatus "$simulator_id" -b
if [ "$profile" = large-text ]; then
  xcrun simctl ui "$simulator_id" content_size accessibility-extra-extra-extra-large
fi
xcrun simctl status_bar "$simulator_id" override --time '9:41' --dataNetwork wifi --wifiMode active --wifiBars 3 --batteryState charged --batteryLevel 100
mark_phase install-and-launch

xcrun simctl install "$simulator_id" "$RUNNER_TEMP/nylo-app/Nylo.app"
xcrun simctl launch "$simulator_id" com.nylohq.nylo
sleep 8
xcrun simctl io "$simulator_id" screenshot artifacts/e2e/00-native-launch.png
if [ "$scenario" = store ]; then
  xcrun simctl terminate "$simulator_id" com.nylohq.nylo
  app_container="$(xcrun simctl get_app_container "$simulator_id" com.nylohq.nylo data)"
  mark_phase seed-store-examples
  python3 scripts/seed-ios-store.py --container "$app_container" --manifest artifacts/e2e/store-manifest.json
  shasum -a 256 artifacts/native/Nylo-simulator.zip > artifacts/e2e/native-archive-sha256.txt
  # Preserve the complete installed bundle identity, not just its JS entry point.
  python3 - "$RUNNER_TEMP/nylo-app/Nylo.app" <<'PYAPP'
import hashlib, json, sys
from pathlib import Path
root = Path(sys.argv[1])
files = {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
         for p in sorted(root.rglob('*')) if p.is_file()}
Path('artifacts/e2e/native-bundle-sha256.json').write_text(json.dumps(files, indent=2) + '\n')
PYAPP
fi
if [ "$scenario" = gallery ] || [ "$scenario" = attachments ]; then
  xcrun simctl terminate "$simulator_id" com.nylohq.nylo
  app_container="$(xcrun simctl get_app_container "$simulator_id" com.nylohq.nylo data)"
  mark_phase seed-synthetic-data
  python3 scripts/seed-ios-gallery.py --container "$app_container" --expected-copy artifacts/e2e/expected-copy.txt
  echo 'Synthetic offline QA data, not live model output or customer history.' > artifacts/e2e/gallery-disclosure.txt
  if [ "$scenario" = attachments ]; then
    # Gallery keeps its original PNG. Only this newest owned EXIF JPEG is added to Photos.
    sips -s format jpeg artifacts/e2e/owned-picker-photo.png --out artifacts/e2e/owned-picker-photo.jpg
    python3 scripts/owned-photo-metadata.py --png artifacts/e2e/owned-picker-photo.png \
      --jpeg artifacts/e2e/owned-picker-photo.jpg > artifacts/e2e/owned-photo-source-check.txt
    shasum -a 256 artifacts/e2e/owned-picker-photo.png artifacts/e2e/owned-picker-photo.jpg >> artifacts/e2e/fixture-sha256.txt
    xcrun simctl addmedia "$simulator_id" artifacts/e2e/owned-picker-photo.jpg
  fi
fi
if [ "$scenario" = pdf ]; then
  xcrun simctl terminate "$simulator_id" com.nylohq.nylo
  app_container="$(xcrun simctl get_app_container "$simulator_id" com.nylohq.nylo data)"
  mark_phase seed-owned-pdf
  python3 scripts/seed-ios-pdf.py --container "$app_container"
fi
if [ "$scenario" = background ]; then
  [ "${REFRESH_JS_BUNDLE:-false}" = false ] || { echo 'Background validation requires a newly compiled native runtime.'; exit 1; }
  xcrun simctl terminate "$simulator_id" com.nylohq.nylo
  app_container="$(xcrun simctl get_app_container "$simulator_id" com.nylohq.nylo data)"
  python3 scripts/seed-ios-background.py "$app_container"
  cat > "$RUNNER_TEMP/background-tls.cnf" <<'CERT'
[req]
distinguished_name = dn
x509_extensions = v3
prompt = no
[dn]
CN = localhost
[v3]
subjectAltName = DNS:localhost,IP:127.0.0.1
basicConstraints = critical,CA:TRUE
keyUsage = critical,digitalSignature,keyEncipherment,keyCertSign
extendedKeyUsage = serverAuth
CERT
  openssl req -x509 -newkey rsa:2048 -nodes -days 1 -config "$RUNNER_TEMP/background-tls.cnf" -keyout "$RUNNER_TEMP/background-tls.key" -out "$RUNNER_TEMP/background-tls.crt" > /dev/null 2>&1
  xcrun simctl keychain "$simulator_id" add-root-cert "$RUNNER_TEMP/background-tls.crt"
  python3 scripts/background-stream-server.py "$RUNNER_TEMP/background-tls.crt" "$RUNNER_TEMP/background-tls.key" "$app_container/Documents/SQLite/nylo.db" artifacts/e2e/background-server.jsonl > artifacts/e2e/background-server.log 2>&1 &
  background_server_pid=$!
  echo 'Owned localhost synthetic SSE only; no real provider, user data or credentials. SQL completion is checked while the driver keeps Nylo on Home.' > artifacts/e2e/background-disclosure.txt
fi
mark_phase install-driver
curl -fsSL --retry 3 --retry-all-errors --retry-delay 3 --retry-max-time 120 --connect-timeout 15 --max-time 60 'https://github.com/mobile-dev-inc/Maestro/releases/download/cli-2.12.1/maestro.zip' -o "$RUNNER_TEMP/maestro.zip"
echo '54dbb0716425626604973cbb374c585ca30272375d9ce15177a1152765ddd9d7  '"$RUNNER_TEMP/maestro.zip" | shasum -a 256 -c -
unzip -q "$RUNNER_TEMP/maestro.zip" -d "$RUNNER_TEMP/maestro-cli"
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_DRIVER_STARTUP_TIMEOUT=300000
shasum -a 256 "$RUNNER_TEMP/nylo-app/Nylo.app/main.jsbundle" > artifacts/e2e/js-bundle-sha256.txt
mark_phase native-flow
"$RUNNER_TEMP/maestro-cli/maestro/bin/maestro" --device "$simulator_id" test --test-output-dir "$PWD/artifacts/e2e" --format junit --output artifacts/e2e/results.xml "e2e/ios-$scenario.yaml"
if [ "$scenario" = background ]; then
  mark_phase background-storage-verification
  python3 - "$app_container/Documents/SQLite/nylo.db" <<'BGVERIFY'
import json, sqlite3, sys
from pathlib import Path
with sqlite3.connect(Path(sys.argv[1]).as_uri()+'?mode=ro',uri=True) as db:
    data=json.loads(db.execute('SELECT json FROM app_state WHERE id=1').fetchone()[0])
chats={x['id']:x for x in data['conversations']}
assert chats['background-background']['messages'][-1]['status']=='complete'
assert chats['background-background']['messages'][-1]['text']=='Phase one. Completed in background.'
assert chats['background-memory']['messages'][-1]['status']=='interrupted'
assert chats['background-stop']['messages'][-1]['status']=='interrupted'
assert not data['agents'][0]['memories']
records=[json.loads(line) for line in Path('artifacts/e2e/background-server.jsonl').read_text().splitlines()]
assert sorted(x['model'] for x in records if x['event']=='request')==['qa-background','qa-memory','qa-stop']
assert sorted(x['kind'] for x in records if x['event']=='durable_while_home')==['background','memory']
for kind in ['background','memory']:
    entered=next(x['time'] for x in records if x['event']=='home_gate_entered' and x['kind']==kind)
    finished=next(x['time'] for x in records if x['event']=='final_output_sent' and x['model']=='qa-'+kind)
    persisted=next(x['time'] for x in records if x['event']=='durable_while_home' and x['kind']==kind)
    assert entered < finished <= persisted, 'Output must be produced and persisted after Home, before foreground return'
Path('artifacts/e2e/background-storage-check.txt').write_text('PASS: owned response durably completed while Home, background memory stayed unapproved/interrupted, foreground Stop persisted, cold restoration exact, one request each. Simulator only; no physical expiration guarantee.\n')
BGVERIFY
fi
if [ "$scenario" = pdf ]; then
  mark_phase pdf-storage-verification
  xcrun simctl terminate "$simulator_id" com.nylohq.nylo
  app_container="$(xcrun simctl get_app_container "$simulator_id" com.nylohq.nylo data)"
  python3 - "$app_container/Documents/SQLite/nylo.db" <<'PYPDF'
import json, sqlite3, sys
from pathlib import Path
with sqlite3.connect(Path(sys.argv[1]).as_uri() + '?mode=ro', uri=True) as db:
    data = json.loads(db.execute('SELECT json FROM app_state WHERE id=1').fetchone()[0])
    chats = {chat['id']: chat for chat in data['conversations']}
    assert set(chats) == {'pdf-removal', 'pdf-connection'}, 'Unexpected fixture data'
    removed, routed = chats['pdf-removal'], chats['pdf-connection']
    assert not removed.get('draftAttachments'), 'Removed PDF returned after restart'
    assert removed['draft'] == 'Explain this test policy please', 'Removal changed the draft'
    assert routed['connectionId'] == 'pdf-responses', 'Connection choice did not persist'
    assert routed['draft'] == 'Explain this test policy', 'Connection choice changed the draft'
    assert len(routed['draftAttachments']) == 1 and routed['draftAttachments'][0]['id'] == 'pdf-owned-route', 'Connection choice lost the PDF'
    assert all(not chat['messages'] for chat in chats.values()), 'An offline test accepted a message'
    refs = {a['id'] for chat in chats.values() for a in chat.get('draftAttachments', [])}
    stored = {row[0] for row in db.execute('SELECT id FROM attachment_blobs')}
    assert stored == refs == {'pdf-owned-route'}, 'Removed PDF blob was retained or selected PDF was lost'
Path('artifacts/e2e/pdf-storage-check.txt').write_text('PASS: single-tap PDF removal persisted without its blob; exact text drafts and chosen connection retained; no accepted messages.\n')
print('Owned PDF removal, exact drafts, connection persistence and blob cleanup verified.')
PYPDF
fi
if [ "$scenario" = gallery ]; then
  mark_phase clipboard-and-storage-verification
  xcrun simctl pbpaste "$simulator_id" > artifacts/e2e/copied-example.txt
  # Preserve the original read for strict comparison. A separate verbose read
  # supplies transport diagnostics; it never replaces a failed/empty result.
  xcrun simctl pbpaste -v "$simulator_id" > artifacts/e2e/clipboard-read-diagnostic.txt 2>&1 || true
  python3 - <<'PY'
from pathlib import Path
assert Path('artifacts/e2e/copied-example.txt').read_text() == Path('artifacts/e2e/expected-copy.txt').read_text(), 'Copied response differs from the complete synthetic example'
PY
  app_container="$(xcrun simctl get_app_container "$simulator_id" com.nylohq.nylo data)"
  python3 - "$app_container" <<'PYBLOBS'
import json, sqlite3, sys
from pathlib import Path
with sqlite3.connect(Path(sys.argv[1]) / "Documents/SQLite/nylo.db") as db:
    metadata=json.loads(db.execute("SELECT json FROM app_state WHERE id=1").fetchone()[0])
    references=[]
    for chat in metadata["conversations"]:
        attachments=chat.get("draftAttachments", []) + [a for message in chat["messages"] for a in message.get("attachments", [])]
        for attachment in attachments:
            assert "data" not in attachment, "File payload was rewritten into streaming metadata"
            references.append(attachment["blobId"])
    stored={row[0] for row in db.execute("SELECT id FROM attachment_blobs")}
    assert stored == set(references), "Orphaned or missing attachment blob"
    assert "gallery-owned-image" in stored, "Restored image was lost"
    assert "gallery-owned-text" not in stored, "Removed draft file was retained"
Path("artifacts/e2e/attachment-storage-check.txt").write_text("PASS: native metadata and file blobs match; restored image retained, removed text blob deleted. Synthetic data only.\n")
PYBLOBS
fi

if [ "$scenario" = attachments ]; then
  mark_phase picked-photo-storage-verification
  # Freeze the post-restart state before a read-only SQLite/WAL snapshot.
  xcrun simctl terminate "$simulator_id" com.nylohq.nylo
  app_container="$(xcrun simctl get_app_container "$simulator_id" com.nylohq.nylo data)"
  python3 scripts/check-picked-photo-storage.py --container "$app_container" \
    --simulator-id "$simulator_id" --source-jpeg artifacts/e2e/owned-picker-photo.jpg \
    --output-dir artifacts/e2e
fi

if [ "$scenario" = store ]; then
  mark_phase store-capture-manifest
  python3 - <<'PYSTORE'
import hashlib, json, struct
from pathlib import Path
root = Path('artifacts/e2e')
manifest = json.loads((root / 'store-manifest.json').read_text())
names = ['store-01-inbox', 'store-02-response', 'store-03-model-picker',
         'store-04-memory', 'store-05-attachment-draft']
for name in names:
    matches = list(root.rglob(name + '.png'))
    assert len(matches) == 1, f'Expected exactly one native capture: {name}; got {matches}'
    path = matches[0]
    content = path.read_bytes()
    assert content[:8] == b'\x89PNG\r\n\x1a\n' and content[12:16] == b'IHDR', path
    width, height, depth, color = struct.unpack('>IIBB', content[16:26])
    assert (width, height, depth, color) == (1320, 2868, 8, 2), f'Expected opaque 8-bit RGB 1320x2868 native PNG: {path}'
    # RGB must also have no optional transparency chunk. Never rewrite pixels.
    offset = 8
    while offset < len(content):
        length = struct.unpack('>I', content[offset:offset+4])[0]
        kind = content[offset+4:offset+8]
        assert kind != b'tRNS', f'Transparency is not accepted: {path}'
        offset += length + 12
    manifest['captures'].append(dict(file=str(path.relative_to(root)), width=width,
        height=height, format='opaque RGB PNG', sha256=hashlib.sha256(content).hexdigest()))
manifest.update(status='captured_awaiting_visual_review',
    provenance={name: (root / name).read_text() for name in
                ['source.txt', 'fixture-sha256.txt', 'js-bundle-sha256.txt', 'native-archive-sha256.txt']},
    nativeBundleHashes='native-bundle-sha256.json',
    resultMeaning='Asset flow completed only; JUnit is not full product approval, live AI evidence, or App Store approval.')
(root / 'store-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
PYSTORE
fi

mark_phase complete
