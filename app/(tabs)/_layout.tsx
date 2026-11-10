import React from "react";
import { Platform, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandLine, TabPill, haptic, theme, useTheme } from "../../src/ui";
export default function MainTabs() {
  useTheme();
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs
      screenListeners={({ navigation }) => ({
        tabPress: () => {
          if (!navigation.isFocused()) haptic.select();
        },
      })}
      screenOptions={{
        headerShown: false,
        animation: "shift",
        tabBarActiveTintColor: theme.accentText,
        tabBarInactiveTintColor: theme.quiet,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "NyloBody600",
          letterSpacing: 0.33,
        },
        tabBarStyle: {
          backgroundColor: theme.bg,
          maxWidth: 576,
          width: "100%",
          alignSelf: "center",
          // The faded brand ribbon below is the only separator.
          borderTopWidth: 0,
          elevation: 0,
          // Reserve the system button/gesture area below Android's tab targets.
          ...(Platform.OS === "android"
            ? { height: 60 + bottom, paddingBottom: bottom }
            : {}),
        },
        tabBarItemStyle: { minHeight: 48, paddingTop: 4 },
        // A fine ribbon of the logo gradient that dissolves towards both
        // edges of the bar.
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <BrandLine
              fade
              height={1}
              style={{
                position: "absolute",
                top: 0,
                left: "4%",
                right: "4%",
              }}
            />
          </View>
        ),
        sceneStyle: { backgroundColor: theme.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, focused }) => (
            <TabPill
              name={focused ? "chatbox" : "chatbox-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: "Agents",
          tabBarIcon: ({ color, focused }) => (
            <TabPill
              name={focused ? "people" : "people-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <TabPill
              name={focused ? "settings" : "settings-outline"}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
