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
simulator_id="$(xcrun simctl list devices available -j | python3 -c 'import sys,json; d=json.load(sys.stdin); p=[x for k,v in d["devices"].items() if "iOS" in k for x in v if x.get("isAvailable") and x["name"].startswith("iPhone")]; p.sort(key=lambda x:("17 Pro" not in x["name"],x["name"])); print(p[0]["udid"] if p else "")')"
test -n "$simulator_id"
xcrun simctl boot "$simulator_id" || true
xcrun simctl bootstatus "$simulator_id" -b
trap 'xcrun simctl shutdown "$simulator_id" || true' EXIT
xcrun simctl status_bar "$simulator_id" override --time '9:41' --dataNetwork wifi --wifiMode active --wifiBars 3 --batteryState charged --batteryLevel 100
xcrun simctl install "$simulator_id" "$RUNNER_TEMP/nylo-app/Nylo.app"
curl -fsSL 'https://github.com/mobile-dev-inc/Maestro/releases/download/cli-2.12.1/maestro.zip' -o "$RUNNER_TEMP/maestro.zip"
echo '54dbb0716425626604973cbb374c585ca30272375d9ce15177a1152765ddd9d7  '"$RUNNER_TEMP/maestro.zip" | shasum -a 256 -c -
unzip -q "$RUNNER_TEMP/maestro.zip" -d "$RUNNER_TEMP/maestro-cli"
export MAESTRO_CLI_NO_ANALYTICS=1
printf 'Native source: %s\nUI flows: %s\n' "$source_sha" "$(git rev-parse HEAD)" > artifacts/e2e/source.txt
"$RUNNER_TEMP/maestro-cli/maestro/bin/maestro" --device "$simulator_id" test --test-output-dir "$PWD/artifacts/e2e" --format junit --output artifacts/e2e/results.xml e2e/ios-smoke.yaml
