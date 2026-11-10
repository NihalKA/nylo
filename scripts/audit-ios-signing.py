"""Audit an exported App Store IPA without recording signing material."""
import argparse
import collections
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import plistlib
import re
import subprocess
import tempfile
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('ipa', type=Path)
parser.add_argument('--team', required=True)
parser.add_argument('--build', required=True)
parser.add_argument('--certificate-sha256', required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
assert re.fullmatch(r'[A-Z0-9]{10}', args.team), 'Invalid expected team'
assert re.fullmatch(r'[0-9]+', args.build), 'Invalid expected build'
assert re.fullmatch(r'[a-f0-9]{64}', args.certificate_sha256), 'Invalid expected certificate hash'


def command(argv):
    result = subprocess.run(argv, capture_output=True)
    if result.returncode:
        operation = ' '.join(value.split('=')[0] for value in argv[1:] if value.startswith('-'))
        detail = result.stderr.decode(errors='replace').strip()[:1200]
        detail = re.sub(r'/[^\s:]+', lambda match: '<path>/' + Path(match[0]).name, detail)
        raise SystemExit(f'Exported IPA audit failed: {Path(argv[0]).name} {operation} exited {result.returncode}: {detail}')
    return result.stdout


def audit_bundled_fonts(app, font_dir):
    expected = sorted(path for path in font_dir.glob('*.ttf') if 'variable' not in path.name)
    assert len(expected) == 12, 'Unexpected runtime font inventory'
    actual = collections.Counter(hashlib.sha256(path.read_bytes()).hexdigest() for path in app.rglob('*.ttf'))
    result = []
    for path in expected:
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        assert actual[digest] == 1, f'Exported runtime font missing, modified or duplicated: {path.name}'
        result.append(dict(file=path.name, sha256=digest))
    return result


with zipfile.ZipFile(args.ipa) as archive:
    assert archive.testzip() is None, 'IPA ZIP CRC failure'
    for name in archive.namelist():
        path = Path(name)
        assert not path.is_absolute() and '..' not in path.parts, 'Unsafe IPA path'
    roots = [name.removesuffix('/Info.plist') for name in archive.namelist()
             if re.fullmatch(r'Payload/[^/]+[.]app/Info[.]plist', name)]
    assert len(roots) == 1, 'Expected one exported app'
    root = roots[0]

with tempfile.TemporaryDirectory(prefix='nylo-export-audit-') as directory:
    command(['/usr/bin/ditto', '-x', '-k', str(args.ipa.resolve()), directory])
    app = Path(directory) / root
    info = plistlib.loads((app / 'Info.plist').read_bytes())
    app_id = f'{args.team}.com.nylohq.nylo'
    assert info['CFBundleIdentifier'] == 'com.nylohq.nylo'
    assert info['CFBundleShortVersionString'] == '1.0.0'
    assert info['CFBundleVersion'] == args.build
    assert info['UIDeviceFamily'] == [1]
    command(['/usr/bin/codesign', '--verify', '--deep', '--strict', str(app)])
    entitlements = plistlib.loads(command(['/usr/bin/codesign', '-d', '--entitlements', ':-', str(app)]))
    assert entitlements.get('application-identifier') == app_id
    assert entitlements.get('com.apple.developer.team-identifier') == args.team
    assert not entitlements.get('get-task-allow', False), 'Export allows debugging'
    prefix = Path(directory) / 'signer-'
    command(['/usr/bin/codesign', '-d', '--extract-certificates=' + str(prefix), str(app)])
    signer = hashlib.sha256(Path(str(prefix) + '0').read_bytes()).hexdigest()
    assert signer == args.certificate_sha256, 'Exported signer differs from protected distribution identity'
    profile = plistlib.loads(command(['/usr/bin/security', 'cms', '-D', '-i', str(app / 'embedded.mobileprovision')]))
    assert profile['ExpirationDate'].replace(tzinfo=timezone.utc) > datetime.now(timezone.utc), 'Embedded profile has expired'
    assert args.team in profile['TeamIdentifier']
    assert profile['Entitlements']['application-identifier'] == app_id
    assert not profile['Entitlements'].get('get-task-allow', False)
    assert not profile.get('ProvisionedDevices') and not profile.get('ProvisionsAllDevices'), 'Export is not App Store distribution'
    assert signer in {hashlib.sha256(blob).hexdigest() for blob in profile['DeveloperCertificates']}
    fonts = audit_bundled_fonts(app, Path(__file__).resolve().parents[1] / 'assets/fonts')
    summary = dict(scope='Actual exported IPA signature, entitlements and embedded App Store profile; not Apple processing/tester availability.',
                   bundleIdentifier=info['CFBundleIdentifier'], version=info['CFBundleShortVersionString'],
                   build=info['CFBundleVersion'], deviceFamilies=info['UIDeviceFamily'],
                   ipaSHA256=hashlib.sha256(args.ipa.read_bytes()).hexdigest(), zipCRCVerified=True,
                   strictSignatureVerified=True, exactDistributionCertificateMatched=True,
                   exactTeamAndApplicationMatched=True, debuggingAllowed=False,
                   embeddedAppStoreProfileVerified=True,
                   matchingRuntimeFontFaces=len(fonts), bundledRuntimeFonts=fonts)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(summary, indent=2) + '\n')
print('Actual exported IPA signature, protected signer, app/team identity, build and App Store profile verified.')
