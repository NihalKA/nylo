import { Text, TextInput } from "../../src/typography";
import React, { useMemo, useRef, useState } from "react";
import { Animated, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import { scrollTicker } from "../../src/haptics";
import { isDeviceCheckConversation } from "../../src/domain";
import {
  Button,
  ConversationRow,
  FabButton,
  FadeIn,
  Icon,
  GlowIcon,
  IconBubble,
  dayMood,
  BrandMark,
  Page,
  Tappable,
  s,
  theme,
  useTheme,
} from "../../src/ui";
export default function Chats() {
  useTheme();
  const { fontScale } = useWindowDimensions();
  // Cards cascade in only on first arrival, not while scrolling or filtering.
  const mountedAt = useRef(Date.now()).current;
  const [searchFocused, setSearchFocused] = useState(false);
  const { data, newChat, runningId } = useStore();
  const scrollY = useRef(new Animated.Value(0)).current;
  const tick = useRef(scrollTicker()).current;
  const onScrollTick = (e: { nativeEvent: { contentOffset: { y: number } } }) =>
    tick(e.nativeEvent.contentOffset.y);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const chats = useMemo(
    () =>
      data.conversations
        .filter((c) => !isDeviceCheckConversation(data, c.id))
        .filter(
          (c) =>
            c.messages.length > 0 ||
            c.draft?.trim() ||
            !!c.draftAttachments?.length,
        )
        .filter((c) => {
          const agent = data.agents.find((a) => a.id === c.agentId);
          const needle = query.trim().toLocaleLowerCase();
          return (
            !needle ||
            `${c.title} ${c.draft || ""} ${agent?.name || ""}`
              .toLocaleLowerCase()
              .includes(needle) ||
            c.messages.some((m) => m.text.toLocaleLowerCase().includes(needle))
          );
        })
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [data.conversations, data.agents, data.deviceCheck, query],
  );
  const start = async () => {
    try {
      const id = await newChat();
      router.push({ pathname: "/chat/[id]", params: { id } });
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <Page aura scrollY={scrollY}>
      <View style={[s.between, { paddingTop: 12, paddingBottom: 18, gap: 16 }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={[s.row, { gap: 8 }]}>
            <BrandMark height={14} />
            <Text
              maxFontSizeMultiplier={1.6}
              style={{ fontSize: 14, fontWeight: "600", color: theme.sub }}
            >
              {dayMood().greeting}
            </Text>
          </View>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={1.6}
            style={s.title}
          >
            Chats
          </Text>
        </View>
        <FabButton
          name="create-outline"
          label="New chat"
          onPress={() => void start()}
        />
      </View>
      <View
        style={[
          s.row,
          {
            backgroundColor: theme.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: searchFocused ? theme.primary : theme.line,
            paddingHorizontal: 14,
            gap: 8,
            marginBottom: 12,
          },
        ]}
      >
        <Icon
          name="search-outline"
          color={searchFocused ? theme.accentText : theme.quiet}
          size={19}
        />
        <TextInput
          accessibilityLabel="Search chats"
          placeholder="Search chats"
          placeholderTextColor={theme.quiet}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          clearButtonMode="while-editing"
          returnKeyType="search"
          style={{
            flex: 1,
            minHeight: 46,
            fontSize: 16,
            color: theme.ink,
            paddingVertical: 10,
          }}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      ) : undefined}
      {/* A hairline that appears once content scrolls beneath the header. */}
      <Animated.View
        pointerEvents="none"
        style={{
          height: 1,
          marginHorizontal: -20,
          backgroundColor: theme.line,
          opacity: scrollY.interpolate({
            inputRange: [0, 24],
            outputRange: [0, 1],
            extrapolate: "clamp",
          }),
        }}
      />
      <Animated.FlatList
        data={chats}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true, listener: onScrollTick },
        )}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 16,
        }}
        ListHeaderComponent={
          !data.connections.length && chats.length ? (
            <Tappable
              accessibilityRole="button"
              onPress={() => router.push("/connection")}
              feel="card"
              scaleTo={0.98}
              style={[
                s.row,
                {
                  gap: 14,
                  backgroundColor: theme.pale,
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 12,
                },
              ]}
            >
              <IconBubble
                name="key-outline"
                size={42}
                background={theme.card}
              />
              <View style={{ flex: 1 }}>
                <Text style={[s.text, { fontWeight: "600" }]}>
                  Connect an AI provider
                </Text>
                <Text style={s.sub}>Use your own API key to get replies.</Text>
              </View>
              <Icon name="chevron-forward" color={theme.accentText} size={16} />
            </Tappable>
          ) : undefined
        }
        renderItem={({ item, index }) => (
          <FadeIn
            delay={Math.min(index, 6) * 45}
            enabled={index < 8 && Date.now() - mountedAt < 800}
          >
            <ConversationRow
              live={runningId === item.id}
              conversation={item}
              agent={data.agents.find((a) => a.id === item.agentId)}
              onPress={() =>
                router.push({
                  pathname: "/chat/[id]",
                  params: { id: item.id },
                })
              }
            />
          </FadeIn>
        )}
        ListEmptyComponent={
          <FadeIn
            style={{
              flexGrow: 1,
              justifyContent: fontScale > 1.6 ? "flex-start" : "center",
              alignItems: "center",
              paddingBottom: 56,
              paddingTop: 32,
            }}
          >
            {fontScale <= 1.6 ? (
              <View style={{ marginBottom: 18 }}>
                <GlowIcon
                  name={query ? "search-outline" : "chatbubbles-outline"}
                />
              </View>
            ) : null}
            <Text
              style={[
                s.h2,
                {
                  fontSize: 20,
                  textAlign: "center",
                  marginBottom: 10,
                  letterSpacing: -0.7,
                },
              ]}
            >
              {query ? "No chats found" : "No chats yet"}
            </Text>
            {fontScale <= 1.6 ? (
              <Text
                style={[
                  s.text,
                  {
                    color: theme.sub,
                    textAlign: "center",
                    maxWidth: 285,
                    marginBottom: 28,
                  },
                ]}
              >
                {query
                  ? "Try a different word or search an agent’s name."
                  : "Your questions, drafts and ideas.\nSaved here as you go."}
              </Text>
            ) : null}
            {!query ? (
              <Button
                title="New chat"
                icon="create-outline"
                onPress={() => void start()}
              />
            ) : (
              <Button
                title="Clear search"
                secondary
                onPress={() => setQuery("")}
              />
            )}
            {!query && !data.connections.length ? (
              <Text
                style={[
                  s.sub,
                  { textAlign: "center", maxWidth: 290, marginTop: 16 },
                ]}
              >
                You’ll need your own AI provider API key for replies. Provider
                charges apply.
              </Text>
            ) : null}
          </FadeIn>
        }
      />
    </Page>
  );
}
