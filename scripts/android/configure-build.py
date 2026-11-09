"""CI-only generated Android project policy; never changes saved app connections."""
import json
import os
from pathlib import Path
import xml.etree.ElementTree as ET

if os.environ.get('GITHUB_ACTIONS') != 'true':
    raise SystemExit('Use the disposable GitHub Android build job.')
code = int(os.environ['ANDROID_VERSION_CODE'])
if not 1 <= code <= 2100000000:
    raise SystemExit('Android version code is outside the Play limit.')
app = Path('app.json')
config = json.loads(app.read_text())
assert config['expo']['android']['package'] == 'com.nylohq.nylo'
config['expo']['android']['versionCode'] = code
app.write_text(json.dumps(config, indent=2) + '\n')
