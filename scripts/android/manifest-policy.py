"""Restrict release permissions to selected files/photos and optional camera."""
import os
from pathlib import Path
import xml.etree.ElementTree as ET

if os.environ.get('GITHUB_ACTIONS') != 'true':
    raise SystemExit('Only modifies a disposable generated Android project.')
p = Path('android/app/src/main/AndroidManifest.xml')
a = '{http://schemas.android.com/apk/res/android}'
t = '{http://schemas.android.com/tools}'
ET.register_namespace('android', a[1:-1])
ET.register_namespace('tools', t[1:-1])
root = ET.parse(p)
for name in ['RECORD_AUDIO', 'READ_MEDIA_AUDIO', 'READ_MEDIA_IMAGES', 'READ_MEDIA_VIDEO', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE']:
    full = 'android.permission.' + name
    for node in list(root.getroot().findall('uses-permission')):
        if node.get(a + 'name') == full:
            root.getroot().remove(node)
    ET.SubElement(root.getroot(), 'uses-permission', {a+'name': full, t+'node': 'remove'})
application = root.getroot().find('application')
assert application is not None
application.set(a + 'usesCleartextTraffic', 'false')
root.write(p, encoding='utf-8', xml_declaration=True)
print('Applied generated Android HTTPS-only and optional-media permission policy.')
