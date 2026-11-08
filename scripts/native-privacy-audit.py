"""Inspect a compiled Nylo .app, IPA or simulator ZIP without exposing signing material."""
import argparse
import hashlib
import json
import plistlib
from pathlib import Path
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument("bundle")
parser.add_argument("--output", required=True)
args = parser.parse_args()
source = Path(args.bundle)
archive = None
if source.is_dir():
    read = lambda name: (source / name).read_bytes()
    names = [str(path.relative_to(source)) for path in source.rglob("*") if path.is_file()]
else:
    archive = zipfile.ZipFile(source)
    roots = [name[:-len("Info.plist")] for name in archive.namelist() if name.endswith(".app/Info.plist") and not name.startswith("__MACOSX/")]
    if len(roots) != 1:
        raise SystemExit("Expected exactly one application in the compiled archive.")
    root = roots[0]
    names = [name[len(root):] for name in archive.namelist() if name.startswith(root) and not name.endswith("/")]
    read = lambda name: archive.read(root + name)

info = plistlib.loads(read("Info.plist"))
if info.get("CFBundleIdentifier") != "com.nylohq.nylo":
    raise SystemExit("The compiled bundle is not Nylo.")
if not isinstance(info.get("NSCameraUsageDescription"), str) or not info["NSCameraUsageDescription"].strip():
    raise SystemExit("The compiled still-camera feature is missing its purpose string.")
if info.get("NSMicrophoneUsageDescription"):
    raise SystemExit("Unexpected microphone permission in a still-image-only release.")

manifests = []
for name in sorted(names):
    if not name.endswith("PrivacyInfo.xcprivacy"):
        continue
    value = plistlib.loads(read(name))
    manifests.append({
        "path": name,
        "tracking": value.get("NSPrivacyTracking"),
        "trackingDomains": value.get("NSPrivacyTrackingDomains", []),
        "collectedDataTypes": value.get("NSPrivacyCollectedDataTypes", []),
        "accessedAPITypes": value.get("NSPrivacyAccessedAPITypes", []),
    })
if not manifests:
    raise SystemExit("No bundled privacy manifests were found.")
if any(item["tracking"] or item["trackingDomains"] for item in manifests):
    raise SystemExit("Bundled tracking declaration conflicts with the current no-tracking policy; reconcile before upload.")

frameworks = sorted({part for name in names for part in name.split("/") if part.endswith(".framework")})
missing_sdk_manifests = []
if not any("SDWebImage" in item["path"] for item in manifests):
    missing_sdk_manifests.append("SDWebImage")

summary = {
    "scope": "Actual compiled bundle declarations; not an App Privacy label or verification of provider retention/data processing.",
    "bundleIdentifier": info["CFBundleIdentifier"],
    "version": info.get("CFBundleShortVersionString"),
    "build": info.get("CFBundleVersion"),
    "minimumOS": info.get("MinimumOSVersion"),
    "deviceFamilies": info.get("UIDeviceFamily"),
    "cameraPurpose": info["NSCameraUsageDescription"],
    "photoLibraryPurpose": info.get("NSPhotoLibraryUsageDescription"),
    "microphonePurpose": info.get("NSMicrophoneUsageDescription"),
    "usesNonExemptEncryption": info.get("ITSAppUsesNonExemptEncryption"),
    "infoPlistSHA256": hashlib.sha256(read("Info.plist")).hexdigest(),
    "frameworks": frameworks,
    "missingRequiredSDKManifests": missing_sdk_manifests,
    "manifests": manifests,
}
output = Path(args.output)
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(summary, indent=2) + "\n")
if archive:
    archive.close()
if missing_sdk_manifests:
    raise SystemExit("Required image SDK privacy manifest is missing: " + ", ".join(missing_sdk_manifests))
print(f"Compiled privacy audit: {len(manifests)} manifests parsed; camera purpose present, no microphone or tracking declaration. This does not certify the App Privacy label.")
