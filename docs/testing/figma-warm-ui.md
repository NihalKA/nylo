# Figma Warm Edition implementation

Owner/Vivek requested the shared iOS and Android interface follow [this Figma file](https://www.figma.com/design/WNCRguvh0wqYTgBUlbXZ9G/Untitled). Inspected the signed-in file on 10 November 2026 using its rendered frames and Properties panel; the optional Figma MCP is not connected. No design layers were edited.

Inspected nodes: Settings `2:494`, Memory `2:617`, Create agent `2:727`, Report `2:814`, Attached files `2:896`, Attachment menu `2:986`, Shared context `2:1050`, PDF picker `2:1139`, model picker `2:1234`. The file also contains duplicate earlier frames. Ignored reference captures and provenance are under `artifacts/figma-warm-reference`; they are not bundled assets.

## Applied direction

- Warm `#F9F9F8` canvas, white cards, `#1E2B58` navy reading/action colour, `#F3F4F3` input surfaces and `#E8E8E7` borders. Primary colour and surfaces were reconciled against solid pixels in the captured report frame; canvas/white/border are also visible in Properties. Secondary/error colours retain readable contrast rather than copying muted screenshot pixels.
- Grouped Settings cards with circular icon surfaces and quiet section labels; a selected-tab capsule; soft, restrained elevation and rounded corners.
- Distinct saved-memory and conversation cards, clearer selected role chips, a white memory editor, and a framed shared-context preview. Existing tap targets and large-text action stacking remain.
- Navy composer/action treatment, rounded bottom sheets and explicit selected model rows. All connection/model identities, PDF guards, protocol editing, draft preservation and accessible labels remain intact.
- Grouped report excerpt control and preview. Excerpts remain **off by default**. The Figma example's enabled switch does not authorize sharing. A Responses protocol is not labeled as verified PDF model support. Template/save behavior and memory approval are unchanged.
- Screens absent from the supplied file, such as inbox and provider setup, inherit the same shared tokens and components. These are adaptations, not a pixel-exact claim for missing frames.

## Android navigation requirement

The owner specifically requires the UI to clear Android's three-button system navigation. Root SafeAreaProvider remains; ordinary pages include bottom safe-area padding, while tab pages delegate bottom inset handling to React Navigation's tab bar. Bottom sheets keep `max(insets.bottom, design padding)` rather than a fixed bottom offset. No hardcoded device navigation-bar height is introduced.

The Android emulator workflow now executes the same signed APK independently in real `gestural` and `threebutton` OS overlay modes, verifies the applied `navigation_mode`, retains native XML/window evidence, and checks the final composer, attachment and model controls against SystemUI navigation bounds. Keyboard-open, keyboard-dismissed, attachment-menu, Settings and tab captures still execute in both flows. New execution is required before claiming overlap prevention is verified; prior Android code5 results cover only the earlier single-mode flow.

## Verification and delivery

Local typecheck and 82 behavioral tests pass; primary/canvas contrast is 12.93:1, secondary/canvas 5.06:1, secondary/input 4.83:1, error/error surface 5.53:1, and white/navy 13.62:1. These solid-colour checks do not establish full rendered accessibility.

Native rendering, all three iPhone text/display profiles, populated gallery/PDF regression, and both Android navigation modes must be inspected on current source. Actual evidence and any fixes will be appended here. No fresh signed beta, new numerical score, physical camera, VoiceOver/TalkBack, live-provider, or store approval is implied by source checks. No live-provider requests are authorized for this work.

Store version1.0.0's submitted build15 and the separate Anand/build17 review queue must remain unchanged. Upload updated design deliverables to the owner's default public [Drive folder](https://drive.google.com/drive/folders/1DPGp_dliobe2lpH5bNx2QckQZyC40kmE), with exact capture provenance. Do not present historical screenshots as the redesigned native app.

## First native evidence and test corrections

Native iPhone42682173117 and Android signed build6/run42682173057 compile successfully. Android42684046552 completes both actual OS navigation-mode flows (gesture and three-button), with JUnit success and inspected 14 captures per mode. The overall run remains FAILURE: UIAutomator returned only the app window, so the added geometry checker could not find SystemUI nodes. Both retained XML trees have only the app package. The runner now also captures WindowManager's visible navigationBars InsetsSource; geometry checks still require real OS bounds and all three final controls clear of that area. This is a test-evidence collector correction, not a reproduced overlap fix. A new run on the same immutable APK is required.

Refreshed PDF42682202754 passes, including all eight inspected captures. Gallery42682195748 fails before opening the attachment chat: the actual selected row's AX bounds are y851–933, overlapping the tab strip y877–922. The tap at its center hit Agents; the failure PNG shows Agents, not a missing file in chat. The fixture now requires that exact row to be above the tab strip before the same tap, both initially and after restart. File/draft/clipboard/storage assertions are unchanged. The original failed run is preserved. These corrections do not require recompiling unchanged app source23cd656.
