import { Text } from "../src/typography";
import React from "react";
import { useFonts } from "expo-font";
import { fontAssets } from "../src/typography";
import { ActivityIndicator, Platform, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider, useStore } from "../src/store";
import { s, theme } from "../src/ui";

function Root() {
  const { ready, storageError } = useStore();
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const loadingFont = fontsLoaded
    ? undefined
    : { fontFamily: Platform.OS === "ios" ? "System" : "sans-serif" };
  if (!ready || !fontsLoaded)
    return (
      <View
        style={[
          s.page,
          {
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            padding: 30,
          },
        ]}
      >
        {storageError || fontError ? (
          <Text style={[s.error, loadingFont]}>
            {storageError ||
              "Unable to load the app fonts. Please restart Nylo."}
          </Text>
        ) : (
          <>
            <ActivityIndicator color={theme.green} />
            <Text style={[s.sub, loadingFont]}>Opening your space…</Text>
          </>
        )}
      </View>
    );
  return (
    <View style={{ flex: 1 }}>
      {storageError ? (
        <View style={{ padding: 12, backgroundColor: "#FBE9E5" }}>
          <Text style={s.error}>{storageError}</Text>
        </View>
      ) : null}
      <StatusBar style="dark" />
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
    </View>
  );
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
