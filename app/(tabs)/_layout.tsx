import React from "react";
import { Tabs } from "expo-router";
import { Icon, theme } from "../../src/ui";
export default function MainTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.ink,
        tabBarInactiveTintColor: theme.sub,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.line,
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
            <Icon
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: "Agents",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={focused ? "people" : "people-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={focused ? "settings" : "settings-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
