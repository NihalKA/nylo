import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider, useStore } from "../src/store";
import { s, theme } from "../src/ui";

function Root() {
  const { ready, storageError } = useStore();
  if (!ready)
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
        {storageError ? (
          <Text style={s.error}>{storageError}</Text>
        ) : (
          <>
            <ActivityIndicator color={theme.green} />
            <Text style={s.sub}>Opening your space…</Text>
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
