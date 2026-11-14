import Constants from "expo-constants";

// Keep the source marker in the packaged bundle for CI identity verification.
// Product screens display only version/build, never this diagnostic marker.
export const buildInfo = Object.freeze({
  version: Constants.expoConfig?.version || "Development",
  build: Constants.nativeBuildVersion,
  sourceMarker: process.env.EXPO_PUBLIC_UI_BUILD_MARKER,
});
