# Owner-requested matching iOS candidate

The owner requested an iOS equivalent of Android15. This authorizes a current
feature-branch internal TestFlight candidate, not full Figma visual acceptance
or an App Store/external-test release.

The only app change after Android15 is enabling the existing CI-generated
Settings identity marker on iOS as well as Android. Layouts, attachments,
privacy/consent/provider/storage behavior remain unchanged.

Both iOS workflows pin checkout to the event SHA, use an isolated npm cache,
clear generated native files and run clean Expo prebuild. Signed builds preserve
the original certificate/profile and existing exported-IPA signing/privacy audits.
Before upload, the new verifier requires the exact Settings marker, two Figma
color strings and original hashes of45 SVGs/12 runtime fonts inside the actual IPA.

Signed and simulator runs receive the same optional UTC candidate timestamp,
so their visible marker is identical despite separate compiler jobs. The simulator
bundle is separately verified. The native gallery asserts the complete visible
marker. Manual feature-branch UI validation checks identical app/native inputs
before using an existing simulator binary; no JavaScript refresh is used for
candidate evidence. These checks do not prove full visual parity or physical-device
behavior. Apple processing, internal group assignment and installation remain
separate facts that must be read back independently.
