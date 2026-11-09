"""Validate actual compiled release package and restricted optional permissions."""
import json
import os
import re
from pathlib import Path

p = Path('artifacts/android')
badging = (p / 'package.txt').read_text()
permissions = (p / 'permissions.txt').read_text()
signature = (p / 'signature.txt').read_text()
assert "name='com.nylohq.nylo'" in badging
assert "versionCode='" + os.environ['ANDROID_VERSION_CODE'] + "'" in badging
assert "versionName='1.0.0'" in badging
for name in ['RECORD_AUDIO', 'READ_MEDIA_AUDIO', 'READ_MEDIA_IMAGES', 'READ_MEDIA_VIDEO', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE']:
    assert 'android.permission.' + name + "'" not in permissions, name
assert 'android.permission.INTERNET' in permissions
assert 'android.permission.CAMERA' in permissions
for feature in ['android.hardware.camera', 'android.hardware.camera.any', 'android.hardware.camera.autofocus']:
    assert "uses-feature-not-required: name='" + feature + "'" in badging
expected = (p / 'expected-certificate-sha256.txt').read_text().split()[0].lower()
assert re.search(r'Signer #1 certificate SHA-256 digest: ([a-fA-F0-9]+)', signature).group(1).lower() == expected
assert re.search(r'SHA256: ([A-Fa-f0-9:]+)', (p / 'aab-certificate.txt').read_text()).group(1).replace(':', '').lower() == expected
manifest = (p / 'manifest.txt').read_text()
assert re.search(r'android:usesCleartextTraffic[^\n]*0x0\b', manifest)
assert not re.search(r'android:debuggable[^\n]*0xffffffff', manifest)
assert 'jar verified.' in (p / 'aab-signature.txt').read_text()
(p / 'audit.json').write_text(json.dumps({'package': 'com.nylohq.nylo', 'version': '1.0.0', 'versionCode': int(os.environ['ANDROID_VERSION_CODE']), 'signedApkVerified': True, 'signedAabVerified': True, 'expectedCertificateSHA256': expected, 'httpsOnly': True, 'debuggable': False, 'noMicrophoneOrBroadMediaPermission': True, 'scope': 'Compiled build metadata, signatures and permissions; not runtime/UI or Play approval.'}, indent=2) + '\n')
print('Compiled Android release identity, signatures and permissions passed.')
