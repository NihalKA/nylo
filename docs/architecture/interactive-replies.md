# Interactive replies with OpenUI

Nylo can combine an explanation with native controls, charts and its existing
sortable table. OpenUI assembles registered components from model-generated data;
the app owns their appearance, persistence and actions.

## What the user does

- Ask for an interactive phone comparison: adjust a budget slider and priority,
  review the existing table/card view, then explicitly update recommendations.
- Ask for a chart and table of supplied expenses: select a category to filter
  the chart and table locally. Sample data must be identified as sample data.
- Ask for guided planning: fill in a short form and submit its labelled values.

Only Submit starts another normal model turn. Sorting, filtering, text entry and
slider changes stay on the device. The conversation includes the readable choices
that were sent. Existing draft text and draft attachments are preserved.

## Implementation

`src/interactive-reply.ts` defines version 1 of the component catalog and stored
reply, validates OpenUI source and sanitizes input values. The catalog includes
Root, Text, Table, Chart (bar/line), Select, Slider, Input and Submit. Root is a
flat vertical section with up to 20 components and one optional Submit button.

`show_interactive` in `src/sdk-engine.ts` is a local tool exposed alongside the
existing capabilities. Its arguments contain bounded OpenUI source and a complete
readable fallback (including displayed facts/data). It uses the current connection
and AI SDK; there is no extra provider, OpenUI service, credential or server.
The section is parsed and saved only after the tool call finishes and its stream
has been verified complete. Text continues through the existing streaming path.
There is at most one interactive section per assistant turn.

The stored assistant message contains `interactive: { version, source, fallback,
values, submitted? }`. Its ordinary `text` also retains the fallback for conversation
context, copying, older clients and failure recovery. Normal Markdown rendering is
retained. `parseData` validates interactive replies for both local storage and backup
imports; legacy messages do not require the new field. Invalid UI is dropped while
the readable message remains.

`src/interactive-content.tsx` uses OpenUI's native Renderer and a host-owned values
context. Table adapts the data to Vivek's existing DataTable. Charts use native View
primitives for bars, points and line segments, so this feature adds no native
module. Select supports local chart categories and table-column equality filters;
the option `All` shows every item. Sliders support touch and accessible increment/
decrement controls; inputs have labels and required-field validation.

Input changes are queued through durable storage before submission. A storage
failure is shown and prevents sending until the values save successfully. Submit
passes through the actual StoreProvider send reservation and existing consent,
connection, cancellation and background handling. `prepareSend` builds the readable
follow-up and marks the choices submitted in prospective history; they become
accepted together with the user turn. Double taps and resubmitting identical
accepted choices are rejected. Changed choices can be submitted again. A failed
model response after acceptance is retried using the normal conversation retry.

Forms stay disabled while the assistant reply is streaming/interrupted, while
the conversation is responding, or while archived. Missing required values disable
Submit. Runtime rendering errors show the stored text fallback.

## Boundaries

The first version accepts complete, static catalog components. It rejects unknown
components, incomplete references, duplicate field names, invalid numeric ranges,
inconsistent tables and unknown filters. OpenUI Query/Mutation, reactive programs,
model-defined actions, navigation and generated JavaScript are not enabled.
Model data cannot create a new network destination or initiate an automatic send.

Free MIT OpenUI packages are pinned at 1.1.1; Zod is pinned at 4.6.7. Retain their
license notices in redistributed software. OpenUI Gateway, Autofix and cloud
observability are not used. Renderer observability publication is disabled;
runtime telemetry is not opted into. CI disables package installation telemetry.
The first local dependency installation used the upstream postinstall default;
it may have sent pseudonymous installation metadata before this behavior was
identified. Upstream describes that payload as package/platform versions and
hashed installation/project identifiers, excluding credentials and app content.
Subsequent dependency installation used the disable flag and skipped install scripts.
For local installation use:

```sh
OPENUI_TELEMETRY_DISABLED=1 npm ci
```

## Verification and remaining work

Verified on 14 November 2026 from task base
`9c346059e8b79d933e407041b64bf0e405db6346`: type checking and all 189 tests passed,
as did formatting, credential checks, 45 original SVG assets, 12 runtime fonts
and 35 regression tests for the historical audit verifier. Expo exported the
application JavaScript for iOS, Android and web, including an initial Hermes
bytecode export and a subsequent final-source JavaScript export. These are bundle
checks, not full native app builds or installation evidence.

Automated tests cover the three catalog examples, invalid/truncated source,
value validation, backup restoration, required fields, native OpenUI rendering
with mocked RN host primitives, local filtering, persistence, explicit submission,
duplicate taps, draft preservation, stopped replies and failed storage acceptance.
SDK tests use synthetic Responses streams at a synthetic configured endpoint;
they exercise the real AI SDK without a paid model request.

The native renderer tests are not physical-device visual evidence. Device testing
was attempted on 14 November 2026; the simulator was held by another agent-device
session (`DEVICE_IN_USE`), including after one wait attempt. That session was left
untouched. Live LB generation quality, full native visual checks (small screen,
large text, light/dark, keyboard), and installation of a new native candidate remain
unverified. Full native builds belong in CI. No release, distribution or merge is
part of this implementation.

Sources:

- https://www.openui.com/integrations/react-native
- https://www.openui.com/docs/openui-lang
- https://github.com/thesysdev/openui/blob/main/LICENSE
