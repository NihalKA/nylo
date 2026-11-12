import React from "react";
import { View } from "react-native";
import { Text } from "../src/typography";
import { FormScroll, Header, Page, s, useTheme } from "../src/ui";
import fontNotices from "../assets/fonts/notices.json";
import softwareNotices from "../assets/legal/software-notices.json";
const notices = [...fontNotices, ...softwareNotices];

export default function Licenses() {
  useTheme();
  return (
    <Page>
      <Header title="Licenses" />
      <FormScroll>
        {notices.map((notice) => (
          <View key={notice.name} style={{ gap: 12 }}>
            <Text accessibilityRole="header" style={s.h2}>
              {notice.name}
            </Text>
            <Text selectable style={s.sub}>
              {notice.source}
            </Text>
            <Text selectable style={[s.sub, { fontSize: 12, lineHeight: 18 }]}>
              {notice.license}
            </Text>
          </View>
        ))}
      </FormScroll>
    </Page>
  );
}
