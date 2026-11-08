const { withDangerousMod } = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");
const ANCHOR =
  "    let imagePickerDelegate = ImagePickerHandler(onMediaPickingResultHandler: self, hideStatusBarWhenPresented: options.allowsEditing && !options.allowsMultipleSelection)";
const GUARD = `    // Nylo: reject unavailable camera hardware before UIKit source assignment.
    if sourceType == .camera {
      guard UIImagePickerController.isSourceTypeAvailable(.camera) else {
        return promise.reject("ERR_CAMERA_UNAVAILABLE", "Camera is unavailable on this device. Choose Photo library or files instead.")
      }
      let device: UIImagePickerController.CameraDevice = options.cameraType == .front ? .front : .rear
      guard UIImagePickerController.isCameraDeviceAvailable(device) else {
        return promise.reject("ERR_CAMERA_UNAVAILABLE", "This camera is unavailable. Choose Photo library or files instead.")
      }
    }
`;
function patchCameraAvailability(contents, version) {
  if (version !== "58.0.10")
    throw new Error(
      "Review the camera availability guard for this SDK version.",
    );
  if (contents.includes(GUARD)) return contents;
  if (
    contents.includes("// Nylo: reject unavailable camera") ||
    contents.split(ANCHOR).length !== 2
  )
    throw new Error("Unexpected camera picker source.");
  return contents.replace(ANCHOR, GUARD + ANCHOR);
}
module.exports = (config) =>
  withDangerousMod(config, [
    "ios",
    async (config) => {
      const root = path.dirname(
        require.resolve("expo-image-picker/package.json", {
          paths: [config.modRequest.projectRoot],
        }),
      );
      const { version } = JSON.parse(
        fs.readFileSync(path.join(root, "package.json"), "utf8"),
      );
      const source = path.join(root, "ios/ImagePickerModule.swift");
      const before = fs.readFileSync(source, "utf8");
      const after = patchCameraAvailability(before, version);
      if (after !== before) fs.writeFileSync(source, after);
      console.log(
        `Nylo camera hardware availability guard verified for Expo ${version}.`,
      );
      return config;
    },
  ]);
module.exports.patchCameraAvailability = patchCameraAvailability;
module.exports.GUARD = GUARD;
