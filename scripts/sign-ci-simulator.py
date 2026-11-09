"""Sign only disposable CI simulators with the existing Nylo release identity.

No provider credentials, new certificates or device builds. Never echo commands:
security receives protected passwords as arguments and errors must not reveal them.
"""
import base64
import hashlib
import fnmatch
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone

if os.environ.get('GITHUB_ACTIONS') != 'true' or os.environ.get('GITHUB_REF') != 'refs/heads/main':
    raise SystemExit('Simulator signing is restricted to trusted main CI.')
root = Path(os.environ['RUNNER_TEMP']) / 'nylo-simulator-signing'
keychain = root / 'ci.keychain-db'

def run(label, args):
    result = subprocess.run(args, capture_output=True)
    if result.returncode:
        if args[0] == 'codesign':
            # codesign receives only public identity/path arguments, no secrets.
            print(result.stderr.decode(errors='replace')[-6000:], file=sys.stderr)
        raise SystemExit(f'{label} failed ({result.returncode}); protected arguments suppressed.')
    return result.stdout

mode = sys.argv[1]
if mode == 'cleanup':
    if keychain.exists():
        run('Delete disposable signing keychain', ['security', 'delete-keychain', str(keychain)])
    shutil.rmtree(root, ignore_errors=True)
elif mode == 'prepare':
    root.mkdir(mode=0o700, exist_ok=False)
    for filename, variable in [('identity.p12', 'IOS_CERT_P12_BASE64'), ('profile.mobileprovision', 'IOS_PROFILE_BASE64')]:
        path = root / filename
        path.write_bytes(base64.b64decode(os.environ[variable], validate=True))
        path.chmod(0o600)
    profile = plistlib.loads(run('Decode existing Nylo profile', ['security', 'cms', '-D', '-i', str(root / 'profile.mobileprovision')]))
    team = os.environ['APPLE_TEAM_ID']
    entitlements = profile['Entitlements']
    if (team not in profile['TeamIdentifier'] or
        entitlements.get('application-identifier') != team + '.com.nylohq.nylo' or
        profile['ExpirationDate'].replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc) or
        entitlements.get('get-task-allow') or profile.get('ProvisionedDevices') or profile.get('ProvisionsAllDevices')):
        raise SystemExit('Existing release profile identity/validity mismatch.')
    password = os.environ['CI_KEYCHAIN_PASSWORD']
    run('Create disposable signing keychain', ['security', 'create-keychain', '-p', password, str(keychain)])
    run('Configure signing keychain', ['security', 'set-keychain-settings', '-lut', '3600', str(keychain)])
    run('Unlock signing keychain', ['security', 'unlock-keychain', '-p', password, str(keychain)])
    run('Import existing certificate', ['security', 'import', str(root / 'identity.p12'), '-k', str(keychain), '-P', os.environ['IOS_CERT_PASSWORD'], '-T', '/usr/bin/codesign'])
    run('Allow codesign access', ['security', 'set-key-partition-list', '-S', 'apple-tool:,apple:,codesign:', '-s', '-k', password, str(keychain)])
    identities = run('Verify imported signing identity', ['security', 'find-identity', '-v', '-p', 'codesigning', str(keychain)]).decode()
    fingerprints = re.findall(r'\b[0-9A-F]{40}\b', identities)
    permitted = {hashlib.sha1(cert).hexdigest().upper() for cert in profile['DeveloperCertificates']}
    if len(fingerprints) != 1 or fingerprints[0] not in permitted:
        raise SystemExit('Imported usable certificate does not match existing profile.')
    app_id = team + '.com.nylohq.nylo'
    if entitlements.get('com.apple.developer.team-identifier') != team or not any(fnmatch.fnmatchcase(app_id, group) for group in entitlements.get('keychain-access-groups', [])):
        raise SystemExit('Profile does not authorize Nylo Keychain identity.')
    selected = {'application-identifier': app_id, 'com.apple.developer.team-identifier': team, 'keychain-access-groups': [app_id]}
    (root / 'entitlements.plist').write_bytes(plistlib.dumps(selected))
    (root / 'identity.json').write_text(json.dumps({'sha1': fingerprints[0]}))
    (root / 'identity.p12').unlink()
    print('Existing Nylo identity prepared in disposable CI keychain; no certificate values emitted.')
elif mode == 'sign':
    app = Path(sys.argv[2]).resolve()
    expected = (Path(os.environ['RUNNER_TEMP']) / 'nylo-app' / 'Nylo.app').resolve()
    if app != expected or plistlib.loads((app / 'Info.plist').read_bytes()).get('CFBundleIdentifier') != 'com.nylohq.nylo':
        raise SystemExit('Only the downloaded disposable Nylo simulator app may be signed.')
    identity = json.loads((root / 'identity.json').read_text())['sha1']
    shutil.copyfile(root / 'profile.mobileprovision', app / 'embedded.mobileprovision')
    run('Sign simulator with existing identity', ['codesign', '--force', '--sign', identity, '--keychain', str(keychain), '--generate-entitlement-der', '--entitlements', str(root / 'entitlements.plist'), str(app)])
    run('Verify simulator signature', ['codesign', '--verify', '--strict', str(app)])
    evidence = Path('artifacts/e2e')
    evidence.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(['codesign', '--display', '--verbose=4', str(app)], capture_output=True)
    if result.returncode:
        raise SystemExit('Cannot inspect signed simulator identity.')
    (evidence / 'simulator-signature.txt').write_bytes(result.stdout + result.stderr)
    (evidence / 'simulator-entitlements.plist').write_bytes(run('Inspect simulator entitlements', ['codesign', '--display', '--entitlements', ':-', str(app)]))
    print('Simulator signature verified; this is not a signed-device or TestFlight build.')
else:
    raise SystemExit('Unknown simulator signing operation.')
