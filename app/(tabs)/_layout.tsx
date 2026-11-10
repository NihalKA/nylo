import React from "react";
import { Platform, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, theme } from "../../src/ui";
export default function MainTabs() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.ink,
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
          borderTopWidth: 0,
          // Reserve the system button/gesture area below Android's tab targets.
          ...(Platform.OS === "android"
            ? { height: 56 + bottom, paddingBottom: bottom }
            : {}),
        },
        tabBarItemStyle: { minHeight: 48, paddingTop: 4 },
        sceneStyle: { backgroundColor: theme.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
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
            <TabIcon
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
            <TabIcon
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

function TabIcon({
  name,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof Icon>["name"];
  color: React.ComponentProps<typeof Icon>["color"];
  focused: boolean;
}) {
  return (
    <View
      style={{
        width: 50,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
          focused && name.startsWith("settings")
            ? theme.selected
            : "transparent",
      }}
    >
      <Icon
        name={name}
        color={color}
        size={23}
        design={
          name.startsWith("chatbox")
            ? focused
              ? undefined
              : "tabChats"
            : name.startsWith("people")
              ? focused
                ? "tabAgentsActive"
                : "tabAgents"
              : focused
                ? "tabSettingsActive"
                : "tabSettings"
        }
      />
    </View>
  );
}
