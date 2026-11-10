import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, Platform, useColorScheme } from "react-native";
import * as SystemUI from "expo-system-ui";
import { readPreference, writePreference } from "./storage";

// Nylo "Fresh" palette: a design-system extension beyond the Figma reference,
// requested by the owner on 10 Nov 2026 (brighter accent, light + dark modes).
// Token names are unchanged so every screen keeps reading `theme.<token>`.
const light = {
  bg: "#F7F8FA",
  card: "#FFFFFF",
  surface: "#F0F2F6",
  ink: "#141A2E",
  primary: "#3358E0",
  accent2: "#6A4DF4",
  accent3: "#14B8A6",
  text: "#1B1F2A",
  sub: "#4D5466",
  quiet: "#6A7083",
  line: "#E3E6EC",
  lineStrong: "#CDD2DC",
  hairline: "rgba(20,26,46,0.08)",
  green: "#087B65",
  pale: "#EBF0FF",
  accentText: "#2D4FCF",
  error: "#B42907",
  errorSurface: "#FFEEE9",
  selected: "#DDE5FF",
  muted: "#ECEEF2",
  disabled: "#E3E6EC",
  disabledText: "#9097A6",
  file: "#FFFFFF",
  fileLine: "#E3E6EC",
  onPrimary: "#FFFFFF",
  overlay: "#0B102266",
  attachmentOverlay: "#0B102233",
  shadow: "#1B2550",
  cardShadow:
    "0px 1px 2px rgba(27,37,80,0.04), 0px 6px 18px -6px rgba(27,37,80,0.10)",
  raisedShadow: "0px 4px 16px -2px rgba(51,88,224,0.28)",
};
export type Palette = { [K in keyof typeof light]: string };

const dark: Palette = {
  bg: "#0F1218",
  card: "#171B23",
  surface: "#1E232D",
  ink: "#EEF1F7",
  primary: "#4466EE",
  accent2: "#6E56F0",
  accent3: "#2DD4BF",
  text: "#E4E7EE",
  sub: "#A9B0C0",
  quiet: "#8A91A3",
  line: "#2A303C",
  lineStrong: "#394050",
  hairline: "rgba(255,255,255,0.08)",
  green: "#3CCB9F",
  pale: "#1C2440",
  accentText: "#93A8FF",
  error: "#FF8A73",
  errorSurface: "#3A1F1B",
  selected: "#26325E",
  muted: "#232833",
  disabled: "#262B36",
  disabledText: "#6B7283",
  file: "#171B23",
  fileLine: "#2A303C",
  onPrimary: "#FFFFFF",
  overlay: "#00000099",
  attachmentOverlay: "#00000066",
  shadow: "#000000",
  cardShadow: "0px 1px 2px rgba(0,0,0,0.30)",
  raisedShadow: "0px 4px 16px -2px rgba(68,102,238,0.35)",
};

export type Scheme = "light" | "dark";
export type AppearancePreference = "system" | Scheme;
export const palettes: Record<Scheme, Palette> = { light, dark };

/** Live palette. Mutated in place when the scheme changes; read at render time. */
export const theme: Palette = { ...light };
let applied: Scheme = "light";
const appliers: ((scheme: Scheme) => void)[] = [];

/** Lets modules that derive styles from the palette rebuild them on a switch. */
export function onSchemeApplied(fn: (scheme: Scheme) => void) {
  appliers.push(fn);
}
export function applyScheme(scheme: Scheme) {
  if (applied === scheme) return;
  Object.assign(theme, palettes[scheme]);
  applied = scheme;
  for (const fn of appliers) fn(scheme);
}

const PREFERENCE_KEY = "appearance";
const isPreference = (v: unknown): v is AppearancePreference =>
  v === "system" || v === "light" || v === "dark";

type ThemeState = {
  scheme: Scheme;
  preference: AppearancePreference;
  setPreference: (value: AppearancePreference) => void;
  loaded: boolean;
};
const ThemeContext = createContext<ThemeState>({
  scheme: "light",
  preference: "system",
  setPreference: () => {},
  loaded: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] =
    useState<AppearancePreference>("system");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let live = true;
    readPreference(PREFERENCE_KEY)
      .then((value) => {
        if (live && isPreference(value)) setPreferenceState(value);
      })
      .catch(() => {})
      .finally(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, []);
  // While an explicit choice is active we override the native appearance so
  // alerts, pickers and the iOS keyboard match; "system" removes the override.
  useEffect(() => {
    if (Platform.OS === "web") return;
    Appearance.setColorScheme(
      preference === "system" ? "unspecified" : preference,
    );
  }, [preference]);
  const scheme: Scheme =
    preference === "system"
      ? system === "dark"
        ? "dark"
        : "light"
      : preference;
  // Apply before children render so every `theme.x` read in this pass is current.
  applyScheme(scheme);
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.bg).catch(() => {});
  }, [scheme]);
  const setPreference = useCallback((value: AppearancePreference) => {
    setPreferenceState(value);
    void writePreference(PREFERENCE_KEY, value).catch(() => {});
  }, []);
  const value = useMemo(
    () => ({ scheme, preference, setPreference, loaded }),
    [scheme, preference, setPreference, loaded],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Subscribes a screen to appearance changes. Every route component calls this
 * so its inline `theme.x` styles re-render when the scheme switches.
 */
export function useTheme() {
  return useContext(ThemeContext);
}
