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
runtimes.sort(key=lambda x: tuple(map(int, x['version'].split('.'))), reverse=True)
print(runtimes[0]['identifier'] if runtimes else '')
PY
)"
test -n "$device_type"
test -n "$runtime_id"
simulator_id="$(xcrun simctl create "Nylo $profile QA" "$device_type" "$runtime_id")"
test -n "$simulator_id"
xcrun simctl boot "$simulator_id" || true
xcrun simctl bootstatus "$simulator_id" -b
trap 'xcrun simctl shutdown "$simulator_id" || true; xcrun simctl delete "$simulator_id" || true' EXIT
if [ "$profile" = large-text ]; then
  xcrun simctl ui "$simulator_id" content_size accessibility-extra-extra-extra-large
fi
xcrun simctl status_bar "$simulator_id" override --time '9:41' --dataNetwork wifi --wifiMode active --wifiBars 3 --batteryState charged --batteryLevel 100
xcrun simctl install "$simulator_id" "$RUNNER_TEMP/nylo-app/Nylo.app"
curl -fsSL 'https://github.com/mobile-dev-inc/Maestro/releases/download/cli-2.12.1/maestro.zip' -o "$RUNNER_TEMP/maestro.zip"
echo '54dbb0716425626604973cbb374c585ca30272375d9ce15177a1152765ddd9d7  '"$RUNNER_TEMP/maestro.zip" | shasum -a 256 -c -
unzip -q "$RUNNER_TEMP/maestro.zip" -d "$RUNNER_TEMP/maestro-cli"
export MAESTRO_CLI_NO_ANALYTICS=1
printf 'Native source: %s\nUI flows: %s\n' "$source_sha" "$(git rev-parse HEAD)" > artifacts/e2e/source.txt
printf 'Profile: %s\nDevice type: %s\nRuntime: %s\n' "$profile" "$device_type" "$runtime_id" >> artifacts/e2e/source.txt
"$RUNNER_TEMP/maestro-cli/maestro/bin/maestro" --device "$simulator_id" test --test-output-dir "$PWD/artifacts/e2e" --format junit --output artifacts/e2e/results.xml e2e/ios-smoke.yaml
