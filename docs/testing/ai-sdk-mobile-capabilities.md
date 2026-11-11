# AI SDK mobile capability candidate

Feature branch `feat/ai-sdk-mobile-capabilities` starts from fetched main
`19c3c440acf4cf7f8089929ae5f4048f5aec4198`. No merge is authorized.

The app uses pinned AI SDK Core/provider packages directly on-device. Explicit
provider objects and an allowlisted fetch keep requests on the saved connection;
no Vercel gateway, extra backend, automatic capability probes or automatic
retries are enabled. Existing protocol selection, provider/attachment consent,
memory approval and native background-response policy remain owned by Nylo.

The candidate adds configurable image model/search settings, a bounded image
tool in ordinary and agent chats, approved image edits, persisted image results,
source links and local response text/PDF export. NyloHQ's known integration has
default image/search settings; account access remains unverified until success.
Other endpoints need explicit capability configuration. Generated pixels are not
included in normal follow-up model input.

React Native cannot construct a Blob from typed arrays. The image-edit adapter
therefore implements the SDK's image-model interface using Expo local-file
multipart uploads, cleans up those files, and retains the SDK's generation/tool
loop. It does not install a broad Node or Blob compatibility layer.

## Verification in progress

- Both platform JS/Hermes exports passed the initial SDK import gate.
- Source tests exercise actual SDK Responses, compatible Chat Completions and
  Anthropic Messages, fragmented SSE, memory tool results, image generation,
  denied edits, persistence/blob hydration, truncated-stream failure, cancellation,
  destination isolation and no retry on quota errors.
- `Live device check` includes an explicit offline diagnostic exercising the real
  SDK's streaming, generation and multipart-edit tool loop with synthetic data.
  It sends no network request and reads no real credentials or conversations.
- `sdk` scenarios extend the existing iOS/Android CI test runners. Runtime,
  source/binary identity, native output exports, signing, upload, Apple processing,
  internal tester availability and actual installation must be reported separately.

A passing source test or API check does not establish native behavior. CI and
release receipts will be recorded after the exact candidate is built and tested.

Computer integration verification: one synthetic user request ran through the actual
SDK and configured NyloHQ connection, producing one visually inspected image.
The only requests were Responses -> image generation -> Responses. This used
the existing member credential without exposing it; it does not establish native
device success. Source verification currently has 103 passing tests.
