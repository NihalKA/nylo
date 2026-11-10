import { Text } from "../src/typography";
import React from "react";
import { useFonts } from "expo-font";
import { fontAssets } from "../src/typography";
import { Platform, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider, useStore } from "../src/store";
import { ThemeProvider } from "../src/theme";
import { warmUpSounds } from "../src/sounds";
import { BrandMark, FadeIn, TypingDots, s, theme, useTheme } from "../src/ui";

function Root() {
  const { scheme, loaded: themeLoaded } = useTheme();
  const { ready, storageError } = useStore();
  // Preload UI sounds once the first screen is ready.
  React.useEffect(() => {
    if (ready) warmUpSounds();
  }, [ready]);
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const loadingFont = fontsLoaded
    ? undefined
    : { fontFamily: Platform.OS === "ios" ? "System" : "sans-serif" };
  const statusBar = <StatusBar style={scheme === "dark" ? "light" : "dark"} />;
  if (!ready || !fontsLoaded || !themeLoaded)
    return (
      <View
        style={[
          s.page,
          {
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 30,
          },
        ]}
      >
        {statusBar}
        {storageError || fontError ? (
          <Text style={[s.error, loadingFont]}>
            {storageError ||
              "Unable to load the app fonts. Please restart Nylo."}
          </Text>
        ) : (
          <>
            <BrandMark height={44} />
            <TypingDots color={theme.primary} />
            <Text style={[s.sub, loadingFont]}>Opening your space…</Text>
          </>
        )}
      </View>
    );
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {storageError ? (
        <View style={{ padding: 12, backgroundColor: theme.errorSurface }}>
          <Text style={s.error}>{storageError}</Text>
        </View>
      ) : null}
      {statusBar}
      <FadeIn style={{ flex: 1 }} distance={0} duration={220}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.bg },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="connection" options={{ presentation: "modal" }} />
        </Stack>
      </FadeIn>
    </View>
  );
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StoreProvider>
          <Root />
        </StoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
