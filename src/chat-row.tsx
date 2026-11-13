import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  View,
  useWindowDimensions,
} from "react-native";
import { Text } from "./typography";
import { ConversationRow, Icon, Tappable, confirm, s, theme } from "./ui";
import { useReducedMotion } from "./motion";
import { useStore } from "./store";

/** Keep the existing card untouched; reveal explicit actions, never delete on a full swipe. */
export function ChatRow(props: React.ComponentProps<typeof ConversationRow>) {
  const { archiveChat, deleteChat } = useStore();
  const { fontScale, width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const revealWidth = Math.min(width - 64, 176 * Math.min(fontScale, 1.4));
  const translateX = useRef(new Animated.Value(0)).current;
  const opened = useRef(false);
  const origin = useRef(0);
  const locked = useRef(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const settle = (open: boolean) => {
    opened.current = open;
    setVisible(open);
    Animated.timing(translateX, {
      toValue: open ? -revealWidth : 0,
      duration: reduced ? 0 : 180,
      useNativeDriver: true,
    }).start();
  };
  // Keep revealed controls aligned after rotation or a Dynamic Type change.
  useEffect(() => {
    translateX.stopAnimation();
    translateX.setValue(opened.current ? -revealWidth : 0);
  }, [revealWidth, translateX]);
  const gesture = PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dx, dy }) =>
      !locked.current &&
      Math.abs(dx) > 12 &&
      Math.abs(dx) > Math.abs(dy) * 1.5 &&
      (dx < 0 || opened.current),
    onPanResponderGrant: () => {
      translateX.stopAnimation();
      origin.current = opened.current ? -revealWidth : 0;
      setVisible(true);
    },
    onPanResponderMove: (_, { dx }) =>
      translateX.setValue(
        Math.max(-revealWidth, Math.min(0, origin.current + dx)),
      ),
    onPanResponderRelease: (_, { dx, vx }) =>
      settle(
        vx < -0.4 || (vx <= 0.4 && origin.current + dx < -revealWidth / 2),
      ),
    onPanResponderTerminate: () => settle(false),
  });
  const action = async (remove: boolean) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      if (remove) {
        if (
          !(await confirm(
            "Delete chat?",
            `“${props.conversation.title}” and its messages and attachments will be removed from this device. This cannot be undone. Saved agent memories are kept.`,
          ))
        )
          return;
        await deleteChat(props.conversation.id);
      } else {
        await archiveChat(props.conversation.id, !props.conversation.archived);
      }
      settle(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const archiveLabel = props.conversation.archived ? "Restore" : "Archive";
  return (
    <View>
      {visible ? (
        <View
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 12,
            width: revealWidth,
            flexDirection: "row",
            borderRadius: 22,
            overflow: "hidden",
          }}
        >
          {([false, true] as const).map((remove) => (
            <Tappable
              key={String(remove)}
              accessibilityRole="button"
              accessibilityLabel={`${remove ? "Delete" : archiveLabel} ${props.conversation.title}`}
              disabled={busy}
              onPress={() => void action(remove)}
              style={{
                flex: 1,
                minHeight: 64,
                alignItems: "center",
                justifyContent: "center",
                padding: 8,
                gap: 6,
                backgroundColor: remove ? theme.errorSurface : theme.pale,
              }}
            >
              <Icon
                name={
                  remove
                    ? "trash-outline"
                    : props.conversation.archived
                      ? "arrow-undo-outline"
                      : "archive-outline"
                }
                color={remove ? theme.error : theme.accentText}
                size={22}
              />
              <Text
                maxFontSizeMultiplier={1.6}
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: remove ? theme.error : theme.accentText,
                  textAlign: "center",
                }}
              >
                {remove ? "Delete" : archiveLabel}
              </Text>
            </Tappable>
          ))}
        </View>
      ) : null}
      <Animated.View
        {...gesture.panHandlers}
        style={{ transform: [{ translateX }] }}
      >
        <ConversationRow
          {...props}
          onPress={() => (opened.current ? settle(false) : props.onPress())}
          onLongPress={() => settle(!opened.current)}
          accessibilityHint="Swipe left or long press for chat actions."
          accessibilityActions={[
            { name: "archive", label: archiveLabel },
            { name: "delete", label: "Delete" },
          ]}
          onAccessibilityAction={(event) => {
            const name = event.nativeEvent.actionName;
            if (name === "archive" || name === "delete")
              void action(name === "delete");
          }}
        />
      </Animated.View>
      {error ? (
        <Text accessibilityRole="alert" style={[s.error, { marginBottom: 12 }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
