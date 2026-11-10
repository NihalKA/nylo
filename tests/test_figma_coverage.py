"""Synthetic acceptance fixtures test bookkeeping, never real design approval."""
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest
import struct
import subprocess
import zlib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('coverage_gate', ROOT / 'scripts/verify-figma-coverage.py')
gate = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(gate)


class CoverageGateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        for name in gate.AUDIT_INPUTS + ['docs/design/figma-page-0-1.xml',
                                       'docs/design/figma-discovered-scope.json', gate.MANIFEST]:
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, target)
        self.m = json.loads((self.root / gate.MANIFEST).read_text())
        for item in self.m['evidence'].values():
            target = self.root / item['path']
            if not target.exists():
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / item['path'], target)
        self.m['baseProductFingerprint'] = gate.product_fingerprint(self.root)

    def discovery(self, mutate):
        path = self.root / self.m['discovery']['path']
        value = json.loads(path.read_text())
        mutate(value)
        path.write_text(json.dumps(value))
        self.m['discovery']['sha256'] = gate.sha(path.read_bytes())

    def save(self):
        (self.root / gate.MANIFEST).write_text(json.dumps(self.m))

    def complete_synthetic_inventory(self):
        # Explicitly synthetic: exercises a valid schema, not real review quality.
        for entry in self.m['nodes'].values():
            entry.update(status='mapped', target='test-only', rationale='synthetic fixture')
        for frame in self.m['frames'].values():
            for entry in frame['checks'].values():
                entry.update(reviewed=True, finding='synthetic test observation', evidence=['metadata'])
        for entry in self.m['domains'].values():
            entry.update(status='observed', rationale='synthetic fixture', evidence=['metadata'])
        for entry in self.m['extensions']:
            entry.update(rules=['synthetic'], states=['synthetic'])
        def complete(discovery):
            for domain, entry in discovery['domains'].items():
                entry.update(enumerationComplete=True, items=[{'id': 'fixture'}])
                self.m['domains'][domain]['items'] = {'fixture': dict(status='mapped',
                    target='synthetic', rationale='test only', evidence=['metadata'])}
            for scope in discovery['scopes'].values():
                scope['enumerationComplete'] = True
        self.discovery(complete)
        self.save()

    def receipt(self, kind, **overrides):
        directory = self.root / 'docs/reviews'
        directory.mkdir(exist_ok=True)
        report = directory / f'fixture-{kind}.md'
        report.write_text('SYNTHETIC TEST FIXTURE ONLY. No actual design review.\n')
        receipt = dict(kind=kind, model='gpt-6-astra', independent=True, score=10,
                       decision='approved', unresolvedFindings=[], reviewedAt='2026-11-10',
                       auditDigest=gate.audit_digest(self.root, self.m),
                       report=str(report.relative_to(self.root)), reportSha256=gate.sha(report.read_bytes()))
        receipt.update(overrides)
        (directory / f'figma-{kind}-receipt.json').write_text(json.dumps(receipt))

    def check(self, phase='inventory'):
        self.save()
        return gate.verify(self.root, phase)[0]

    def test_real_manifest_is_blocked(self):
        errors = self.check()
        self.assertTrue(any('unreviewed' in x for x in errors))
        self.assertTrue(any('unknown' in x for x in errors))

    def test_valid_inventory_allows_planned_product_gaps(self):
        self.complete_synthetic_inventory()
        self.assertEqual([], self.check())

    def test_missing_node_is_rejected(self):
        self.complete_synthetic_inventory()
        del self.m['nodes']['2:494']
        self.assertIn('node coverage differs from metadata (missing/extra IDs)', self.check())

    def test_missing_frame_or_domain_is_rejected(self):
        self.complete_synthetic_inventory()
        del self.m['frames']['2:494']
        del self.m['domains']['hidden-layers']
        errors = self.check()
        self.assertIn('frame coverage differs from metadata', errors)
        self.assertIn('file-wide domain accounting incomplete', errors)

    def test_one_unreviewed_descendant_blocks_gate(self):
        self.complete_synthetic_inventory()
        self.m['nodes']['2:500']['status'] = 'unreviewed'
        self.assertIn('node 2:500: unreviewed', self.check())

    def test_unreviewed_duplicate_cannot_inherit_acceptance(self):
        self.complete_synthetic_inventory()
        self.m['nodes']['1:2'].update(status='duplicate', duplicateOf='2:494')
        self.m['nodes']['2:494']['status'] = 'unreviewed'
        self.assertIn('node 1:2: invalid/unreviewed duplicate target', self.check())

    def test_changed_evidence_blocks_gate(self):
        self.complete_synthetic_inventory()
        (self.root / 'docs/testing/figma-full-file-audit.md').write_text('changed')
        self.assertIn('evidence missing/changed: audit', self.check())

    def test_path_escape_rejected(self):
        self.m['snapshot']['path'] = '../outside.xml'
        with self.assertRaises(ValueError):
            self.check()

    def test_implementation_requires_real_review_record(self):
        self.complete_synthetic_inventory()
        self.assertIn('missing independent inventory review receipt', self.check('implementation'))
        self.receipt('inventory', score=9)
        self.assertIn('inventory: not a 10/10 approval', self.check('implementation'))
        self.receipt('inventory')
        self.assertEqual([], self.check('implementation'))

    def test_review_stales_after_audit_changes(self):
        self.complete_synthetic_inventory()
        self.receipt('inventory')
        self.m['gaps'][0]['plan'] += ' changed'
        self.assertIn('inventory: stale audit review', self.check('implementation'))

    def test_report_tamper_rejected(self):
        self.complete_synthetic_inventory()
        self.receipt('inventory')
        (self.root / 'docs/reviews/fixture-inventory.md').write_text('changed')
        self.assertIn('inventory: missing/changed independent report', self.check('implementation'))

    def test_resolution_progress_does_not_stale_inventory_approval(self):
        self.complete_synthetic_inventory()
        self.receipt('inventory')
        self.m['gaps'][0].update(status='resolved', resolution='synthetic',
                                 resolutionEvidence=['metadata'])
        self.assertEqual([], self.check('implementation'))

    def test_product_change_invalidates_preimplementation_baseline(self):
        self.complete_synthetic_inventory()
        self.receipt('inventory')
        (self.root / 'src').mkdir()
        (self.root / 'src/changed.tsx').write_text('test product change')
        self.assertTrue(any('product changed since inventory' in x
                            for x in self.check('implementation')))

    def test_inventory_approval_does_not_approve_release(self):
        self.complete_synthetic_inventory()
        self.receipt('inventory')
        errors = self.check('release')
        self.assertTrue(any('unresolved' in x for x in errors))
        self.assertIn('release comparisons must cover every reviewed state/extension obligation exactly once', errors)
        self.assertIn('missing independent rendered review receipt', errors)

    def test_unequal_viewports_and_stale_product_rejected(self):
        self.complete_synthetic_inventory()
        self.receipt('inventory')
        self.m['comparisons'] = [dict(obligation='android|2:494|reference', mode='capture',
             productFingerprint='old', referenceLogicalWidth=390, nativeLogicalWidth=411,
             density=3, pixelWidth=1233, evidence=['metadata'])]
        errors = self.check('release')
        self.assertIn('comparison android|2:494|reference: stale product source', errors)
        self.assertTrue(any('expected native-original-png' in x for x in errors))

    def evidence(self, key, kind, data):
        path = self.root / ('proofs/' + key)
        path.parent.mkdir(exist_ok=True)
        path.write_bytes(data)
        self.m['evidence'][key] = dict(kind=kind, path=path.relative_to(self.root).as_posix(),
            sha256=gate.sha(data), provenance='SYNTHETIC TEST FIXTURE ONLY')
        return path

    def png(self, width=390, height=884, sample=0):
        def chunk(kind, payload):
            return struct.pack('>I', len(payload)) + kind + payload + struct.pack('>I', zlib.crc32(kind + payload))
        header = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
        pixels = (b'\0' + bytes([sample]) * (width * 3)) * height
        return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header) + chunk(b'IDAT', zlib.compress(pixels)) + chunk(b'IEND', b'')

    def release_fixture(self):
        # Exercise a full structural pass using synthetic files, never real receipts.
        self.complete_synthetic_inventory()
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True)
        subprocess.run(['git', '-C', str(self.root), 'add', '.'], check=True)
        subprocess.run(['git', '-C', str(self.root), '-c', 'user.name=Fixture', '-c',
            'user.email=fixture@example.invalid', 'commit', '-qm', 'synthetic fixture'], check=True)
        commit = gate.git(self.root, 'rev-parse', 'HEAD').decode().strip()
        fingerprint = gate.product_fingerprint(self.root)
        from figma_release import ASSERTIONS, PROFILES
        from figma_evidence import tree_fingerprint
        self.evidence('native.png', 'native-original-png', self.png())
        self.evidence('reference.png', 'reference-original-png', self.png())
        for platform in ['ios', 'android']:
            archive = self.root / 'fixture.zip'
            with zipfile.ZipFile(archive, 'w') as z:
                z.writestr('synthetic-native-binary', 'TEST ONLY')
            self.evidence(platform + '.zip', 'binary-artifact', archive.read_bytes())
            binary = dict(platform=platform, sourceCommit=commit, productFingerprint=fingerprint,
                          runId='123', buildId='synthetic-1', artifactEvidence=platform + '.zip',
                          metadataEvidence=platform + '-identity')
            self.m['binaries'][platform] = binary
            receipt = {k: binary[k] for k in ['platform', 'sourceCommit', 'productFingerprint', 'runId', 'buildId']}
            receipt.update(identityVerified=True, binarySha256=self.m['evidence'][platform+'.zip']['sha256'],
                passedChecks=['compiled-identity', 'font12-svg45', 'privacy-permissions',
                              'archive-digest-crc', 'original-certificate', 'bundletool', 'linked-native-identity'])
            self.evidence(platform + '-identity', 'binary-identity-receipt', gate.canonical(receipt))
            session = {k: binary[k] for k in ['platform', 'sourceCommit', 'productFingerprint', 'runId', 'buildId']}
            session.update(originalCaptures=True, binarySha256=receipt['binarySha256'], captures={})
            self.evidence(platform + '-session', 'native-capture-session', gate.canonical(session))
        for obligation in self.m['releaseObligations']:
            platform = obligation['platform']
            if obligation['mode'] == 'exception':
                self.m['comparisons'].append(dict(obligation=obligation['id'],
                    mode='exception', accepted=True, findings='synthetic exception fixture',
                    rationale=obligation['rationale'], evidence=['metadata']))
                continue
            comparison = dict(obligation=obligation['id'], captureId=obligation['id'], mode='capture', accepted=True,
                findings='synthetic structural fixture', binary=platform, productFingerprint=fingerprint,
                nativeEvidence='native.png', referenceEvidence='reference.png', sessionEvidence=platform+'-session',
                nativeLogicalWidth=390, referenceLogicalWidth=390, pixelWidth=390, density=1,
                referenceDensity=1, fontScale=1, safeInsets=dict(top=0, right=0, bottom=0, left=0),
                contentBounds=dict(x=0, y=0, width=390, height=884),
                referenceContentBounds=dict(x=0, y=0, width=390, height=884),
                evidence=['native.png', 'reference.png', platform+'-session'])
            self.m['comparisons'].append(comparison)
            item = self.m['evidence'][platform+'-session']
            session = json.loads((self.root / item['path']).read_text())
            capture = {k: comparison[k] for k in ['pixelWidth', 'density', 'nativeLogicalWidth',
                                                  'fontScale', 'safeInsets', 'contentBounds']}
            capture.update(scope=obligation['scope'], state=obligation['state'], imageEvidence='native.png',
                           sha256=self.m['evidence']['native.png']['sha256'])
            session['captures'][obligation['id']] = capture
            self.evidence(platform+'-session', 'native-capture-session', gate.canonical(session))
        self.evidence('junit.xml', 'native-junit', b'<testsuite><testcase name="synthetic"/></testsuite>')
        self.evidence('native-log', 'native-command-log', b'SYNTHETIC TEST ONLY')
        fixture = dict(sourceCommit=commit, fixtureFingerprint=tree_fingerprint(self.root, True))
        self.evidence('fixture.json', 'fixture-manifest', gate.canonical(fixture))
        for key, configuration in PROFILES.items():
            platform = configuration[0]
            settings = dict(zip(['platform', 'profile', 'navigationMode', 'textSize'], configuration))
            assertions = {name: dict(status='passed', evidence=['native-log']) for name in ASSERTIONS[key]}
            summary = dict(completedCommands=10, failedCommands=0, eligibilityOnly=False,
                configuration=settings, assertions=assertions,
                binarySha256=self.m['evidence'][platform+'.zip']['sha256'],
                junitSha256=self.m['evidence']['junit.xml']['sha256'],
                fixtureSha256=self.m['evidence']['fixture.json']['sha256'])
            self.evidence(key, 'native-functional-receipt', gate.canonical(summary))
            self.m['functionalProofs'][key] = dict(**settings, accepted=True, binary=platform,
                productFingerprint=fingerprint, assertions=assertions, junitEvidence='junit.xml',
                receiptEvidence=key, fixtureEvidence='fixture.json', evidence=['junit.xml', key, 'fixture.json'])
        for gap in self.m['gaps']:
            gap.update(status='resolved', resolution='synthetic', resolutionEvidence=['native-log'])
        self.save()
        self.receipt('inventory')
        self.receipt('rendered', productFingerprint=fingerprint,
            releaseDigest=gate.release_digest(self.m, gate.audit_digest(self.root, self.m), fingerprint))

    def test_full_synthetic_release_schema_passes(self):
        self.release_fixture()
        self.assertEqual([], self.check('release'))

    def test_reviewed_exception_requires_same_release_rationale(self):
        self.release_fixture()
        exception = next(c for c in self.m['comparisons'] if c['mode'] == 'exception')
        exception['rationale'] = 'different unreviewed waiver'
        self.assertTrue(any('exception differs from independently reviewed inventory'
                            in error for error in self.check('release')))

    def test_replacing_native_image_invalidates_release_review(self):
        self.release_fixture()
        self.evidence('native.png', 'native-original-png', self.png(sample=1))
        self.assertIn('rendered: stale release evidence/proofs/resolutions review', self.check('release'))

    def test_changed_resolution_invalidates_release_review(self):
        self.release_fixture()
        self.m['gaps'][0]['resolution'] = 'changed'
        self.assertIn('rendered: stale release evidence/proofs/resolutions review', self.check('release'))

    def test_native_image_declared_dimensions_must_match_bytes(self):
        self.release_fixture()
        self.m['comparisons'][0]['pixelWidth'] = 1233
        self.assertTrue(any('PNG width/density' in x for x in self.check('release')))

    def test_missing_state_or_extension_is_rejected(self):
        self.complete_synthetic_inventory()
        self.m['extensions'].pop()
        self.m['releaseObligations'].pop()
        errors = self.check()
        self.assertIn('missing discovered/known extension scopes', errors)
        self.assertIn('release obligations omit discovered screens/states/extensions', errors)

    def test_native_build_inputs_and_lifecycle_scripts_change_fingerprint(self):
        before = gate.product_fingerprint(self.root)
        path = self.root / 'scripts/android/configure-build.py'
        path.parent.mkdir(parents=True)
        path.write_text('native input')
        after = gate.product_fingerprint(self.root)
        self.assertNotEqual(before, after)
        package = self.root / 'package.json'
        package.write_text(json.dumps({'scripts': {'postinstall': 'native patch'}}))
        self.assertNotEqual(after, gate.product_fingerprint(self.root))
        before = gate.product_fingerprint(self.root)
        package.write_text(json.dumps({'scripts': {'postinstall': 'native patch', 'dashboard': 'user script'}}))
        self.assertEqual(before, gate.product_fingerprint(self.root))

    def test_ci_freeze_rejects_product_change_but_allows_docs(self):
        self.release_fixture()
        # Baseline has no review records committed: a product change MUST fail.
        base = gate.git(self.root, 'rev-parse', 'HEAD').decode().strip()
        (self.root / 'src').mkdir()
        (self.root / 'src/new.tsx').write_text('new UI')
        errors, _ = gate.verify_changes(self.root, base)
        self.assertTrue(errors)
        (self.root / 'src/new.tsx').unlink()
        (self.root / 'new-audit.md').write_text('audit only')
        errors, _ = gate.verify_changes(self.root, base)
        self.assertEqual([], errors)

    def test_prechange_approval_authorizes_implementation_not_postchange_selfapproval(self):
        self.release_fixture()
        subprocess.run(['git', '-C', str(self.root), 'add', '.'], check=True)
        subprocess.run(['git', '-C', str(self.root), '-c', 'user.name=Fixture', '-c',
            'user.email=fixture@example.invalid', 'commit', '-qm', 'synthetic approval baseline'], check=True)
        base = gate.git(self.root, 'rev-parse', 'HEAD').decode().strip()
        (self.root / 'src').mkdir()
        (self.root / 'src/new.tsx').write_text('synthetic approved implementation')
        self.assertEqual([], gate.verify_changes(self.root, base)[0])
        self.m['gaps'][0]['plan'] += ' broadened after review'
        self.save()
        self.assertTrue(any('inventory/policy changed' in x
                            for x in gate.verify_changes(self.root, base)[0]))

    def test_discovered_hidden_nodes_cannot_be_dropped(self):
        self.complete_synthetic_inventory()
        self.discovery(lambda d: d['extraNodes'].append(dict(id='9:1', type='frame',
            name='synthetic hidden node', page='0:1', source='test only')))
        self.assertIn('node coverage differs from metadata (missing/extra IDs)', self.check())

    def test_duplicate_xml_ids_cannot_collapse_into_dictionary(self):
        self.complete_synthetic_inventory()
        p = self.root / self.m['snapshot']['path']
        p.write_text(p.read_text().replace('</canvas>', '<frame id="2:494" name="duplicate" /></canvas>'))
        self.m['snapshot']['sha256'] = gate.sha(p.read_bytes())
        self.m['evidence']['metadata']['sha256'] = gate.sha(p.read_bytes())
        self.assertIn('duplicate source XML node IDs', self.check())

    def test_photo_proof_change_stales_rendered_review(self):
        self.release_fixture()
        self.m['functionalProofs']['ios-photo']['assertions']['exif-allowlist']['status'] = 'failed'
        errors = self.check('release')
        self.assertIn('functional ios-photo/exif-allowlist: not passed', errors)
        self.assertIn('rendered: stale release evidence/proofs/resolutions review', errors)

    def test_invented_binary_identity_and_metadata_image_rejected(self):
        self.release_fixture()
        self.m['binaries']['android']['sourceCommit'] = 'not-a-commit'
        self.m['comparisons'][0]['nativeEvidence'] = 'metadata'
        errors = self.check('release')
        self.assertIn('binary android: stale/unverified Git source', errors)
        self.assertTrue(any('expected native-original-png' in x for x in errors))

    def test_capture_session_viewport_mismatch_rejected(self):
        self.release_fixture()
        self.m['comparisons'][0]['fontScale'] = 2
        self.assertTrue(any('capture-session image/state/viewport identity mismatch' in x
                            for x in self.check('release')))

    def test_png_crc_damage_rejected(self):
        self.release_fixture()
        data = bytearray(self.png())
        data[-1] ^= 1
        self.evidence('native.png', 'native-original-png', bytes(data))
        self.assertTrue(any('PNG CRC mismatch' in x for x in self.check('release')))

    def test_tracked_native_sources_and_nested_build_directory_are_product(self):
        self.release_fixture()
        base = gate.git(self.root, 'rev-parse', 'HEAD').decode().strip()
        for name in ['android/app/src/main/java/example/MainActivity.kt',
                     'ios/Nylo/Native.swift', 'src/build/runtime.ts']:
            before = gate.product_fingerprint(self.root)
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('synthetic native/source change')
            subprocess.run(['git', '-C', str(self.root), 'add', '-f', name], check=True)
            self.assertNotEqual(before, gate.product_fingerprint(self.root), name)
            self.assertTrue(gate.verify_changes(self.root, base)[0], name)

    def test_ignored_generated_native_output_is_distinct_from_tracked_source(self):
        self.release_fixture()
        (self.root / '.gitignore').write_text('/ios/\n/android/\n')
        before = gate.product_fingerprint(self.root)
        path = self.root / 'ios/build/generated.txt'
        path.parent.mkdir(parents=True)
        path.write_text('ignored generated output')
        self.assertEqual(before, gate.product_fingerprint(self.root))
        subprocess.run(['git', '-C', str(self.root), 'add', '-f', 'ios/build/generated.txt'], check=True)
        self.assertNotEqual(before, gate.product_fingerprint(self.root))

    def test_state_floor_cannot_be_removed_from_discovery_and_obligations(self):
        self.complete_synthetic_inventory()
        self.discovery(lambda d: [scope.update(states=['reference']) for scope in d['scopes'].values()])
        self.m['releaseObligations'] = [o for o in self.m['releaseObligations'] if o['state']=='reference']
        self.assertTrue(any('conservative states removed' in x for x in self.check()))

    def test_indexed_png_without_palette_and_invalid_idat_order_rejected(self):
        from figma_evidence import png_size
        def chunk(kind, payload):
            return struct.pack('>I', len(payload)) + kind + payload + struct.pack('>I', zlib.crc32(kind + payload))
        header = struct.pack('>IIBBBBB', 390, 884, 8, 3, 0, 0, 0)
        data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header) + chunk(b'IDAT',
            zlib.compress((b'\0' + bytes(390))*884)) + chunk(b'IEND', b'')
        path = self.evidence('bad.png', 'native-original-png', data)
        with self.assertRaises(ValueError):
            png_size(path)
        header = struct.pack('>IIBBBBB', 390, 884, 8, 2, 0, 0, 0)
        compressed = zlib.compress((b'\0' + bytes(390*3))*884)
        data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header) + chunk(b'IDAT', compressed[:3]) + \
            chunk(b'tEXt', b'Note\0synthetic') + chunk(b'IDAT', compressed[3:]) + chunk(b'IEND', b'')
        path.write_bytes(data)
        with self.assertRaisesRegex(ValueError, 'IDAT order'):
            png_size(path)

    def test_unknown_critical_png_chunk_rejected(self):
        from figma_evidence import png_size
        data = self.png()
        kind, payload = b'ABCD', b'unsupported'
        extra = struct.pack('>I',len(payload))+kind+payload+struct.pack('>I',zlib.crc32(kind+payload))
        path = self.evidence('critical.png', 'native-original-png', data[:33]+extra+data[33:])
        with self.assertRaisesRegex(ValueError, 'unsupported PNG chunk'):
            png_size(path)


if __name__ == '__main__':
    unittest.main()
