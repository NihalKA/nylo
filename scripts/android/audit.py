"""Validate actual compiled release package and restricted optional permissions."""
import json
import os
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
assert 'Signer #1 certificate SHA-256 digest:' in signature
assert 'jar verified.' in (p / 'aab-signature.txt').read_text()
(p / 'audit.json').write_text(json.dumps({'package': 'com.nylohq.nylo', 'version': '1.0.0', 'versionCode': int(os.environ['ANDROID_VERSION_CODE']), 'signedApkVerified': True, 'signedAabVerified': True, 'noMicrophoneOrBroadMediaPermission': True, 'scope': 'Compiled build metadata, signatures and permissions; not runtime/UI or Play approval.'}, indent=2) + '\n')
print('Compiled Android release identity, signatures and permissions passed.')
