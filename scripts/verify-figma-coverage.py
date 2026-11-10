#!/usr/bin/env python3
"""Fail-closed evidence bookkeeping; never awards a visual score or authors a review."""
import argparse
import hashlib
import json
import gzip
from pathlib import Path
import sys
import subprocess
import tempfile
import io
import tarfile

sys.path.insert(0, str(Path(__file__).resolve().parent))
from figma_evidence import (HEX40, canonical, git, package_runtime, product_file, tree_fingerprint)
from figma_release import release_digest, verify_release
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = 'docs/design/figma-coverage.json'
DOMAINS = {'pages', 'hidden-layers', 'components-variants-libraries',
           'variables-styles', 'fonts', 'assets', 'prototypes-transitions',
           'states', 'app-extensions'}
CHECKS = {'geometry', 'typography', 'artwork', 'colours-effects', 'content',
          'states-actions', 'responsive-accessibility'}
STATE_FLOOR = {'reference', 'empty', 'populated', 'selected', 'error', 'keyboard'}
AUDIT_INPUTS = ['AGENTS.md', 'docs/adr/0001-figma-coverage-before-implementation.md',
                'docs/testing/figma-full-file-audit.md', 'scripts/verify-figma-coverage.py',
                'scripts/figma_evidence.py', 'scripts/figma_release.py',
                'tools/design/extract-context.ts']


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
    return tree_fingerprint(root)


def audit_digest(root, manifest):
    # Freeze design scope/plans, not later resolution/native evidence. Otherwise
    # implementing an approved plan would invalidate its pre-implementation review.
    inputs = [(name, sha(safe_path(root, name).read_bytes())) for name in AUDIT_INPUTS]
    inventory = {k: v for k, v in manifest.items()
                 if k not in {'comparisons', 'functionalProofs', 'binaries', 'evidence', 'gaps'}}
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


def verify_changes(root, base_ref):
    """Check authorization on the PRE-change checkout, not implemented source."""
    if not base_ref:
        base_ref = git(root, 'rev-parse', 'HEAD^').decode().strip()
    if not HEX40.fullmatch(base_ref) or base_ref == '0' * 40:
        raise ValueError('changes requires an existing full base commit SHA')
    changed = set(git(root, 'diff', '--name-only', '--no-renames', base_ref).decode().splitlines())
    changed.update(git(root, 'ls-files', '--others', '--exclude-standard').decode().splitlines())
    runtime = {name for name in changed if product_file(name)}
    if 'package.json' in changed:
        old = json.loads(git(root, 'show', base_ref + ':package.json'))
        new = json.loads((root / 'package.json').read_text())
        if package_runtime(old) != package_runtime(new):
            runtime.add('package.json')
    if not runtime:
        return [], 'audit/docs/test-only change; no product authorization inferred'
    with tempfile.TemporaryDirectory() as directory:
        baseline = Path(directory)
        archive = git(root, 'archive', '--format=tar', base_ref)
        with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
            tar.extractall(baseline, filter='data')
        try:
            errors, digest = verify(baseline, 'implementation')
            current = json.loads(safe_path(root, MANIFEST).read_text())
            if audit_digest(root, current) != digest:
                errors.append('inventory/policy changed alongside product: obtain review before coding')
        except (OSError, ValueError, KeyError, TypeError) as exc:
            return [f'product frozen: baseline authorization unavailable ({type(exc).__name__})'], None
        return errors, digest


def verify(root, phase, manifest_path=MANIFEST):
    errors = []

    def need(condition, message):
        if not condition:
            errors.append(message)

    m = json.loads(safe_path(root, manifest_path).read_text())
    need(m.get('schemaVersion') == 2, 'unsupported manifest schema')
    snapshot = safe_path(root, m['snapshot']['path']).read_bytes()
    need(sha(snapshot) == m['snapshot']['sha256'], 'stale metadata snapshot digest')
    page = ET.fromstring(snapshot)
    elements = [e for e in page.iter() if 'id' in e.attrib]
    need(len(elements) == len({e.attrib['id'] for e in elements}), 'duplicate source XML node IDs')
    source = {e.attrib['id']: e for e in elements}
    frames = {e.attrib['id'] for e in page if e.tag == 'frame'}
    need(len(source) == 1322 and len(frames) == 14, 'scope changed: re-inventory whole file')
    discovered_bytes = safe_path(root, m['discovery']['path']).read_bytes()
    need(sha(discovered_bytes) == m['discovery']['sha256'], 'stale discovered-scope digest')
    discovered = json.loads(discovered_bytes)
    extra_ids = [item['id'] for item in discovered['extraNodes']]
    need(len(extra_ids) == len(set(extra_ids)) and not set(extra_ids).intersection(source),
         'duplicate discovered node IDs')
    for item in discovered['extraNodes']:
        need(isinstance(item.get('isScreen'), bool) and 'parent' in item and bool(item.get('page')),
             f"discovered node {item['id']}: classify page/parent/screen scope")
        source[item['id']] = ET.Element(item['type'], item)
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
    if m.get('liveSource'):
        live_record = m['liveSource']
        entry = evidence.get(live_record.get('factsEvidence'), {})
        need(entry.get('kind') == 'figma-sanitized-file-gzip', 'missing typed live-file facts')
        if entry.get('kind') == 'figma-sanitized-file-gzip':
            live = json.loads(gzip.decompress(safe_path(root, entry['path']).read_bytes()))
            need(set(live['nodes']) == set(source), 'live-file nodes not fully reconciled with inventory')
            need(live['source']['figSHA256'] == live_record.get('figSHA256'), 'live-file identity mismatch')

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
    need(set(discovered['domains']) == DOMAINS, 'discovered domain inventory incomplete')
    for domain, entry in m['domains'].items():
        need(entry.get('status') in {'observed', 'not-present'} and bool(entry.get('rationale')),
             f'domain {domain}: unknown/unexplained')
        refs(entry, f'domain {domain}')
        observed = discovered['domains'].get(domain, {})
        need(observed.get('enumerationComplete') is True, f'domain {domain}: enumeration incomplete')
        item_ids = [item['id'] for item in observed.get('items', [])]
        need(len(item_ids) == len(set(item_ids)) and set(entry.get('items', {})) == set(item_ids),
             f'domain {domain}: discovered items not reconciled')
        need((entry.get('status') == 'observed' and bool(item_ids)) or
             (entry.get('status') == 'not-present' and not item_ids),
             f'domain {domain}: presence disagrees with discovered inventory')
        for item_id, disposition in entry.get('items', {}).items():
            need(disposition.get('status') in {'mapped', 'exception'} and
                 bool(disposition.get('target')) and bool(disposition.get('rationale')),
                 f'domain {domain}/{item_id}: missing disposition')
            refs(disposition, f'domain {domain}/{item_id}')
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
    required_extensions = {'chats-inbox', 'agents-landing', 'provider-editor', 'live-check',
                           'font-licenses', 'app-shell'}
    extension_ids = [entry.get('id') for entry in m.get('extensions', [])]
    need(required_extensions.issubset(discovered['extensionIds']) and
         len(extension_ids) == len(set(extension_ids)) and
         set(extension_ids) == set(discovered['extensionIds']), 'missing discovered/known extension scopes')
    for entry in m.get('extensions', []):
        need(all(entry.get(k) for k in ['scope', 'rules', 'states', 'rationale']),
             'extension missing rules/states/rationale')
        refs(entry, 'extension')

    scopes = discovered['scopes']
    discovered_screens = {item['id'] for item in discovered['extraNodes'] if item.get('isScreen') is True}
    need(frames.union(discovered['extensionIds'], discovered_screens).issubset(scopes),
         'missing discovered screen scopes')
    required_obligations = set()
    for scope, definition in scopes.items():
        states = definition.get('states', [])
        need(definition.get('enumerationComplete') is True and bool(states) and
             len(states) == len(set(states)), f'scope {scope}: states not exhaustively reviewed')
        need(STATE_FLOOR.issubset(states), f'scope {scope}: conservative states removed without exceptions')
        for platform in ['ios', 'android']:
            for state in states:
                required_obligations.add(f'{platform}|{scope}|{state}')
    obligations = m.get('releaseObligations', [])
    keys = [o['id'] for o in obligations]
    need(len(keys) == len(set(keys)) and set(keys) == required_obligations,
         'release obligations omit discovered screens/states/extensions')
    for entry in obligations:
        need(entry.get('id') == f"{entry.get('platform')}|{entry.get('scope')}|{entry.get('state')}",
             'obligation key does not match scope/state/platform')
        need(entry.get('mode') in {'capture', 'exception'} and bool(entry.get('rationale')),
             'obligation missing capture plan or narrow exception')
        refs(entry, 'obligation ' + entry['id'])

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
            need(receipt.get('releaseDigest') == release_digest(m, digest, expected_fingerprint),
                 f'{kind}: stale release evidence/proofs/resolutions review')

    if phase in {'implementation', 'release'}:
        review('inventory')
    if phase == 'implementation':
        need(m.get('baseProductFingerprint') == product_fingerprint(root),
             'product changed since inventory baseline; review actual changes before new implementation')
    if phase == 'release':
        fingerprint = product_fingerprint(root)
        verify_release(root, m, fingerprint, need, refs, safe_path)
        review('rendered', fingerprint)
    return errors, digest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('phase', choices=['inventory', 'implementation', 'release', 'changes'])
    parser.add_argument('--base-ref', help='full PRE-change Git commit SHA (CI push/PR base)')
    args = parser.parse_args()
    try:
        errors, digest = (verify_changes(ROOT, args.base_ref) if args.phase == 'changes'
                          else verify(ROOT, args.phase))
    except (OSError, ValueError, KeyError, TypeError, ET.ParseError, subprocess.CalledProcessError) as exc:
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
