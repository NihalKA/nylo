"""Validate actual compiled release package and restricted optional permissions."""
import json
import os
import re
import sys
from pathlib import Path

p = Path(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/android')
badging = (p / 'package.txt').read_text()
permissions = (p / 'permissions.txt').read_text()
signature = (p / 'signature.txt').read_text()
assert "name='com.nylohq.nylo'" in badging
assert "versionCode='" + os.environ['ANDROID_VERSION_CODE'] + "'" in badging
assert "versionName='1.0.0'" in badging
for name in ['SYSTEM_ALERT_WINDOW', 'RECORD_AUDIO', 'READ_MEDIA_AUDIO', 'READ_MEDIA_IMAGES', 'READ_MEDIA_VIDEO', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE']:
    assert 'android.permission.' + name + "'" not in permissions, name
assert 'android.permission.INTERNET' in permissions
assert 'android.permission.CAMERA' in permissions
for feature in ['android.hardware.camera', 'android.hardware.camera.any', 'android.hardware.camera.autofocus']:
    assert "uses-feature-not-required: name='" + feature + "'" in badging
expected = Path(__file__).with_name('release-certificate.sha256').read_text().strip()
assert (p / 'expected-certificate-sha256.txt').read_text().split()[0].lower() == expected
digests = re.findall(r'(?m)^(?:Signer #\d+|V\d+(?:\.\d+)? Signer):? certificate SHA-256 digest: ([a-fA-F0-9]+)$', signature)
assert 'Number of signers: 1' in signature
assert len(digests) == 1 and digests[0].lower() == expected, 'APK signer does not match the protected release certificate'
assert re.search(r'SHA256: ([A-Fa-f0-9:]+)', (p / 'aab-certificate.txt').read_text()).group(1).replace(':', '').lower() == expected
manifest = (p / 'manifest.txt').read_text()
assert re.search(r'android:usesCleartextTraffic[^\n]*=(?:false|(?:\(type 0x12\))?0x0)\s*$', manifest, re.MULTILINE)
assert not re.search(r'android:debuggable[^\n]*=(?:true|(?:\(type 0x12\))?0xffffffff)\s*$', manifest, re.MULTILINE)
assert 'jar verified.' in (p / 'aab-signature.txt').read_text()
(p / 'audit.json').write_text(json.dumps({'package': 'com.nylohq.nylo', 'version': '1.0.0', 'versionCode': int(os.environ['ANDROID_VERSION_CODE']), 'signedApkVerified': True, 'signedAabVerified': True, 'expectedCertificateSHA256': expected, 'httpsOnly': True, 'debuggable': False, 'noMicrophoneOrBroadMediaPermission': True, 'scope': 'Compiled build metadata, signatures and permissions; not runtime/UI or Play approval.'}, indent=2) + '\n')
print('Compiled Android release identity, signatures and permissions passed.')
