"""Integrity/geometry helpers for the design gate; no author authentication."""
import fnmatch
import hashlib
import io
import json
import math
from pathlib import Path
import re
import struct
import subprocess
import tarfile
import tempfile
import zlib

RUNTIME_DIRS = ('app/', 'src/', 'assets/', 'modules/', 'plugins/', 'android/', 'ios/',
                'fastlane/', 'scripts/android/')
BUILD_FILES = {'app.json', 'package-lock.json', 'Gemfile', 'Gemfile.lock',
               'tsconfig.json', 'eas.json', '.npmrc', '.nvmrc',
               'scripts/ios-simulator.sh', 'scripts/set-ios-build.mjs',
               'scripts/native-privacy-audit.py', 'scripts/audit-ios-signing.py',
               'scripts/check-design-assets.py', 'scripts/check-design-fonts.py',
               '.github/workflows/ios.yml', '.github/workflows/android.yml',
               '.github/workflows/ios-beta.yml'}
FIXTURE_PATTERNS = ('.maestro/**', 'scripts/seed-*', 'scripts/*smoke*',
                    'scripts/check-picked-*', 'scripts/owned-photo-*',
                    'scripts/android/ui-smoke.sh', 'scripts/android/check-navigation-insets.py',
                    '.github/workflows/*-ui.yml')
HEX64 = re.compile(r'^[a-f0-9]{64}$')
HEX40 = re.compile(r'^[a-f0-9]{40}$')


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def sha(data):
    return hashlib.sha256(data).hexdigest()


def fixture_file(name):
    return any(fnmatch.fnmatch(name, pattern) for pattern in FIXTURE_PATTERNS)


def product_file(name):
    if fixture_file(name):
        return False
    if name.startswith('scripts/'):
        # Unknown helpers are conservative build inputs until explicitly classified.
        return name not in {'scripts/verify-figma-coverage.py', 'scripts/figma_evidence.py',
                            'scripts/figma_release.py'}
    if name.startswith('.github/workflows/'):
        return name not in {'.github/workflows/checks.yml', '.github/workflows/pages.yml'}
    return (name.startswith(RUNTIME_DIRS) or name in BUILD_FILES or
            any(fnmatch.fnmatch(name, pattern) for pattern in
                ('app.config.*', 'babel.config.*', 'metro.config.*')))


def package_runtime(package):
    selected = {k: package.get(k) for k in
                ['main', 'dependencies', 'devDependencies', 'overrides', 'resolutions',
                 'engines', 'packageManager', 'workspaces', 'expo']}
    # Lifecycle scripts and every other app script count; owner dashboard scripts do not.
    selected['scripts'] = {k: v for k, v in package.get('scripts', {}).items()
                           if k not in {'dashboard', 'dashboard:build'}}
    return selected


def tree_fingerprint(root, fixtures=False):
    entries = []
    predicate = fixture_file if fixtures else product_file
    if (root / '.git').exists():
        # Git distinguishes ignored generated native projects/dependencies from
        # tracked native source. Never omit a tracked src/build or native file.
        names = set(git(root, 'ls-files', '--cached', '--others', '--exclude-standard', '-z')
                    .decode().strip('\0').split('\0'))
    else:
        # Archives contain committed files only; synthetic fixtures are small.
        names = {p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()}
    for name in sorted(names):
        p = root / name
        if predicate(name) and p.is_file():
            entries.append((name, sha(p.read_bytes())))
    if not fixtures and (root / 'package.json').is_file():
        entries.append(('package-runtime', sha(canonical(package_runtime(
            json.loads((root / 'package.json').read_text()))))))
    return sha(canonical(entries))


def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args], stderr=subprocess.PIPE)


def committed_fingerprint(root, commit, fixtures=False):
    if not HEX40.fullmatch(commit):
        raise ValueError('sourceCommit must be a full Git SHA')
    archive = git(root, 'archive', '--format=tar', commit)
    with tempfile.TemporaryDirectory() as directory:
        destination = Path(directory)
        with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
            tar.extractall(destination, filter='data')
        return tree_fingerprint(destination, fixtures)


def png_size(path):
    """Validate PNG chunks, CRC and noninterlaced scanline lengths without Pillow."""
    data = path.read_bytes()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('not an original PNG')
    position, width, height, bit_depth, colour = 8, 0, 0, 0, -1
    seen, idat_ended, palette = set(), False, False
    compressed = bytearray()
    ended = False
    while position + 12 <= len(data):
        size = struct.unpack('>I', data[position:position + 4])[0]
        kind = data[position + 4:position + 8]
        if len(kind) != 4 or any(not (65 <= b <= 90 or 97 <= b <= 122) for b in kind) or not 65 <= kind[2] <= 90:
            raise ValueError('invalid PNG chunk type')
        payload = data[position + 8:position + 8 + size]
        end = position + size + 12
        if end > len(data):
            raise ValueError('truncated PNG chunk')
        crc = struct.unpack('>I', data[end - 4:end])[0]
        if zlib.crc32(kind + payload) != crc:
            raise ValueError('PNG CRC mismatch')
        if kind == b'IHDR':
            if position != 8 or size != 13:
                raise ValueError('invalid PNG header')
            width, height, bit_depth, colour, method, filtering, interlace = struct.unpack('>IIBBBBB', payload)
            if (not 0 < width <= 20000 or not 0 < height <= 20000 or
                    colour not in {2, 6} or bit_depth != 8 or method or filtering or interlace):
                raise ValueError('unsupported/unsafe original PNG header')
        elif kind == b'IDAT':
            if b'IHDR' not in seen or idat_ended:
                raise ValueError('invalid PNG IDAT order')
            compressed.extend(payload)
        elif kind == b'IEND':
            if size or end != len(data) or b'IDAT' not in seen:
                raise ValueError('invalid PNG ending')
            ended = True
            break
        elif kind == b'PLTE':
            if palette or b'IHDR' not in seen or b'IDAT' in seen or not 0 < size <= 768 or size % 3:
                raise ValueError('invalid PNG palette/order')
            palette = True
        else:
            # Restrict to standard screenshot RGB/RGBA metadata; do not claim a
            # general PNG/APNG decoder or silently convert evidence to pass.
            allowed = {b'cHRM', b'gAMA', b'iCCP', b'sBIT', b'sRGB', b'pHYs',
                       b'tEXt', b'zTXt', b'iTXt', b'tIME', b'eXIf', b'bKGD', b'tRNS'}
            if kind not in allowed or b'IHDR' not in seen:
                raise ValueError('unsupported PNG chunk')
            pre_idat = {b'cHRM', b'gAMA', b'iCCP', b'sBIT', b'sRGB', b'pHYs', b'bKGD', b'tRNS'}
            if kind in pre_idat and (kind in seen or b'IDAT' in seen):
                raise ValueError('invalid PNG metadata order')
            before_palette = {b'cHRM', b'gAMA', b'iCCP', b'sBIT', b'sRGB'}
            if kind in before_palette and palette:
                raise ValueError('invalid PNG colour-metadata order')
            sizes = {b'cHRM': 32, b'gAMA': 4, b'sRGB': 1, b'pHYs': 9,
                     b'tIME': 7, b'bKGD': 6, b'tRNS': 6, b'sBIT': 3 if colour == 2 else 4}
            if kind in sizes and size != sizes[kind]:
                raise ValueError('invalid PNG metadata size')
            if (kind == b'tRNS' and colour == 6 or kind == b'sRGB' and (payload[0] > 3 or b'iCCP' in seen)
                    or kind == b'iCCP' and b'sRGB' in seen):
                raise ValueError('invalid PNG transparency/colour metadata')
        if b'IDAT' in seen and kind != b'IDAT':
            idat_ended = True
        seen.add(kind)
        position = end
    if not ended or not width or not compressed:
        raise ValueError('incomplete PNG')
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[colour]
    stride = (width * channels * bit_depth + 7) // 8 + 1
    expected = stride * height
    if expected > 150_000_000:
        raise ValueError('PNG decode bound exceeded')
    decoder = zlib.decompressobj()
    raw = decoder.decompress(compressed, expected + 1)
    if not decoder.eof or decoder.unused_data or len(raw) != expected:
        raise ValueError('PNG scanline data invalid')
    if any(raw[y * stride] > 4 for y in range(height)):
        raise ValueError('invalid PNG row filter')
    return width, height


def number(value, minimum=0):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value >= minimum


def rectangle(value, width, height):
    return (isinstance(value, dict) and set(value) == {'x', 'y', 'width', 'height'}
            and all(number(v) for v in value.values()) and value['width'] > 0 and value['height'] > 0
            and value['x'] + value['width'] <= width + .01
            and value['y'] + value['height'] <= height + .01)
