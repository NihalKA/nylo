"""Bind the Android marker and packaged design assets to this exact checkout."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import zipfile


def digest(data):
    return hashlib.sha256(data).hexdigest()


def assets():
    paths = list(Path('assets/figma').glob('*.svg'))
    paths += [p for p in Path('assets/fonts').glob('*.ttf') if 'variable' not in p.name]
    assert len(paths) == 57, 'Expected 45 original SVGs and 12 runtime fonts'
    return {str(p): digest(p.read_bytes()) for p in sorted(paths)}


def verify(directory):
    identity = json.loads((directory / 'build-identity.json').read_text())
    source = (directory / 'source.txt').read_text().strip()
    assert identity['source'] == source
    assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip() == source
    assert identity['assets'] == assets(), 'Build assets differ from checkout'
    with zipfile.ZipFile(directory / 'Nylo-test.apk') as apk:
        assert apk.testzip() is None
        bundle = apk.read('assets/index.android.bundle')
        for value in [identity['marker'], '#F9F9F8', '#1E2B58']:
            assert value.encode() in bundle, f'Missing bundle string: {value}'
        packaged = {digest(apk.read(n)) for n in apk.namelist() if n.endswith(('.svg', '.ttf'))}
        for name, value in identity['assets'].items():
            assert value in packaged, f'Missing or modified packaged asset: {name}'
    result = {'source': source, 'marker': identity['marker'], 'apkSHA256': digest((directory / 'Nylo-test.apk').read_bytes()), 'bundleSHA256': digest(bundle), 'svgCount': 45, 'fontCount': 12, 'scope': 'Packaged identity and assets; not visual parity'}
    (directory / 'bundle-verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    directory = Path(sys.argv[2] if len(sys.argv) > 2 else 'artifacts/android')
    if sys.argv[1] == 'prepare':
        source = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
        assert source == os.environ['GITHUB_SHA']
        stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        marker = f'UI: figma-parity {source[:12]} {stamp}'
        directory.mkdir(parents=True, exist_ok=True)
        identity = {'source': source, 'builtAt': stamp, 'marker': marker, 'runId': os.environ['GITHUB_RUN_ID'], 'runAttempt': os.environ['GITHUB_RUN_ATTEMPT'], 'assets': assets()}
        (directory / 'build-identity.json').write_text(json.dumps(identity, indent=2) + '\n')
        (directory / 'source.txt').write_text(source + '\n')
        with open(os.environ['GITHUB_ENV'], 'a') as env:
            env.write('EXPO_PUBLIC_UI_BUILD_MARKER=' + marker + '\n')
        print(marker)
    elif sys.argv[1] == 'verify':
        verify(directory)
    else:
        raise SystemExit('Expected prepare or verify')
