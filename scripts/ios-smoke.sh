#!/usr/bin/env bash
set -euo pipefail
: "${SOURCE_RUN_ID:?Pass the native validation run ID}"
: "${GH_TOKEN:?Artifact read token required}"
mkdir -p artifacts/e2e
source_sha="$(gh api "repos/$GITHUB_REPOSITORY/actions/runs/$SOURCE_RUN_ID" --jq .head_sha)"
source_branch="$(gh api "repos/$GITHUB_REPOSITORY/actions/runs/$SOURCE_RUN_ID" --jq .head_branch)"
test "$source_branch" = main
gh run download "$SOURCE_RUN_ID" --repo "$GITHUB_REPOSITORY" --name "ios-simulator-$source_sha" -D artifacts/native
unzip -q artifacts/native/Nylo-simulator.zip -d "$RUNNER_TEMP/nylo-app"
if [ "${REFRESH_JS_BUNDLE:-false}" = true ]; then
  git fetch --no-tags origin "$source_sha" --depth=1
  # Native modules, Expo config and native icon assets must match the seed app.
  # This path supplies UI iteration evidence, never a signed release candidate.
  git diff --exit-code "$source_sha" HEAD -- package.json package-lock.json app.json assets
  npx expo export:embed --platform ios --dev false --bytecode \
    --entry-file node_modules/expo-router/entry.js \
    --bundle-output "$RUNNER_TEMP/nylo-app/Nylo.app/main.jsbundle" \
    --assets-dest "$RUNNER_TEMP/nylo-app/Nylo.app" --max-workers 2
fi
profile="${UI_PROFILE:-large}"
case "$profile" in compact|large|large-text) ;; *) echo 'Unknown UI profile'; exit 1 ;; esac
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
simulator_id="$(xcrun simctl create "Nylo $profile QA" "$device_type" "$runtime_id")"
test -n "$simulator_id"
xcrun simctl boot "$simulator_id" || true
xcrun simctl bootstatus "$simulator_id" -b
collect_diagnostics() {
  if [ -d "$HOME/.maestro/tests" ]; then
    mkdir -p artifacts/e2e/driver-diagnostics
    cp -R "$HOME/.maestro/tests/." artifacts/e2e/driver-diagnostics/ || true
  fi
  xcrun simctl shutdown "$simulator_id" || true
  xcrun simctl delete "$simulator_id" || true
}
trap collect_diagnostics EXIT
if [ "$profile" = large-text ]; then
  xcrun simctl ui "$simulator_id" content_size accessibility-extra-extra-extra-large
fi
xcrun simctl status_bar "$simulator_id" override --time '9:41' --dataNetwork wifi --wifiMode active --wifiBars 3 --batteryState charged --batteryLevel 100
xcrun simctl install "$simulator_id" "$RUNNER_TEMP/nylo-app/Nylo.app"
xcrun simctl launch "$simulator_id" com.nylohq.nylo
sleep 8
xcrun simctl io "$simulator_id" screenshot artifacts/e2e/00-native-launch.png
scenario="${UI_SCENARIO:-smoke}"
case "$scenario" in smoke|gallery|attachments) ;; *) echo 'Unknown UI scenario'; exit 1 ;; esac
if [ "$scenario" = gallery ] || [ "$scenario" = attachments ]; then
  xcrun simctl terminate "$simulator_id" com.nylohq.nylo
  app_container="$(xcrun simctl get_app_container "$simulator_id" com.nylohq.nylo data)"
  python3 scripts/seed-ios-gallery.py --container "$app_container" --expected-copy artifacts/e2e/expected-copy.txt
  echo 'Synthetic offline QA data, not live model output or customer history.' > artifacts/e2e/gallery-disclosure.txt
  if [ "$scenario" = attachments ]; then xcrun simctl addmedia "$simulator_id" artifacts/e2e/owned-picker-photo.png; fi
fi
curl -fsSL 'https://github.com/mobile-dev-inc/Maestro/releases/download/cli-2.12.1/maestro.zip' -o "$RUNNER_TEMP/maestro.zip"
echo '54dbb0716425626604973cbb374c585ca30272375d9ce15177a1152765ddd9d7  '"$RUNNER_TEMP/maestro.zip" | shasum -a 256 -c -
unzip -q "$RUNNER_TEMP/maestro.zip" -d "$RUNNER_TEMP/maestro-cli"
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_DRIVER_STARTUP_TIMEOUT=300000
printf 'Native source: %s\nUI flows: %s\n' "$source_sha" "$(git rev-parse HEAD)" > artifacts/e2e/source.txt
printf 'Profile: %s\nDevice type: %s\nRuntime: %s\n' "$profile" "$device_type" "$runtime_id" >> artifacts/e2e/source.txt
printf 'Refreshed JS bundle: %s\nJS source: %s\n' "${REFRESH_JS_BUNDLE:-false}" "$(git rev-parse HEAD)" >> artifacts/e2e/source.txt
printf 'Scenario: %s\n' "$scenario" >> artifacts/e2e/source.txt
"$RUNNER_TEMP/maestro-cli/maestro/bin/maestro" --device "$simulator_id" test --test-output-dir "$PWD/artifacts/e2e" --format junit --output artifacts/e2e/results.xml "e2e/ios-$scenario.yaml"
if [ "$scenario" = gallery ]; then
  xcrun simctl pbpaste "$simulator_id" > artifacts/e2e/copied-example.txt
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
