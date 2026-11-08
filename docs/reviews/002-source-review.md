# Independent source review — 8 November 2026

Reviewer: GPT-6 Astra. Reviewed commit: 337d99e. Read-only; no screenshots or device interaction evidence supplied. Source checks and 23 tests passed; public site deployed.

Evidence-backed score: 46/100, comprising task clarity 19/25, navigation/setup 14/20, visual craft 0/20 verified, accessibility 8/15, trust/recovery 5/10, native interaction 0/10 verified. Visual/native points are withheld pending evidence, not assessed as visually poor. The initial 56-point baseline used looser provisional evidence accounting and must not be compared numerically as a measured regression.

Findings requiring correction:
1. High: model discovery can reuse saved credentials after changing endpoint/protocol; built-in provider branding accepts arbitrary HTTPS hosts.
2. High: composer clears before durable acceptance and may persist an empty draft during consent; restoring an older draft can overwrite new typing.
3. High release blocker: globally applied provisioning profile can break dependency target signing. Profile/certificate match and expiry need verification; signed archive/upload remains unproved.
4. Medium: asynchronous discovery results can populate a changed connection; prior results survive editing; truncated/paginated lists need disclosure or handling.
5. Medium: forgetting memory uses a stale run-start snapshot; must compare current content before applying an approved mutation. Tool outcome detection should parse structured output.
6. Medium: default-provider selection and retry controls need 44-point targets; explain API access and consumer subscription distinction.

Fixes are being implemented. No passing score or release approval is claimed. Fresh independent review is required after fixes and actual rendered evidence is available.
