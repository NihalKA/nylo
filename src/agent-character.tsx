import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { Agent } from "./types";
import { glide, smooth, useReducedMotion } from "./motion";
import { meshAvatar, rgba } from "./organic";
import { theme } from "./theme";

type Face = { eyes: "round" | "smile" | "wide"; mouth: "smile" | "grin" | "o" };

/**
 * What the character is doing right now:
 * - idle: blinks now and then
 * - listening: you are typing; it leans in, eyes wide open
 * - thinking: reading your message; eyes wander, a thought bubble pulses
 * - speaking: the reply is streaming; its mouth talks
 */
export type AgentMood = "idle" | "listening" | "thinking" | "speaking";

/** A stable little personality per agent, derived from its name. */
export function agentFace(name: string): Face {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  const n = Math.abs(hash);
  return {
    eyes: (["round", "smile", "wide"] as const)[n % 3],
    mouth: (["smile", "grin", "o"] as const)[Math.floor(n / 3) % 3],
  };
}

/** A one-line character note shown under an agent's name. */
export function agentPersona(
  agent: Partial<Pick<Agent, "workflow" | "description">>,
) {
  if (agent.workflow === "plan") return "Plans it out, step by step";
  if (agent.workflow === "coach") return "Coaches you through it";
  return agent.description?.trim() || "Gets straight to the work";
}

/** Short status for a mood, e.g. under the agent's name. */
export function moodLabel(mood: AgentMood, connected = true) {
  if (mood === "listening") return "Listening…";
  if (mood === "thinking") return "Reading and thinking…";
  if (mood === "speaking") return "Replying…";
  return connected ? "Online" : "Offline";
}

function loop(value: Animated.Value, duration: number, delay = 0) {
  value.setValue(0);
  return Animated.loop(
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]),
  );
}

/**
 * An agent drawn as a character: its own colour mesh, eyes that blink and a
 * face that reacts to what is happening in the chat.
 */
export function AgentCharacter({
  agent,
  size = 56,
  speaking,
  mood: moodProp,
  ring,
}: {
  agent: Pick<Agent, "name" | "color">;
  size?: number;
  /** Shorthand for mood="speaking". */
  speaking?: boolean;
  mood?: AgentMood;
  /** Draw a selection ring in the agent's colour. */
  ring?: boolean;
}) {
  const mood: AgentMood = moodProp || (speaking ? "speaking" : "idle");
  const reduced = useReducedMotion();
  const blink = useRef(new Animated.Value(1)).current;
  const talk = useRef(new Animated.Value(0)).current;
  const phase = useRef(new Animated.Value(0)).current;
  const open = useRef(new Animated.Value(1)).current;
  const face = agentFace(agent.name);

  // Blinking, always (slower while listening: it is paying attention).
  useEffect(() => {
    if (reduced) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(
          (mood === "listening" ? 4200 : 2600) + (agent.name.length % 5) * 400,
        ),
        Animated.timing(blink, {
          toValue: 0.12,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 110,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [reduced, agent.name, mood]);

  // Mood motion: one looping phase drives the tilt, wander and bob.
  useEffect(() => {
    Animated.timing(open, {
      toValue: mood === "listening" ? 1.22 : mood === "thinking" ? 0.85 : 1,
      duration: glide.base,
      easing: smooth,
      useNativeDriver: true,
    }).start();
    if (reduced || mood === "idle") {
      phase.setValue(0);
      return;
    }
    const anim = loop(
      phase,
      mood === "thinking" ? 2200 : mood === "listening" ? 1600 : 700,
    );
    anim.start();
    return () => anim.stop();
  }, [mood, reduced]);

  // Talking mouth.
  useEffect(() => {
    if (reduced || mood !== "speaking") {
      talk.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(talk, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(talk, {
          toValue: 0,
          duration: 170,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [mood, reduced]);

  const eye = Math.max(3, Math.round(size * 0.11));
  const eyeGap = Math.round(size * 0.2);
  const mouthWidth = Math.round(size * (face.mouth === "o" ? 0.14 : 0.3));
  const ink = "#FFFFFF";
  const wobble =
    mood === "listening"
      ? phase.interpolate({
          inputRange: [0, 0.25, 0.75, 1],
          outputRange: ["0deg", "-7deg", "5deg", "0deg"],
        })
      : "0deg";
  const bob =
    mood === "speaking"
      ? phase.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, -size * 0.03, 0],
        })
      : 0;
  // While thinking, the eyes drift up-and-around as if reading.
  const lookX =
    mood === "thinking"
      ? phase.interpolate({
          inputRange: [0, 0.3, 0.6, 1],
          outputRange: [0, size * 0.06, -size * 0.06, 0],
        })
      : 0;
  const lookY = mood === "thinking" ? -size * 0.05 : 0;
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          ...meshAvatar(agent.color, agent.name),
          alignItems: "center",
          justifyContent: "center",
          borderWidth: ring ? 3 : 2,
          borderColor: ring ? agent.color : theme.card,
          boxShadow: ring
            ? `0px 0px 0px 3px ${rgba(agent.color, 0.25)}`
            : mood !== "idle"
              ? `0px 0px 0px 3px ${rgba(agent.color, 0.22)}, 0px 6px 18px -4px ${rgba(agent.color, 0.55)}`
              : `0px 0px 0px 1px ${agent.color}33`,
          transform: [{ rotate: wobble }, { translateY: bob }],
        }}
      >
        {/* Eyes */}
        <Animated.View
          style={{
            flexDirection: "row",
            gap: eyeGap,
            marginTop: -size * 0.06,
            transform: [
              { translateX: lookX },
              { translateY: lookY },
              { scaleY: Animated.multiply(blink, open) },
              { scaleX: open },
            ],
          }}
        >
          {[0, 1].map((i) =>
            face.eyes === "smile" && mood === "idle" ? (
              <View
                key={i}
                style={{
                  width: eye * 1.5,
                  height: eye * 0.9,
                  borderTopLeftRadius: eye,
                  borderTopRightRadius: eye,
                  borderWidth: Math.max(2, eye * 0.38),
                  borderBottomWidth: 0,
                  borderColor: ink,
                }}
              />
            ) : (
              <View
                key={i}
                style={{
                  width: face.eyes === "wide" ? eye * 1.25 : eye,
                  height: face.eyes === "wide" ? eye * 1.45 : eye,
                  borderRadius: eye,
                  backgroundColor: ink,
                }}
              />
            ),
          )}
        </Animated.View>
        {/* Mouth */}
        <Animated.View
          style={{
            marginTop: size * 0.09,
            transform: [
              {
                scaleY: talk.interpolate({
                  inputRange: [0, 1],
                  outputRange: [mood === "thinking" ? 0.5 : 1, 1.9],
                }),
              },
              { scaleX: mood === "thinking" ? 0.7 : 1 },
            ],
          }}
        >
          {face.mouth === "o" || mood === "speaking" ? (
            <View
              style={{
                width: mood === "speaking" ? mouthWidth * 0.8 : mouthWidth,
                height: mood === "speaking" ? mouthWidth * 0.5 : mouthWidth,
                borderRadius: mouthWidth,
                ...(mood === "speaking"
                  ? { backgroundColor: ink }
                  : {
                      borderWidth: Math.max(2, size * 0.04),
                      borderColor: ink,
                    }),
              }}
            />
          ) : (
            <View
              style={{
                width: mouthWidth,
                height: mouthWidth / 2,
                borderBottomLeftRadius: mouthWidth,
                borderBottomRightRadius: mouthWidth,
                ...(face.mouth === "grin"
                  ? { backgroundColor: ink }
                  : {
                      borderWidth: Math.max(2, size * 0.04),
                      borderTopWidth: 0,
                      borderColor: ink,
                    }),
              }}
            />
          )}
        </Animated.View>
      </Animated.View>
      {mood === "thinking" && size >= 32 ? (
        <ThoughtBubble size={size} color={agent.color} />
      ) : null}
    </View>
  );
}

/** Three dots in a bubble over the character's shoulder. */
function ThoughtBubble({ size, color }: { size: number; color: string }) {
  const reduced = useReducedMotion();
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (reduced) return;
    const anims = dots.map((d, i) => loop(d, 900, i * 160));
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [reduced]);
  const dot = Math.max(3, Math.round(size * 0.07));
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: -size * 0.12,
        right: -size * 0.22,
        flexDirection: "row",
        gap: dot * 0.6,
        paddingHorizontal: dot * 1.2,
        paddingVertical: dot,
        borderRadius: dot * 3,
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: rgba(color, 0.35),
        boxShadow: theme.cardShadow,
      }}
    >
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            width: dot,
            height: dot,
            borderRadius: dot,
            backgroundColor: color,
            opacity: d.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.3, 1, 0.3],
            }),
            transform: [
              {
                translateY: d.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, -dot * 0.6, 0],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}
