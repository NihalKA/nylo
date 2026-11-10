# Independent Astra review: Figma safeguards

Date: 2026-11-10. Model: GPT-6 Astra. Reviewed commit:
`4523ded2fea07d02c216a24e96e45938504bb89b`. Scope: repository process/verifier
safeguards only. **Not full-file audit approval; no completeness score awarded.**

The reviewer found that the initial safeguards blocked the current incomplete
manifest, but did not adequately enforce their stated release contracts.

| Priority | Finding                                                                                               | Required correction                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| P1       | Rendered approval survived replacement of evidence, photo proofs or gap resolution                    | Separate release digest binding actual evidence hashes/provenance, binary identity, functional proofs and resolutions |
| P1       | Metadata XML could stand in for PNGs; declared geometry and invented source/hash values were accepted | Typed evidence, decoded original PNG dimensions/CRC, numeric geometry and actual binary/source/session binding        |
| P1       | Coverage was nine frame IDs, omitting states and extensions                                           | Reviewed platform/screen/state obligation matrix and explicit functional assertions/configuration                     |
| P1       | Product fingerprint omitted native build inputs                                                       | Hash native scripts/workflows/configuration/locks/lifecycle inputs; separate test fixtures                            |
| P2       | Exhaustive scope meant only saved XML; known extension scopes could be removed                        | Separate item-level discovered inventories, mandatory known extensions, duplicate-ID rejection                        |
| P2       | CI ran tests but did not enforce the implementation freeze                                            | Validate product changes against the approved pre-change inventory checkout; allow audit-only work                    |
| P2       | Historical sections still said Current/accepted/building                                              | Explicitly withdraw visual sign-off and reconcile signed20 workflow success with distribution hold                    |

All15 original tests passed. Negative reproductions demonstrated the above gaps;
they did not establish any real design acceptance. The actual release gate had
2,890 blocking findings. The reviewer made no checkout changes and did not approve
the unfinished1,322-node audit.

Follow-up implementation adds regression tests for those cases, a schema2 discovered
scope inventory, separate release digest and capture/binary/configuration identities,
and a source-CI pre-change authorization check. A fresh independent re-review is
still required; this paragraph is an implementation response, not reviewer approval.

Receipt fields and hashes provide bookkeeping, not authenticated authorship or
proof of visual observation. The independent reviewer must inspect actual retained
evidence. Product edits and signed20 corrected distribution remain held.
