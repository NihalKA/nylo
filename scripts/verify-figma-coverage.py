#!/usr/bin/env python3
"""Fail-closed evidence bookkeeping; never awards a visual score or authors a review."""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = 'docs/design/figma-coverage.json'
DOMAINS = {'pages', 'hidden-layers', 'components-variants-libraries',
           'variables-styles', 'fonts', 'assets', 'prototypes-transitions',
           'states', 'app-extensions'}
CHECKS = {'geometry', 'typography', 'artwork', 'colours-effects', 'content',
          'states-actions', 'responsive-accessibility'}
AUDIT_INPUTS = ['AGENTS.md', 'docs/adr/0001-figma-coverage-before-implementation.md',
                'docs/testing/figma-full-file-audit.md', 'scripts/verify-figma-coverage.py']


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def safe_path(root, value):
    if not isinstance(value, str) or not value or Path(value).is_absolute():
        raise ValueError('expected repository-relative evidence path')
    p = (root / value).resolve()
    if not p.is_relative_to(root.resolve()):
        raise ValueError('evidence path escapes repository')
    return p


def product_fingerprint(root):
    # Actual checkout bytes, including added files; dashboard package scripts excluded.
    files = []
    for directory in ['app', 'src', 'assets', 'modules', 'plugins']:
        files.extend(p for p in (root / directory).rglob('*') if p.is_file()
                     and not any(x in p.parts for x in ['node_modules', '.git', 'build']))
    for name in ['app.json', 'app.config.ts', 'app.config.js', 'package-lock.json',
                 'babel.config.js', 'metro.config.js', 'tsconfig.json']:
        if (root / name).is_file():
            files.append(root / name)
    entries = [(p.relative_to(root).as_posix(), sha(p.read_bytes())) for p in sorted(set(files))]
    if (root / 'package.json').exists():
        package = json.loads((root / 'package.json').read_text())
        entries.append(('package-runtime', sha(canonical({k: package.get(k) for k in
                        ['main', 'dependencies', 'devDependencies', 'overrides', 'resolutions']}))))
    return sha(canonical(entries))


def audit_digest(root, manifest):
    # Freeze design scope/plans, not later resolution/native evidence. Otherwise
    # implementing an approved plan would invalidate its pre-implementation review.
    inputs = [(name, sha(safe_path(root, name).read_bytes())) for name in AUDIT_INPUTS]
    inventory = {k: v for k, v in manifest.items()
                 if k not in {'comparisons', 'functionalProofs', 'evidence', 'gaps'}}
    inventory['gaps'] = [{k: v for k, v in gap.items()
                          if k not in {'status', 'resolution', 'resolutionEvidence'}}
                         for gap in manifest['gaps']]
    referenced = set()

    def collect(value):
        if isinstance(value, dict):
            referenced.update(value.get('evidence', []))
            for child in value.values():
                collect(child)
        elif isinstance(value, list):
            for child in value:
                collect(child)

    collect(inventory)
    inventory['evidence'] = {k: manifest['evidence'][k] for k in sorted(referenced)
                             if k in manifest['evidence']}
    return sha(canonical({'manifest': inventory, 'inputs': inputs}))


def verify(root, phase, manifest_path=MANIFEST):
    errors = []

    def need(condition, message):
        if not condition:
            errors.append(message)

    m = json.loads(safe_path(root, manifest_path).read_text())
    need(m.get('schemaVersion') == 1, 'unsupported manifest schema')
    snapshot = safe_path(root, m['snapshot']['path']).read_bytes()
    need(sha(snapshot) == m['snapshot']['sha256'], 'stale metadata snapshot digest')
    page = ET.fromstring(snapshot)
    source = {e.attrib['id']: e for e in page.iter() if 'id' in e.attrib}
    frames = {e.attrib['id'] for e in page if e.tag == 'frame'}
    need(len(source) == 1322 and len(frames) == 14, 'scope changed: re-inventory whole file')
    nodes = m['nodes']
    need(set(nodes) == set(source), 'node coverage differs from metadata (missing/extra IDs)')
    need(set(m['frames']) == frames, 'frame coverage differs from metadata')
    need(set(m['domains']) == DOMAINS, 'file-wide domain accounting incomplete')
    evidence = m['evidence']
    for name, item in evidence.items():
        p = safe_path(root, item['path'])
        need(p.is_file() and sha(p.read_bytes()) == item.get('sha256'),
             f'evidence missing/changed: {name}')
        need(bool(item.get('provenance')), f'evidence provenance missing: {name}')

    def refs(entry, label):
        paths = entry.get('evidence', [])
        need(bool(paths) and all(x in evidence for x in paths), f'{label}: missing evidence')

    for node_id, entry in nodes.items():
        label = f'node {node_id}'
        need(entry.get('status') in {'mapped', 'exception', 'duplicate'}, f'{label}: unreviewed')
        need(bool(entry.get('target')) and bool(entry.get('rationale')), f'{label}: no disposition')
        refs(entry, label)
        if entry.get('status') == 'duplicate':
            other_id = entry.get('duplicateOf')
            other = source.get(other_id)
            current = source.get(node_id)
            need(other is not None and other_id != node_id and
                 nodes.get(other_id, {}).get('status') in {'mapped', 'exception'},
                 f'{label}: invalid/unreviewed duplicate target')
            if other is not None and current is not None:
                need(current.tag == other.tag and all(current.get(k) == other.get(k)
                     for k in ['name', 'width', 'height']), f'{label}: duplicate geometry/type differs')
    for frame_id, entry in m['frames'].items():
        need(set(entry.get('checks', {})) == CHECKS, f'frame {frame_id}: incomplete checklist')
        for check, result in entry.get('checks', {}).items():
            need(result.get('reviewed') is True and bool(result.get('finding')),
                 f'frame {frame_id}/{check}: unreviewed')
            refs(result, f'frame {frame_id}/{check}')
    for domain, entry in m['domains'].items():
        need(entry.get('status') in {'observed', 'not-present'} and bool(entry.get('rationale')),
             f'domain {domain}: unknown/unexplained')
        refs(entry, f'domain {domain}')
    for gap in m['gaps']:
        label = 'gap ' + gap['id']
        need(gap.get('status') in {'planned', 'resolved'} and bool(gap.get('plan'))
             and bool(gap.get('target')), f'{label}: no implementation plan')
        need(bool(gap.get('nodes')) and set(gap['nodes']).issubset(source), f'{label}: invalid scope')
        refs(gap, label)
        if phase == 'release':
            need(gap.get('status') == 'resolved', f'{label}: unresolved')
            need(bool(gap.get('resolution')), f'{label}: resolution missing')
            need(bool(gap.get('resolutionEvidence')) and
                 all(x in evidence for x in gap.get('resolutionEvidence', [])),
                 f'{label}: resolution evidence missing')
    need(bool(m.get('extensions')), 'missing app-extension accounting')
    for entry in m.get('extensions', []):
        need(all(entry.get(k) for k in ['scope', 'rules', 'states', 'rationale']),
             'extension missing rules/states/rationale')
        refs(entry, 'extension')

    digest = audit_digest(root, m)

    def review(kind, expected_fingerprint=None):
        path = root / 'docs/reviews' / ('figma-' + kind + '-receipt.json')
        if not path.exists():
            errors.append(f'missing independent {kind} review receipt')
            return
        receipt = json.loads(path.read_text())
        need(receipt.get('kind') == kind and receipt.get('model') == 'gpt-6-astra'
             and receipt.get('independent') is True, f'{kind}: wrong reviewer/scope')
        need(receipt.get('auditDigest') == digest, f'{kind}: stale audit review')
        need(receipt.get('decision') == 'approved' and receipt.get('score') == 10
             and receipt.get('unresolvedFindings') == [], f'{kind}: not a 10/10 approval')
        need(bool(receipt.get('reviewedAt')), f'{kind}: missing review date')
        report = safe_path(root, receipt.get('report'))
        need(report.is_file() and sha(report.read_bytes()) == receipt.get('reportSha256'),
             f'{kind}: missing/changed independent report')
        if expected_fingerprint:
            need(receipt.get('productFingerprint') == expected_fingerprint,
                 f'{kind}: stale product review')
            need(receipt.get('comparisonsDigest') == sha(canonical(m['comparisons'])),
                 f'{kind}: stale native comparisons review')

    if phase in {'implementation', 'release'}:
        review('inventory')
    if phase == 'implementation':
        need(m.get('baseProductFingerprint') == product_fingerprint(root),
             'product changed since inventory baseline; review actual changes before new implementation')
    if phase == 'release':
        fingerprint = product_fingerprint(root)
        comparisons = m.get('comparisons', [])
        required = {(platform, frame) for platform in ['ios', 'android']
                    for frame in frames if frame.startswith('2:')}
        need({(c['platform'], c['frame']) for c in comparisons} == required,
             'release requires both platforms/all nine current frames')
        for c in comparisons:
            label = f"comparison {c['platform']}/{c['frame']}"
            need(c.get('productFingerprint') == fingerprint, f'{label}: stale product source')
            need(c.get('referenceLogicalWidth') == c.get('nativeLogicalWidth') == 390,
                 f'{label}: unequal logical viewport widths')
            density = c.get('density', 0)
            need(density > 0 and c.get('pixelWidth') == density * 390,
                 f'{label}: inconsistent pixel width/density')
            need(c.get('fontScale', 0) > 0 and bool(c.get('safeInsets'))
                 and bool(c.get('contentBounds')) and bool(c.get('findings'))
                 and bool(c.get('sourceCommit')) and len(c.get('binarySha256', '')) == 64,
                 f'{label}: incomplete native identity/geometry/review')
            need(c.get('accepted') is True, f'{label}: not accepted')
            refs(c, label)
            for key in ['nativeEvidence', 'referenceEvidence']:
                need(c.get(key) in c.get('evidence', []), f'{label}: missing {key}')
        need(set(m.get('functionalProofs', {})) == {'ios-compact', 'ios-large',
             'ios-max', 'android-gesture', 'android-threebutton', 'gallery', 'pdf', 'photo'},
             'missing required native functional profiles')
        for label, proof in m.get('functionalProofs', {}).items():
            need(proof.get('accepted') is True and proof.get('productFingerprint') == fingerprint,
                 f'functional {label}: missing/stale acceptance')
            refs(proof, 'functional ' + label)
        review('rendered', fingerprint)
    return errors, digest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('phase', choices=['inventory', 'implementation', 'release'])
    args = parser.parse_args()
    try:
        errors, digest = verify(ROOT, args.phase)
    except (OSError, ValueError, KeyError, TypeError, ET.ParseError) as exc:
        print(f'BLOCKED: invalid/missing audit input: {exc}', file=sys.stderr)
        return 1
    print(f'Audit digest: {digest}')
    if errors:
        print(f'BLOCKED {args.phase}: {len(errors)} findings')
        for item in errors[:35]:
            print('- ' + item)
        if len(errors) > 35:
            print(f'- {len(errors) - 35} additional findings; inspect manifest entries')
        return 1
    print(f'PASS {args.phase} bookkeeping; independent observation remains required')
    return 0


if __name__ == '__main__':
    sys.exit(main())
