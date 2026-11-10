#!/usr/bin/env bash
set -euo pipefail
mkdir -p artifacts
CI=1 npx expo prebuild --clean --platform ios --no-install
(cd ios && pod install)
xcodebuild -workspace ios/Nylo.xcworkspace -scheme Nylo -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath artifacts/DerivedData CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- CODE_SIGNING_REQUIRED=NO DEVELOPMENT_TEAM=Q59Q74QTG6 CODE_SIGN_INJECT_BASE_ENTITLEMENTS=YES ARCHS="$(uname -m)" ONLY_ACTIVE_ARCH=YES build > artifacts/ios-build.log 2>&1 || { tail -100 artifacts/ios-build.log; exit 1; }
app_path="$PWD/artifacts/DerivedData/Build/Products/Release-iphonesimulator/Nylo.app"
test -d "$app_path"
# Xcode links simulated entitlements into the executable. Post-build device
# signing entitlements are checked by macOS instead and cannot substitute for it.
xcrun otool -l "$app_path/Nylo" > artifacts/simulator-load-commands.log
python3 - "$app_path" "$PWD/artifacts/DerivedData" <<'SIMCHECK'
import json, plistlib, re, sys
from pathlib import Path
app, derived = map(Path, sys.argv[1:])
commands = Path('artifacts/simulator-load-commands.log').read_text()
if not re.search(r'sectname __entitlements\s+segname __TEXT', commands):
    raise SystemExit('Missing linked simulator entitlement section; Keychain UI is not testable.')
files = list(derived.glob('Build/Intermediates.noindex/**/Nylo.app-Simulated.xcent'))
if len(files) != 1:
    raise SystemExit('Expected one Xcode-generated simulated-entitlements file.')
entitlements = plistlib.loads(files[0].read_bytes())
identity = entitlements.get('application-identifier') or entitlements.get('com.apple.application-identifier')
if identity != 'Q59Q74QTG6.com.nylohq.nylo':
    raise SystemExit('Unexpected simulated application identifier.')
Path('artifacts/simulator-entitlements-audit.log').write_text(json.dumps({
    'scope': 'Xcode-generated simulator entitlements and linked section; not signed-device proof.',
    'simulatedEntitlements': entitlements,
    'linkedEntitlementSectionPresent': True,
    'source': str(files[0].relative_to(derived)),
}, indent=2) + '\n')
print('Xcode simulated entitlement section and exact app identity verified.')
SIMCHECK
python3 scripts/native-privacy-audit.py "$app_path" --output artifacts/native-privacy-audit.log
python3 scripts/ios-build-identity.py verify "$app_path"
ditto -c -k --sequesterRsrc --keepParent "$app_path" artifacts/Nylo-simulator.zip
simulator_id="$(xcrun simctl list devices available -j | python3 -c 'import sys,json; d=json.load(sys.stdin); phones=[x for k,v in d["devices"].items() if "iOS" in k for x in v if x.get("isAvailable") and x["name"].startswith("iPhone")]; phones.sort(key=lambda x: ("17 Pro" not in x["name"],x["name"])); print(phones[0]["udid"] if phones else "")')"
test -n "$simulator_id"
xcrun simctl boot "$simulator_id" || true
xcrun simctl bootstatus "$simulator_id" -b
xcrun simctl status_bar "$simulator_id" override --time '9:41' --dataNetwork wifi --wifiMode active --wifiBars 3 --batteryState charged --batteryLevel 100
xcrun simctl install "$simulator_id" "$app_path"
xcrun simctl launch "$simulator_id" com.nylohq.nylo
sleep 8
xcrun simctl io "$simulator_id" screenshot artifacts/ios-chats.png
xcrun simctl shutdown "$simulator_id"
