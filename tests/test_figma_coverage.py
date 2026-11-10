"""Synthetic acceptance fixtures test bookkeeping, never real design approval."""
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('coverage_gate', ROOT / 'scripts/verify-figma-coverage.py')
gate = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(gate)


class CoverageGateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        for name in gate.AUDIT_INPUTS + ['docs/design/figma-page-0-1.xml', gate.MANIFEST]:
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, target)
        self.m = json.loads((self.root / gate.MANIFEST).read_text())
        self.m['baseProductFingerprint'] = gate.product_fingerprint(self.root)

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
        self.assertIn('release requires both platforms/all nine current frames', errors)
        self.assertIn('missing independent rendered review receipt', errors)

    def test_unequal_viewports_and_stale_product_rejected(self):
        self.complete_synthetic_inventory()
        self.receipt('inventory')
        self.m['comparisons'] = [dict(platform='android', frame='2:494',
             productFingerprint='old', referenceLogicalWidth=390, nativeLogicalWidth=411,
             density=3, pixelWidth=1233, evidence=['metadata'])]
        errors = self.check('release')
        self.assertIn('comparison android/2:494: stale product source', errors)
        self.assertIn('comparison android/2:494: unequal logical viewport widths', errors)


if __name__ == '__main__':
    unittest.main()
