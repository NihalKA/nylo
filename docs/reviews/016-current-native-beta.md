# Current native product evidence and internal beta

8 November 2026. Independent GPT-6 Astra review; app `64709129f17968031bd000b9898162d87f4a6d92`, fixtures through `0e55469`. Read-only source/reference/artifact review, no devices, provider calls, publication or children. **85/100 provisional; internal feedback beta recommended, design and production acceptance held.**

## Findings

1. **High production validation blocker:** owner design acceptance, physical-device validation, VoiceOver and native live generation/recall/recovery remain unconfirmed. This is missing release evidence, not a newly established high-severity product defect. Synthetic recovery proves presentation only; Apple VALID proves processing only.
2. **Medium craft issue:** at maximum text after keyboard dismissal the empty-chat heading is partly above the visible region; the agent context description can begin above that region too. Composer/connection actions remain accessible; no lost draft or blocked flow established. Evidence: artifacts/review-product-final/maximum-text/05-chat-draft.png and 11-agent-chat-context.png. Relevant layout: app/chat/[id].tsx centered empty state and automatic end scrolling. The earlier oversized-empty-state concern is partially resolved.
3. **Low craft issue:** short maximum-text memory facts occupy most of the viewport while actions keep a side column. Consider putting actions below the fact at accessibility sizes. Evidence: maximum-text/09-restored-memory.png; app/agent/[id].tsx memory row.
4. **Low coverage limit:** inspected previews/answers are clean, but curated fixtures do not establish general Markdown quality. Response renderer mainly handles bold and fenced code.

## Verified evidence

- Gallery [42499737557](https://github.com/NihalKA/nylo/actions/runs/42499737557) succeeded at 16:37:33 UTC; artifact `13625063550`. Current PNGs, results, commands, clipboard and provenance inspected. Native seed e23f00e, refreshed JS/flows 0e55469, app identical to 6470912, iOS 26.2. This is **not** a fresh-native gallery.
- Picker selection/dismissal and Manage providers/return completed. Starter insertion and hidden alternatives with a draft completed. Role cancel preserves edited name; confirmation applies replacement.
- Complete latest answer visible in seeded 200-message history, with 100%-visibility assertion. Test memory restored after restart, scoped cleanup returned to preparation, and personal draft remained. Final clipboard exactly equals all 293 expected bytes.
- Fresh-native smoke [42498930753](https://github.com/NihalKA/nylo/actions/runs/42498930753) passed compact, large and maximum text: native/JS/flows 6470912, refresh false. Commands confirm one dismissal tap with retryIfNoChange:false then passing disappearance assertion; subsequent PNG has no keyboard. Draft/memory restoration and agent composition completed. Review 015's maximum-text and gallery-selector blockers are resolved.
- ChatGPT/Grok references support the quieter content canvas, neutral bubbles and focused picker direction. Owner acceptance remains decisive.

| Criterion | Score |
| --- | ---: |
| Task clarity | 23/25 |
| Navigation/setup | 18/20 |
| Visual craft | 16/20 |
| Accessibility | 11/15 |
| Trust/recovery | 9/10 |
| Native interaction | 8/10 |
| Total | **85/100** |

Below 88 total and 12/15 accessibility requirements. No production/design approval.

## Parent safety/distribution verification

Parent checked current results/provenance, exact clipboard equality, long-history and preserved-personal-draft PNGs. Signed run 42497581610 is app6470912; Apple **0.1.0 (10)** VALID, ID `8099fcdf-ad35-4d66-a200-9e270507c3f0`. English TestFlight notes disclose internal-feedback scope, maximum-text issues and physical/live/VoiceOver gaps. Internal Nylo Device QA assignment returned 204 and subsequent group GET confirmed this VALID build. No store submission. No source changes after6470912; later commits change fixtures/docs only.
