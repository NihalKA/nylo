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
  const position = useRef(0);
  const gestureClaimed = useRef(false);
  const locked = useRef(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const settle = (open: boolean) => {
    opened.current = open;
    setVisible(open);
    position.current = open ? -revealWidth : 0;
    Animated.timing(translateX, {
      toValue: open ? -revealWidth : 0,
      duration: reduced ? 0 : 180,
      useNativeDriver: true,
    }).start();
  };
  // PanResponder owns touch history. Replacing it when grant reveals the buttons
  // discards that history in the middle of the gesture. Keep one instance and
  // read the latest layout/animation settings through a ref instead.
  const interaction = useRef({ revealWidth, settle });
  interaction.current = { revealWidth, settle };
  useEffect(() => {
    translateX.stopAnimation();
    position.current = opened.current ? -revealWidth : 0;
    translateX.setValue(position.current);
  }, [revealWidth, translateX]);
  const gesture = useRef<ReturnType<typeof PanResponder.create> | null>(null);
  if (!gesture.current) {
    const shouldClaim = (_: unknown, { dx, dy }: { dx: number; dy: number }) =>
      !locked.current &&
      Math.abs(dx) > 12 &&
      Math.abs(dx) > Math.abs(dy) * 1.5 &&
      (dx < 0 || opened.current);
    gesture.current = PanResponder.create({
      onMoveShouldSetPanResponder: shouldClaim,
      onMoveShouldSetPanResponderCapture: shouldClaim,
      onPanResponderGrant: () => {
        gestureClaimed.current = true;
        translateX.stopAnimation();
        origin.current = opened.current ? -interaction.current.revealWidth : 0;
        position.current = origin.current;
        setVisible(true);
      },
      onPanResponderMove: (_, { dx }) => {
        position.current = Math.max(
          -interaction.current.revealWidth,
          Math.min(0, origin.current + dx),
        );
        translateX.setValue(position.current);
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        const { revealWidth: width, settle: finish } = interaction.current;
        // Distance wins over a small rightward recoil at the end of a left swipe.
        // A short deliberate left fling can also reveal the buttons.
        finish(origin.current + dx <= -width / 2 || (dx < -12 && vx < -0.4));
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        const { revealWidth: width, settle: finish } = interaction.current;
        finish(position.current <= -width / 2);
      },
    });
  }
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
        {...gesture.current.panHandlers}
        style={{ transform: [{ translateX }] }}
      >
        <ConversationRow
          {...props}
          onPressIn={() => {
            // A fresh touch may close/open the row; the release of the swipe may not.
            gestureClaimed.current = false;
          }}
          onPress={() => {
            if (gestureClaimed.current) return;
            if (opened.current) settle(false);
            else props.onPress();
          }}
          onLongPress={() => {
            if (!gestureClaimed.current) settle(!opened.current);
          }}
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
