# OpenUI: useful interactions and reliable replies

Status: owner approved implementation, review, merge and rollout to existing TestFlight/Play closed-testing groups. Implementation and verification in progress.
Prepared 15 November 2026 after source/screenshot analysis and an independent
GPT-6 Astra review. App-source baseline: `c32c846`; subsequent main `47a33a0`
changes only native smoke fixtures. This document incorporates the owner's later
requirement for real date picking.

## Outcome

A normal request such as “help me calculate a loan” should produce a useful
calculator without requiring the person to name OpenUI, sliders, or components.
A travel planner should offer calendar controls for dates. The assistant chooses
from reusable building blocks; Nylo supplies dependable native controls and math.
There will be no keyword router that substitutes a hardcoded loan or travel screen.

## What we established

- The owner reports an app termination while the loan answer was arriving,
  before touching a control. The supplied screenshots include TestFlight's
  feedback sheet, an interactive-calculator fallback, unreadable citation
  markers, and a subsequently interrupted/partial answer.
- The current catalog provides Text, Table, Chart, Select, Slider, Input, Submit
  and a flat Root. It has no date picker, date range, typed numeric editor,
  formatted result/metric, or calculation output component.
- `src/interactive-reply.ts` disables binding/function instructions and rejects
  state declarations, dynamic props and root expressions. A slider saves its own
  value. Table/chart data can be filtered through a Select, but cannot be
  recalculated from the slider. A working local calculator is impossible with
  the current contract, regardless of prompt quality.
- `src/sdk-engine.ts` gives generic interaction suggestions in a tool description.
  It does not adequately describe when an interactive answer is helpful, which
  inputs matter, or when the assistant should simply answer in Markdown.
- An invalid executed UI attempt consumes the sole allowance. Validation errors
  become generic fallback advice. Complex source plus a duplicated fallback can
  also compete with the response token budget; truncation is a hypothesis here.
- `InteractiveContent` does initial parsing before its descendant error boundary.
  Events also validate outside that boundary. Dragging reparses and queues durable
  work for each update. These are confirmed containment/performance gaps, not a
  proven explanation of the reported native crash.
- Citation-token normalization is missing from the inspected formatting path.
  A partial Markdown table can remain partial after interruption; the screenshot
  alone does not establish an OpenUI table-validation failure.
- The prior successful native tests exercised prepared component examples and
  ordinary app workflows. They did not establish model-generated calculator
  usefulness or reproduce this real loan journey.

The only crash submission currently available from Apple predates this OpenUI
journey and belongs to build 42. It is not evidence of this incident's cause.
The owner dismissed the new TestFlight report. No further screenshots or exact
prompt are prerequisites for planning; use representative equivalent requests
and the supplied evidence for reproduction. Do not claim a native-crash fix
without a matching reproduction or diagnostic record and verification.

## Interaction rules

1. Use controls when adjusting a few inputs changes an answer, or filters actual
   supplied data. A chart is supporting evidence, not a substitute for controls.
2. Use Markdown for direct explanations and simple tables. Do not force every
   answer into a form or require the person to explicitly ask for a component.
3. Reuse known conversation facts. Ask one short question when missing information
   materially changes the task; otherwise display clearly labelled, editable
   assumptions. Do not silently assume a country, currency or lender rate.
4. Start with essential inputs, usually three to five. Place optional preferences
   under a secondary section instead of a long questionnaire.
5. Match the control to the data: calendar for dates, numeric entry for exact
   amounts, slider for exploring a numeric range, selector for a small choice,
   text field for genuine free text.
6. Show the main result beside/near its controls. Currency, units, ranges, steps
   and assumptions must be understandable. Keep supporting charts optional.
7. Local changes recalculate immediately without a model request. An explicit
   button is needed only for a new AI action, such as building a travel itinerary
   or explaining a selected scenario. No automatic submission from a control.

## Proposed work, in order

### 1. Establish the failure path and contain bad replies

- Reproduce generation-time failures with representative loan requests and
  sanitized malformed/truncated model outputs, including web-search citations.
  Record the tested source/build and distinguish JavaScript errors, native
  termination, storage failure, cancellation and incomplete generation.
- Guard parsing, validated-model preparation, rendering and event handling at
  their actual boundaries. A React rendering boundary alone cannot contain a
  native process abort.
- Enforce source, nesting, node/data count and evaluation-work limits before
  expensive work. Reject nonfinite numeric/style values and invalid shapes.
- Cache validated programs. Update visible control state immediately, but
  coalesce persistence work so a drag cannot create an unbounded queue. Flush
  the latest accepted state on gesture completion, backgrounding and submission;
  surface save errors and preserve existing durability guarantees.
- Keep diagnostics local and bounded: error codes, component categories, counts,
  durations and build identity. Preserve existing reporting consent; no telemetry
  or recording of keys, prompts, selected financial values or private crash logs.

### 2. Expand the reusable native component library

| Building block | Expected behavior |
| --- | --- |
| Numeric control | Slider and exact numeric entry share one value; optional currency/unit, decimal precision, bounds and step. |
| Date / date range | Reuse an Expo-compatible maintained native date picker; tap to select start/end dates, cancel/clear, validate order. No hand-built calendar. |
| Flexible dates | Explicit “exact dates / month / undecided” choice where appropriate; do not force an invented date into the calendar. |
| Result / metric | Clearly formatted calculated value, unit/currency and short explanation; errors shown as errors, never a misleading zero. |
| Section / optional details | Short heading/help and compact essential fields; optional fields can expand. Reuse existing Markdown for explanatory content. |
| Existing table and chart | Continue using Vivek's table; accept validated derived data as well as supplied static data. A chart must answer a useful question. |

Verify Expo/RN compatibility and the date picker's license before selecting the
dependency. New native inputs require CI builds on both platforms, not a full
local build on the 8GB Mac. Store date-only values without timezone drift;
restoring dates must not change the selected day.

### 3. Connect controls to safe local calculations

Prefer reusing OpenUI's existing reactive state/function runtime. Its installed
API already offers reactive values, state restoration and registered functions.
First prove that a restricted subset can enforce allowed operators/functions,
types, dependency limits, cycle rejection and evaluation budgets. Do not simply
enable every binding, built-in function, Query, Mutation or action.

The model describes relationships between registered controls and outputs.
Application-owned, tested arithmetic/aggregation/formatting functions compute
the values. A reusable financial payment function is acceptable; an `if prompt
contains loan` screen is not. Prohibit generated JavaScript, `eval`, arbitrary
property access, network actions and unbounded loops.

If the upstream runtime cannot enforce those restrictions, use a small typed
expression tree evaluated by application-owned code. Record that finding and
tradeoff before selecting the fallback architecture; do not introduce a second
general-purpose programming language.

Use one canonical input state. Recalculate metrics and optional table/chart data
from it, including after reopening the chat. Version the new payload and keep
existing version-1 replies readable and functional.

### 4. Teach the assistant to assemble useful answers

- Put the interaction-selection rules in system guidance as well as concise
  component descriptions. Supply a small set of varied, validated examples.
  These guide judgment rather than route prompts to fixed screens.
- Clearly describe supported capabilities. Do not call a static comparison an
  interactive calculator, or claim a rendered tool before it succeeds.
- Prefer a compact complete specification over verbose source, enormous charts
  and duplicated explanation. Preserve a readable fallback/history representation
  without rendering the same explanation twice.
- Return structured, safe validation reasons. Retain at most one successful
  section per reply. Proposed approval scope includes at most one model correction
  round trip for invalid UI, within a fixed total request/token/time budget, then
  text fallback. This improves recovery but can add latency; no automatic repair
  requests are authorized or performed during this planning task.
- Preserve the selected provider, protocol, key and model. No OpenUI cloud,
  paid gateway, provider switch, background retries or remote generated actions.

### 5. Make interrupted answers readable

- Hide/normalize recognized provider control/citation markers across stream chunk
  boundaries. Link only to real source metadata. If citation mapping is missing,
  keep the verified Sources panel rather than inventing a citation number.
- Distinguish a partial Markdown row from a complete comparison. Never fabricate
  missing values; label interrupted output and retain the useful committed text.
- Keep a fully validated local calculator usable if later explanatory prose is
  interrupted. Never activate incomplete UI. Preserve explicit-send reservation,
  cancellation, required-field and duplicate-submission restrictions.
- A failed section falls back inside the chat without silently discarding saved
  choices or replacing the person's draft/attachments.

### 6. Verify usefulness and stability before distribution

Use independent arithmetic checks, malformed-program fixtures and captured
sanitized model outputs first. Proposed approval scope includes a small live
existing-LB evaluation, capped at **12 model requests total**, counting tool
follow-ups and repairs, using synthetic data only. Stop and report untested
cases at that cap; do not silently extend it. This planning task makes none of
those app-provider requests.

| Journey | Acceptance evidence |
| --- | --- |
| Loan calculator | A normal request yields principal, annual rate and term controls, explicit currency/assumptions, immediate payment/total/interest. Sliders and exact entry agree. No model call on adjustment. A supporting chart is optional. |
| Loan arithmetic | Independent amortization oracle; zero interest uses principal/payment-count; test tiny rates, zero principal, invalid/nonpositive term, extremes, overflow, precision and rounding. |
| Travel planner | Calendar start/end selection instead of typing dates; flexible/undecided mode; date-order/cancel/restore/timezone cases; a short essential form or useful plan without needing “show a planner.” Explicit button generates the itinerary. |
| Expenses/budget | Correct totals and remaining amount from supplied data; local filtering/editing changes results; no fabricated transactions. |
| Phone comparison | Budget and preference affect eligible supplied results, with transparent criteria; unknown specifications remain unknown. Research/new recommendations require explicit follow-up. |
| Simple/ambiguous request | Direct Markdown for simple answers; one useful clarification or labelled assumptions for ambiguity, not a sprawling form. |
| Invalid/interrupted output | Reject unsupported actions, deep/cyclic/large expressions, nonfinite values and incomplete UI; bounded correction/fallback, no raw citation garbage, no fabricated table cells. |
| Reopening/storage | Preserve last committed input/date values, recompute outputs, retain old replies, handle failed persistence, no duplicate sends. |
| Actual iOS and Android | Real slider dragging, exact numeric entry, native calendar selection, keyboard/scroll interaction, screen readers, narrow screen/large text, background/reopen and repeated updates; bounded memory/save queue. |
| Reported crash | Reproduce or obtain a matching diagnostic; identify cause and verify its fix on the affected build/runtime before claiming this incident resolved. |

Record source/binary identity and actual screenshots. Prepared fixture screenshots
are not enough to establish that the model chooses useful components. Successful
export/unit tests are not evidence that a native process cannot crash.

## Approval and delivery

Approval is requested for the work above, including its bounded repair and live
evaluation request caps. Implementation begins after approval. Work should be
reviewable in stages: containment/reproduction, reusable controls/calculation,
generation/formatting, then actual-device/simulator evidence. No merge or new
distribution is implied by approving this planning document.

No application files were changed, no new app-provider requests were made, and
no new builds or releases were started during this analysis. Raw Apple feedback,
private release records and the owner's screenshots remain outside this document.

## Implementation checkpoint — 15 November

Implemented version-2 numeric controls/results, restricted OpenUI arithmetic,
calendar inputs, grouping, derived table/chart values, numeric budget/ranking,
coalesced persistence, outer parsing containment, bounded invalid-UI correction,
provider citation normalization and raw-UI text-channel protection. Version-1
replies remain supported. No provider/protocol/key/model/memory/consent switches.

Local verification: 209 tests pass and iOS/Android/web production bundles export.
Independent payment-balance tests cover zero/tiny/ordinary/high rates, and malformed
expressions, calendar order/cycles, storage failures, stream splits and repeated
updates are covered. These tests do not establish native-crash resolution.

Existing-LB evaluation used 9 of the approved 12 requests, all synthetic data.
The initial travel response omitted calendars and one simple answer leaked DSL;
guidance and stream protection were corrected. Refined travel included two native
calendar fields and a flexible-date choice; simple arithmetic returned Markdown;
an ambiguous calculator request returned one ordinary question. Captured outputs
for all six representative journeys are under `e2e/fixtures/interactive-model-output.json`.
Native iPhone/Android UI verification, independent implementation review, merge,
signed builds and tester availability are pending. Native CI fixtures now include
exact-entry recalculation, reopening and real calendar presentation/selection.
