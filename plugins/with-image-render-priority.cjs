const { withDangerousMod } = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");
const BEFORE = "Task(priority: .background)";
const AFTER = "Task(priority: .userInitiated)";
function patchImagePriority(contents, version) {
  if (version !== "58.0.16")
    throw new Error("Review image task priorities for this SDK version.");
  const before = contents.split(BEFORE).length - 1;
  const after = contents.split(AFTER).length - 1;
  if (!before && after === 3) return contents;
  if (before !== 3 || after)
    throw new Error("Unexpected image loader task source.");
  return contents.split(BEFORE).join(AFTER);
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
      const source = path.join(root, "ios/ImageManipulatorContext.swift");
      const before = fs.readFileSync(source, "utf8");
      const after = patchImagePriority(before, version);
      if (after !== before) fs.writeFileSync(source, after);
      console.log(
        `Nylo user-initiated image task priority verified for Expo ${version}.`,
      );
      return config;
    },
  ]);
module.exports.patchImagePriority = patchImagePriority;
