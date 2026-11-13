# Chat swipe stability fix

The owner reported that a left swipe immediately snapped the chat card closed,
preventing Archive/Delete from being tapped in the delivered chat-management UI.

## Cause and correction

`ChatRow` created a new `PanResponder` on every render, including the render
caused by showing the actions during responder grant. That replaced the object
that owns the current touch history while the gesture was still active. The
release decision could also close a fully revealed card if the finger had a
small rightward recoil at release, and the row had no guard against a trailing
press from that gesture closing it again.

The row now retains one responder for its lifetime and reads current layout and
animation settings through a ref. Distance takes precedence over release recoil;
a short intentional left flick can still reveal the actions. Horizontal gestures
remain owned until release, interrupted drags settle to the nearest endpoint,
and only a fresh row touch may close the revealed controls or open the chat.
Vertical movement is not captured. Existing card styles and storage behavior are
unchanged. No additional dependency or native configuration is needed.

## Regression evidence

Six tests render the real `ChatRow` with React and replace only native primitives,
gesture delivery and store I/O. They exercise responder identity across grant and
parent renders, release recoil and trailing presses, vertical movement and short
drags, archive/delete button taps and confirmation cancellation, current layout
after font/width changes, interruption, intentional right-close and ordinary chat
opening. The original code failed the responder-identity and release-recoil tests;
all six pass with the fix. The full 162-test suite, TypeScript, repository
formatting, credential and original asset/font checks pass.

On 13 November 2026, source from `fix/chat-swipe-stays-open` was loaded through
Metro port 8092 in existing Expo Go on the iPhone 17 Pro simulator, iOS 26.4,
402 × 874 logical points. No provider was configured or contacted. A synthetic
`Swipe regression draft` exercised:

- a 220-point left pan over 700 ms, remaining open for the subsequent Archive tap;
- archive navigation, another slow left pan and the Restore button;
- a 55-point left flick over 120 ms, remaining open for the Delete button;
- delete confirmation cancellation, retaining the conversation and both actions;
- an intentional 180-point right pan over 700 ms, returning to the closed card.

Original local screenshots are retained in ignored `artifacts/swipe-fix/`.
An ordinary one-way simulator pan also stayed open before the fix; the simulator
did not reproduce every aspect of the owner's physical gesture. The failing
regression tests cover the specific lifecycle and recoil faults directly.
Physical-device gesture testing and Android runtime UI remain unverified.
Replacement distributable builds must include this fix before claiming it is
available in TestFlight or the Android APK; prior iOS 39 / Android 38 do not.
