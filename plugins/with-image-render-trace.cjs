const { withDangerousMod } = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");
// Temporary static diagnostics only. No file paths, identifiers or image data.
const EDITS = {
  "ImageManipulatorModule.swift": [
    [
      "        let image = try await context.render()\n        return ImageRef(image)",
      '        NSLog("[NyloImage] render bridge entered")\n        let image = try await context.render()\n        NSLog("[NyloImage] render bridge returning")\n        return ImageRef(image)',
      1,
    ],
    [
      "      let context = ImageManipulatorContext { [weak appContext] in",
      '      NSLog("[NyloImage] context creating")\n      let context = ImageManipulatorContext { [weak appContext] in',
      1,
    ],
    [
      "      context.addTransformer(ImageFixOrientationTransformer())",
      '      context.addTransformer(ImageFixOrientationTransformer())\n      NSLog("[NyloImage] context created")',
      1,
    ],
  ],
  "ImageManipulatorContext.swift": [
    [
      "      return try await loader()",
      '      NSLog("[NyloImage] loader task entered")\n      let image = try await loader()\n      NSLog("[NyloImage] loader task returning")\n      return image',
      2,
    ],
    [
      "      try Task.checkCancellation()",
      '      NSLog("[NyloImage] transform task entered")\n      try Task.checkCancellation()',
      1,
    ],
    [
      "      let image = try await currentTask.value\n      return try await transformer.transform(image: image)",
      '      NSLog("[NyloImage] transform waiting for source")\n      let image = try await currentTask.value\n      NSLog("[NyloImage] transform source ready")\n      let result = try await transformer.transform(image: image)\n      NSLog("[NyloImage] transform returning")\n      return result',
      1,
    ],
    [
      "    return try await currentTask.value",
      '    NSLog("[NyloImage] render task wait entered")\n    let image = try await currentTask.value\n    NSLog("[NyloImage] render task wait returning")\n    return image',
      1,
    ],
  ],
  "ImageManipulatorUtils.swift": [
    [
      "  let maxWidth = loadOptions?.maxWidth.map(Double.init)",
      '  NSLog("[NyloImage] URI loader entered")\n  let maxWidth = loadOptions?.maxWidth.map(Double.init)',
      1,
    ],
    [
      '  if url.scheme == "data" {',
      '  if url.scheme == "data" {\n    NSLog("[NyloImage] data loader entered")',
      1,
    ],
    [
      "    guard let imageLoader = appContext.imageLoader else {",
      '    NSLog("[NyloImage] fallback loader entered")\n    guard let imageLoader = appContext.imageLoader else {',
      1,
    ],
    [
      "  if let image = decodeDownsampledImage(at: url, maxWidth: maxWidth, maxHeight: maxHeight) {",
      '  NSLog("[NyloImage] local decoder entered")\n  if let image = decodeDownsampledImage(at: url, maxWidth: maxWidth, maxHeight: maxHeight) {',
      1,
    ],
    [
      "  guard let data = try? Data(contentsOf: url), let image = UIImage(data: data) else {",
      '  NSLog("[NyloImage] local bitmap read entered")\n  guard let data = try? Data(contentsOf: url), let image = UIImage(data: data) else {',
      1,
    ],
    [
      "  return image\n}\n\n/**\n Loads the image from user",
      '  NSLog("[NyloImage] local bitmap returning")\n  return image\n}\n\n/**\n Loads the image from user',
      1,
    ],
  ],
  "Transformers/ImageFixOrientationTransformer.swift": [
    [
      "  func transform(image: UIImage) async throws -> UIImage {",
      '  func transform(image: UIImage) async throws -> UIImage {\n    NSLog("[NyloImage] orientation entered")\n    defer { NSLog("[NyloImage] orientation exited") }',
      1,
    ],
  ],
};
function patchImageTrace(contents, version, file) {
  if (version !== "58.0.16")
    throw new Error("Review image diagnostics for this SDK version.");
  const edits = EDITS[file];
  if (!edits) throw new Error("Unexpected image diagnostics file.");
  for (const [before, after, count] of edits) {
    const found = contents.split(before).length - 1;
    const patched = contents.split(after).length - 1;
    if (patched === count) continue;
    if (found !== count || patched)
      throw new Error(`Unexpected SDK source in ${file}.`);
    contents = contents.split(before).join(after);
  }
  return contents;
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
      for (const file of Object.keys(EDITS)) {
        const source = path.join(root, "ios", file);
        const before = fs.readFileSync(source, "utf8");
        const after = patchImageTrace(before, version, file);
        if (after !== before) fs.writeFileSync(source, after);
      }
      console.log(
        `Nylo image native stage tracing verified for Expo ${version}; original render bridge retained.`,
      );
      return config;
    },
  ]);
module.exports.patchImageTrace = patchImageTrace;
module.exports.EDITS = EDITS;
