const { withDangerousMod } = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");
const MARKER =
  "// Nylo image rendering: explicit Promise bridge (Expo 58.0.16)";
const ORIGINAL = `      AsyncFunction("renderAsync") { (context: ImageManipulatorContext) -> ImageRef in
        let image = try await context.render()
        return ImageRef(image)
      }`;
const REPLACEMENT = `      ${MARKER}
      AsyncFunction("renderAsync") { (context: ImageManipulatorContext, promise: Promise) in
        NSLog("[NyloImage] render requested")
        Task {
          do {
            NSLog("[NyloImage] render task started")
            let image = try await context.render()
            NSLog("[NyloImage] rendered image ready")
            promise.resolve(ImageRef(image))
            NSLog("[NyloImage] result scheduled")
          } catch {
            NSLog("[NyloImage] render rejected")
            promise.reject(error)
          }
        }
      }`;

function patchImageRenderer(contents, version) {
  if (version !== "58.0.16")
    throw new Error("Review the Nylo image bridge patch for this SDK version.");
  if (contents.includes(MARKER)) {
    if (!contents.includes(REPLACEMENT))
      throw new Error("Nylo image bridge patch is incomplete or modified.");
    return contents;
  }
  if (contents.split(ORIGINAL).length !== 2)
    throw new Error("Cannot locate the expected Expo image render bridge.");
  return contents.replace(ORIGINAL, REPLACEMENT);
}

module.exports = (config) =>
  withDangerousMod(config, [
    "ios",
    async (config) => {
      const root = path.dirname(
        require.resolve("expo-image-manipulator/package.json", {
          paths: [config.modRequest.projectRoot],
        }),
      );
      const { version } = JSON.parse(
        fs.readFileSync(path.join(root, "package.json"), "utf8"),
      );
      const source = path.join(root, "ios/ImageManipulatorModule.swift");
      const original = fs.readFileSync(source, "utf8");
      const patched = patchImageRenderer(original, version);
      if (patched !== original) fs.writeFileSync(source, patched);
      console.log(
        `Nylo image render Promise bridge verified for Expo ${version}.`,
      );
      return config;
    },
  ]);
module.exports.patchImageRenderer = patchImageRenderer;
module.exports.ORIGINAL = ORIGINAL;
module.exports.REPLACEMENT = REPLACEMENT;
