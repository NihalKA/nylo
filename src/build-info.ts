import Constants from "expo-constants";
import * as Application from "expo-application";

// Keep the source marker in the packaged bundle for CI identity verification.
// Product screens display only version/build, never this diagnostic marker.
export const buildInfo = Object.freeze({
  version:
    Application.nativeApplicationVersion ||
    Constants.expoConfig?.version ||
    "Development",
  build: Application.nativeBuildVersion,
  sourceMarker: process.env.EXPO_PUBLIC_UI_BUILD_MARKER,
});
