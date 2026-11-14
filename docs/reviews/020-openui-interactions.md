# Useful OpenUI interactions: independent implementation review

GPT-6 Astra reviewed source commit `ac64610497566e40459f4899b13ae32a81093374`
against `47a33a0b08aadaae12f0115dec0df3174fa6da7e` on 15 November 2026.
The review was read-only. It reproduced two source issues and withheld readiness
pending their correction and native qualification.

- Numbered declaration names could escape text-channel filtering with particular
  stream boundaries. The filter now retains bounded lookbehind and recognizes
  numbered names, fenced source and prose preambles. Regression tests exercise
  every split and character-by-character delivery, while preserving ordinary
  mathematical prose.
- Collapsing Details discarded invalid numeric drafts but retained their host
  validation error, leaving Submit disabled after reopening. A stable validation
  callback now unregisters a discarded draft with its control. The regression
  test verifies the error while editing, eligibility after collapse, and restored
  valid value after reopening.
- The date fixture expected a fixed date but previously accepted a default based
  on today. Its return calendar now starts at the fixed fixture date and the flow
  explicitly confirms it. It remains independent of the runner's current date.

Astra found no other blocker in restricted arithmetic/amortization, evaluation
bounds, coalesced persistence, version restoration or preserved provider/consent
paths. The fixes were checked locally with 209 passing tests; there was no second
independent review of these small corrections. Native qualification remains a
separate pending requirement. The reported generation-time native termination
remains unattributed; neither review nor these tests establishes its resolution.
