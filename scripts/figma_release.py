"""Release obligations and hash-bound original native evidence validation."""
import json
import math
import subprocess
import xml.etree.ElementTree as ET
import zipfile
from figma_evidence import (HEX40, HEX64, canonical, committed_fingerprint,
                            number, png_size, rectangle, sha)

PROFILES = {
    'ios-compact': ('ios', 'compact', 'native', 'standard'),
    'ios-large': ('ios', 'large', 'native', 'standard'),
    'ios-max': ('ios', 'large', 'native', 'maximum'),
    'android-gesture': ('android', 'default', 'gesture', 'standard'),
    'android-threebutton': ('android', 'default', 'threebutton', 'standard'),
    'ios-gallery': ('ios', 'large', 'native', 'standard'),
    'android-gallery-gesture': ('android', 'default', 'gesture', 'standard'),
    'android-gallery-threebutton': ('android', 'default', 'threebutton', 'standard'),
    'ios-pdf': ('ios', 'large', 'native', 'standard'),
    'ios-photo': ('ios', 'large', 'native', 'standard'),
}
COMMON = {'draft-cold-restore', 'approved-memory-restore', 'controls-reachable'}
ASSERTIONS = {key: COMMON.copy() for key in PROFILES}
for key in PROFILES:
    if key.startswith('android'):
        ASSERTIONS[key].add('windowmanager-navigation-clearance')
    if 'gallery' in key:
        ASSERTIONS[key] |= {'exact-293-byte-copy', 'native-sql-blob-restore-delete'}
    if key == 'ios-pdf':
        ASSERTIONS[key] = {'exact-draft-restore', 'protocol-preserved', 'native-sql-blob-restore-delete'}
    if key == 'ios-photo':
        ASSERTIONS[key] = {'owned-photo-import-render', 'cancel-camera-recovery',
                           'reimport-cold-restore', 'native-sql-blob-orphans', 'exif-allowlist'}


def release_digest(manifest, inventory_digest, fingerprint):
    # Bind every release input and the actual evidence-table values, not only IDs.
    return sha(canonical({'auditDigest': inventory_digest, 'productFingerprint': fingerprint,
        'comparisons': manifest.get('comparisons'), 'binaries': manifest.get('binaries'),
        'functionalProofs': manifest.get('functionalProofs'), 'evidence': manifest['evidence'],
        'resolutions': [{k: gap.get(k) for k in ['id', 'status', 'resolution', 'resolutionEvidence']}
                        for gap in manifest['gaps']]}))


def verify_release(root, m, fingerprint, need, refs, safe_path):
    evidence = m['evidence']
    sizes, committed = {}, {}

    def typed(key, kind, label):
        item = evidence.get(key, {})
        need(item.get('kind') == kind, f'{label}: expected {kind} evidence')
        return safe_path(root, item['path']) if item.get('kind') == kind else None

    def source(commit, fixtures=False):
        if not isinstance(commit, str) or not HEX40.fullmatch(commit):
            return None
        cache_key = (commit, fixtures)
        if cache_key not in committed:
            try:
                committed[cache_key] = committed_fingerprint(root, commit, fixtures)
            except (ValueError, OSError, subprocess.CalledProcessError):
                committed[cache_key] = None
        return committed[cache_key]

    binaries = m.get('binaries', {})
    need(bool(binaries), 'no verified native binary artifacts')
    for key, binary in binaries.items():
        label = 'binary ' + key
        artifact = typed(binary.get('artifactEvidence'), 'binary-artifact', label)
        metadata = typed(binary.get('metadataEvidence'), 'binary-identity-receipt', label)
        need(binary.get('platform') in {'ios', 'android'} and bool(binary.get('buildId'))
             and str(binary.get('runId', '')).isdigit(), f'{label}: incomplete build identity')
        need(binary.get('productFingerprint') == fingerprint and
             source(binary.get('sourceCommit')) == fingerprint, f'{label}: stale/unverified Git source')
        if artifact:
            need(zipfile.is_zipfile(artifact), f'{label}: artifact is not APK/IPA/native ZIP')
            if zipfile.is_zipfile(artifact):
                with zipfile.ZipFile(artifact) as archive:
                    need(archive.testzip() is None, f'{label}: binary ZIP CRC failure')
        if metadata and artifact:
            receipt = json.loads(metadata.read_text())
            fields = ['platform', 'buildId', 'sourceCommit', 'productFingerprint', 'runId']
            need(all(receipt.get(k) == binary.get(k) for k in fields) and
                 receipt.get('binarySha256') == evidence[binary['artifactEvidence']]['sha256']
                 and receipt.get('identityVerified') is True,
                 f'{label}: binary/source identity receipt mismatch')
            required = {'compiled-identity', 'font12-svg45', 'privacy-permissions', 'archive-digest-crc'}
            if binary.get('platform') == 'android':
                required |= {'original-certificate', 'bundletool'}
            else:
                required |= {'linked-native-identity'}
            need(required.issubset(receipt.get('passedChecks', [])), f'{label}: incomplete binary audits')

    obligations = {o['id']: o for o in m.get('releaseObligations', [])}
    comparisons = m.get('comparisons', [])
    ids = [c.get('obligation') for c in comparisons]
    need(len(ids) == len(set(ids)) and set(ids) == set(obligations),
         'release comparisons must cover every reviewed state/extension obligation exactly once')
    for c in comparisons:
        label = 'comparison ' + str(c.get('obligation'))
        obligation = obligations.get(c.get('obligation'), {})
        need(c.get('accepted') is True and bool(c.get('findings')), f'{label}: not reviewed/accepted')
        refs(c, label)
        if obligation.get('mode') == 'exception':
            need(c.get('mode') == 'exception' and c.get('rationale') == obligation.get('rationale'),
                 f'{label}: exception differs from independently reviewed inventory')
            continue
        need(c.get('mode') == 'capture', f'{label}: capture cannot be replaced by an exception')
        binary = binaries.get(c.get('binary'), {})
        need(binary.get('platform') == obligation.get('platform'), f'{label}: wrong binary platform')
        need(c.get('productFingerprint') == fingerprint, f'{label}: stale product source')
        native = typed(c.get('nativeEvidence'), 'native-original-png', label)
        reference = typed(c.get('referenceEvidence'), 'reference-original-png', label)
        session = typed(c.get('sessionEvidence'), 'native-capture-session', label)
        for field in ['nativeEvidence', 'referenceEvidence', 'sessionEvidence']:
            need(c.get(field) in c.get('evidence', []), f'{label}: unbound {field}')
        for path in [native, reference]:
            if path and path not in sizes:
                try:
                    sizes[path] = png_size(path)
                except (ValueError, OSError) as exc:
                    need(False, f'{label}: invalid original image: {exc}')
        native_size = sizes.get(native)
        reference_size = sizes.get(reference)
        if native_size and reference_size:
            width, height = native_size
            density = c.get('density')
            reference_density = c.get('referenceDensity')
            need(number(density, .01) and c.get('pixelWidth') == width and
                 math.isclose(width / density, 390, abs_tol=.01),
                 f'{label}: native PNG width/density is not390 logical points')
            need(c.get('referenceLogicalWidth') == c.get('nativeLogicalWidth') == 390,
                 f'{label}: unequal logical viewport widths')
            bounds, rbounds = c.get('contentBounds'), c.get('referenceContentBounds')
            need(rectangle(bounds, width, height), f'{label}: invalid native pixel bounds')
            need(rectangle(rbounds, *reference_size) and number(reference_density, .01) and
                 math.isclose(rbounds['width'] / reference_density, 390, abs_tol=.01),
                 f'{label}: invalid reference crop/logical width')
            insets = c.get('safeInsets')
            need(isinstance(insets, dict) and set(insets) == {'top', 'right', 'bottom', 'left'}
                 and all(number(v) for v in insets.values()) and number(density, .01)
                 and insets['top'] + insets['bottom'] < height / density
                 and insets['left'] + insets['right'] < 390, f'{label}: invalid logical safe insets')
            need(number(c.get('fontScale'), .01), f'{label}: invalid font scale')
        if session:
            receipt = json.loads(session.read_text())
            need(receipt.get('originalCaptures') is True and
                 all(receipt.get(k) == binary.get(k) for k in
                     ['platform', 'sourceCommit', 'buildId', 'productFingerprint', 'runId'])
                 and receipt.get('binarySha256') == evidence.get(binary.get('artifactEvidence'), {}).get('sha256'),
                 f'{label}: capture-session binary identity mismatch')
            capture = receipt.get('captures', {}).get(c.get('captureId'), {})
            need(capture.get('imageEvidence') == c.get('nativeEvidence') and
                 capture.get('sha256') == evidence.get(c.get('nativeEvidence'), {}).get('sha256')
                 and all(capture.get(k) == c.get(k) for k in ['pixelWidth', 'density',
                     'nativeLogicalWidth', 'fontScale', 'safeInsets', 'contentBounds'])
                 and capture.get('scope') == obligation.get('scope')
                 and capture.get('state') == obligation.get('state'),
                 f'{label}: capture-session image/state/viewport identity mismatch')

    proofs = m.get('functionalProofs', {})
    need(set(proofs) == set(PROFILES), 'missing required native functional profiles')
    for key, proof in proofs.items():
        label = 'functional ' + key
        refs(proof, label)
        binary = binaries.get(proof.get('binary'), {})
        need(proof.get('accepted') is True and proof.get('productFingerprint') == fingerprint,
             f'{label}: missing/stale acceptance')
        configuration = tuple(proof.get(k) for k in ['platform', 'profile', 'navigationMode', 'textSize'])
        need(configuration == PROFILES.get(key), f'{label}: incorrect device/navigation/text configuration')
        need(binary.get('platform') == proof.get('platform'), f'{label}: wrong binary')
        junit = typed(proof.get('junitEvidence'), 'native-junit', label)
        summary = typed(proof.get('receiptEvidence'), 'native-functional-receipt', label)
        fixture = typed(proof.get('fixtureEvidence'), 'fixture-manifest', label)
        for field in ['junitEvidence', 'receiptEvidence', 'fixtureEvidence']:
            need(proof.get(field) in proof.get('evidence', []), f'{label}: unbound {field}')
        assertions = proof.get('assertions', {})
        need(ASSERTIONS.get(key, set()).issubset(assertions), f'{label}: missing behavioral assertions')
        for name, assertion in assertions.items():
            need(assertion.get('status') == 'passed', f'{label}/{name}: not passed')
            refs(assertion, f'{label}/{name}')
            need(all(evidence.get(e, {}).get('kind') in {'native-command-log', 'native-storage-receipt',
                 'clipboard-receipt', 'image-metadata-receipt', 'window-insets-receipt'}
                 for e in assertion.get('evidence', [])), f'{label}/{name}: not native behavior evidence')
        if junit:
            tree = ET.fromstring(junit.read_bytes())
            cases = list(tree.iter('testcase'))
            need(bool(cases) and any(case.find('skipped') is None for case in cases) and
                 not list(tree.iter('failure')) and not list(tree.iter('error')),
                 f'{label}: JUnit contains failure/no executed tests')
        if fixture:
            receipt = json.loads(fixture.read_text())
            need(HEX40.fullmatch(receipt.get('sourceCommit', '')) is not None and
                 receipt.get('fixtureFingerprint') == source(receipt.get('sourceCommit'), True),
                 f'{label}: fixture Git identity mismatch')
        if summary:
            receipt = json.loads(summary.read_text())
            need(number(receipt.get('completedCommands'), 1) and receipt.get('failedCommands') == 0
                 and receipt.get('eligibilityOnly') is False,
                 f'{label}: no executed native command proof')
            need(receipt.get('assertions') == assertions and
                 receipt.get('binarySha256') == evidence.get(binary.get('artifactEvidence'), {}).get('sha256')
                 and receipt.get('configuration') == dict(zip(
                     ['platform', 'profile', 'navigationMode', 'textSize'], configuration))
                 and receipt.get('junitSha256') == evidence.get(proof.get('junitEvidence'), {}).get('sha256')
                 and receipt.get('fixtureSha256') == evidence.get(proof.get('fixtureEvidence'), {}).get('sha256'),
                 f'{label}: receipt/build/fixture/JUnit/assertion identity mismatch')
