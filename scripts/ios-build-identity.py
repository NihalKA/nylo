"""Verify the source marker and original design assets in an iOS app or IPA."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import subprocess
import sys
import zipfile


def digest(data):
    return hashlib.sha256(data).hexdigest()


def assets():
    paths = list(Path('assets/figma').glob('*.svg'))
    paths += [p for p in Path('assets/fonts').glob('*.ttf') if 'variable' not in p.name]
    assert len(paths) == 57
    return {str(p): digest(p.read_bytes()) for p in sorted(paths)}


def prepare():
    source = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    assert source == os.environ['GITHUB_SHA']
    stamp = os.environ.get('NYLO_BUILD_STAMP') or datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    assert re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z', stamp)
    marker = f'UI: figma-parity {source[:12]} {stamp}'
    identity = {'source': source, 'candidateTimeUTC': stamp, 'marker': marker, 'runId': os.environ['GITHUB_RUN_ID'], 'assets': assets()}
    Path('artifacts').mkdir(exist_ok=True)
    Path('artifacts/ios-build-identity.json').write_text(json.dumps(identity, indent=2) + '\n')
    with open(os.environ['GITHUB_ENV'], 'a') as env:
        env.write('EXPO_PUBLIC_UI_BUILD_MARKER=' + marker + '\n')
    print(marker)


def verify(path):
    identity = json.loads(Path('artifacts/ios-build-identity.json').read_text())
    assert identity['assets'] == assets()
    if path.is_dir():
        info = plistlib.loads((path / 'Info.plist').read_bytes())
        bundle = (path / 'main.jsbundle').read_bytes()
        packaged = {digest(p.read_bytes()) for p in path.rglob('*') if p.suffix in ('.svg', '.ttf')}
        binary_hash = digest((path / info['CFBundleExecutable']).read_bytes())
        archive_hash = None
    else:
        with zipfile.ZipFile(path) as z:
            assert z.testzip() is None
            roots = [n.removesuffix('/Info.plist') for n in z.namelist() if re.fullmatch(r'Payload/[^/]+\.app/Info\.plist', n)]
            assert len(roots) == 1
            root = roots[0]
            info = plistlib.loads(z.read(root + '/Info.plist'))
            bundle = z.read(root + '/main.jsbundle')
            packaged = {digest(z.read(n)) for n in z.namelist() if n.endswith(('.svg', '.ttf'))}
            binary_hash = digest(z.read(root + '/' + info['CFBundleExecutable']))
        archive_hash = digest(path.read_bytes())
    assert info['CFBundleIdentifier'] == 'com.nylohq.nylo'
    for value in [identity['marker'], '#F9F9F8', '#1E2B58']:
        assert value.encode() in bundle, f'Missing bundle string: {value}'
    for name, sha in identity['assets'].items():
        assert sha in packaged, f'Missing original design asset: {name}'
    result = {'source': identity['source'], 'marker': identity['marker'], 'version': info['CFBundleShortVersionString'], 'build': info['CFBundleVersion'], 'bundleSHA256': digest(bundle), 'executableSHA256': binary_hash, 'ipaSHA256': archive_hash, 'svgCount': 45, 'fontCount': 12, 'scope': 'Actual packaged identity and assets; not TestFlight availability or visual parity'}
    Path('artifacts/ios-bundle-verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    if sys.argv[1] == 'prepare':
        prepare()
    elif sys.argv[1] == 'verify':
        verify(Path(sys.argv[2]))
    else:
        raise SystemExit('Expected prepare or verify')
