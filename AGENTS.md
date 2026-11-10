# Nylo: complete adoption of supplied Figma designs

## Whenever the owner provides a Figma link

The current link and the owner's requested scope are authoritative. Apply this
process to every supplied Figma file; never hardcode a previous file key, node
list, screen count, audit score or review receipt as a prerequisite for unrelated
work. A new link requires fresh inspection, not reuse of an old file's approval.

1. Inspect the entire linked file: every page, frame, descendant, duplicate,
   component/variant, hidden layer, variable/style, asset/font, state and prototype
   interaction. Record the URL, file/node IDs and reference version or capture
   time. A node-specific link is an entry point, not permission to ignore the rest
   of the file, unless the owner explicitly narrows scope.
2. Keep a coverage record for that reference under `docs/design/`. Map every
   design requirement to its implementation and verification evidence, or an
   explicit reasoned exception. Review duplicates individually before declaring
   them equivalent. Identify screens absent from Figma as design-system extensions.
   Preserve earlier references and findings separately; do not overwrite history
   or carry their unfinished checklists into a new task as a global merge block.
3. Adopt all in-scope layouts, typography, colors, original assets/fonts,
   components, variants, content and interaction states. Inspect visual references
   as well as metadata. Do not substitute approximations or omit difficult parts
   silently. Record gaps and resolve them before claiming complete adoption.
4. Verify the actual running app against the reference at equal logical viewport
   widths on the requested platforms. Check spacing, wrapping, painted bounds,
   fixed controls, effects, safe areas, keyboard and accessibility sizes, and
   empty/populated/selected/error states. Preserve original captures and identify
   their source/build. Functional tests and asset hashes do not prove visual parity.
5. If reference access or behavior is unclear, record the specific unknown and
   seek clarification while continuing independent work. Never infer destructive
   actions, privacy changes or consent from appearance alone. Report unverified
   scope honestly; the owner's explicit acceptance or exceptions apply to the
   stated task, not to future Figma links.

## Scope of historical audits and release checks

`docs/testing/figma-full-file-audit.md`, its coverage manifest and ADR0001 retain
findings for the earlier Figma reference. Its fixed inventory, GPT-6 Astra 10/10
receipt and pre-change authorization gate are historical requirements, superseded
by this owner-requested link-specific policy. They are not universal requirements
for every UI edit, PR or release. The legacy verifier remains available to inspect
that historical evidence; it must not be presented as a generic new-file audit.

Keep normal source, security, asset/font and functional checks. Use existing native
builds for test-only changes; do not recompile unchanged native inputs. For builds
being distributed, verify source/binary identity and report build, upload, Apple
processing, tester availability and installation as separate facts. Do not call a
candidate a complete Figma implementation while known scope remains unresolved.

## Workspace and behavior boundaries

Preserve user dashboard scripts in `package.json`, `dashboard/`, and `output/`;
never stage unrelated files. Preserve provider/protocol/key/model/memory/consent,
report opt-in, PDF/storage and background behavior. No extra provider requests,
credential disclosure, signing-key replacement, unrelated Apple roles/testers or
Store15/external17 mutations. Use CI for full native builds, not this 8GB Mac.
Never publish private HANDOFF, Apple receipts, SQL/logs, credentials or Figma auth.
Consult the private handoff when continuing release work. Keep the single owning
continuation and separate four-hour monitor; never create redundant schedulers.
