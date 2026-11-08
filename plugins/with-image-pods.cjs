const { withPodfile } = require("expo/config-plugins");
const START =
  "# Nylo image SDK versions (source-built for vendor privacy resources)";
const END = "# End Nylo image SDK versions";
function pinImagePods(contents) {
  if (contents.includes(START)) {
    const marker = contents.indexOf(START);
    const start = contents.lastIndexOf("\n", marker) + 1;
    const end = contents.indexOf(END, marker);
    if (end < 0) throw new Error("Incomplete Nylo image SDK Podfile block.");
    const nextLine = contents.indexOf("\n", end + END.length);
    contents =
      contents.slice(0, start) +
      (nextLine < 0 ? "" : contents.slice(nextLine + 1));
  }
  const anchor = /^([ \t]*)use_expo_modules!.*$/m;
  if (!anchor.test(contents))
    throw new Error(
      "Cannot locate Expo module declarations in generated Podfile.",
    );
  return contents.replace(
    anchor,
    (line, indent) =>
      `${line}\n${indent}${START}\n${indent}pod 'SDWebImage', '5.21.6'\n${indent}pod 'SDWebImageWebPCoder', '0.15.0'\n${indent}${END}`,
  );
}
module.exports = (config) =>
  withPodfile(config, (config) => {
    config.modResults.contents = pinImagePods(config.modResults.contents);
    return config;
  });
module.exports.pinImagePods = pinImagePods;
