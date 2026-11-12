import { checkLocalExports } from "../src/file-export";
import { Attachment } from "../src/types";
import { checkSDKOnDevice } from "../src/sdk-check";
import { Text } from "../src/typography";
import React, { useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { createConversation, uid, removeDeviceCheckData } from "../src/domain";
import { useStore } from "../src/store";
import {
  Button,
  FormScroll,
  Header,
  Page,
  confirm,
  s,
  theme,
  useTheme,
  Press,
} from "../src/ui";

// A different runtime is evidence of reopening/reloading, not a VoiceOver pass.
const sessionId = uid();
const fact = (word: string) => `My Nylo test word is ${word}.`;
const testInstructions =
  "Answer briefly using your saved memories when relevant.";

export default function DeviceCheck() {
  useTheme();
  const { data, update, send, stop, runningId } = useStore();
  const [selected, setSelected] = useState(
    data.deviceCheck?.connectionId || data.defaultConnectionId,
  );
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState(0);
  const [sdkResult, setSDKResult] = useState("");
  const [sdkFile, setSDKFile] = useState<Attachment>();
  const [sdkDocuments, setSDKDocuments] = useState<Attachment[]>([]);
  const [restartResult, setRestartResult] = useState("");
  const check = data.deviceCheck;
  const connection = data.connections.find(
    (c) => c.id === (check?.connectionId || selected),
  );
  const agent = data.agents.find((a) => a.id === check?.agentId);
  const streamChat = data.conversations.find(
    (c) => c.id === check?.streamChatId,
  );
  const recallChat = data.conversations.find(
    (c) => c.id === check?.recallChatId,
  );
  const memorySaved =
    !!check && !!agent?.memories.some((m) => m.text === fact(check.word));
  const stream = streamChat?.messages.at(-1);
  const recall = recallChat?.messages.at(-1);
  const testRunning =
    !!runningId &&
    [check?.streamChatId, check?.recallChatId].includes(runningId);
  const disabled = busy || !!runningId;
  const action = async (fn: () => Promise<void>) => {
    if (locked.current || runningId) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const run = (kind: "stream" | "recall") =>
    void action(async () => {
      if (!check || !connection)
        throw new Error("Choose a saved provider first.");
      if (kind === "recall" && !memorySaved)
        throw new Error("Save the test memory first.");
      if (
        kind === "recall" &&
        (!agent ||
          agent.name !== "Nylo device check" ||
          agent.instructions !== testInstructions ||
          agent.description !==
            "Synthetic test data. Safe to remove after checking." ||
          agent.memories.length !== 1)
      )
        throw new Error(
          "The test agent was changed. Remove this test and prepare a new one so only synthetic test data is sent.",
        );
      if (
        !(await confirm(
          "Send one live test request?",
          `This sends synthetic test text${kind === "recall" ? " and the approved test memory" : ""} to ${connection.name} at ${new URL(connection.baseUrl).host}, using ${connection.model}. One request, at most 128 output tokens. Provider charges apply. No automatic retries.`,
          "Send test",
          false,
        ))
      )
        return;
      const id = kind === "stream" ? check.streamChatId : check.recallChatId;
      let count = 0;
      setEvents(0);
      await send(
        id,
        kind === "stream"
          ? "Reply with exactly: Nylo live stream is working."
          : "What is my Nylo test word? Reply with only the word saved in your memory.",
        false,
        undefined,
        {
          deviceCheck: true,
          maxOutputTokens: 128,
          tools: false,
          onText: () => {
            count++;
            setEvents(count);
          },
        },
      );
      if (kind === "stream")
        await update((d) => ({
          ...d,
          deviceCheck:
            d.deviceCheck?.agentId === check.agentId
              ? {
                  ...d.deviceCheck,
                  streamEvents:
                    d.conversations.find((c) => c.id === id)?.messages.at(-1)
                      ?.status === "complete"
                      ? count
                      : undefined,
                }
              : d.deviceCheck,
        }));
    });
  const result = (message: typeof stream, expected?: string) => {
    if (!message || message.role !== "assistant") return "Not run";
    if (message.status === "streaming") return "Receiving live text…";
    if (message.status !== "complete")
      return message.error || "Test interrupted; no pass recorded.";
    return expected && message.text.trim() !== expected
      ? "Response completed, but the exact answer did not match."
      : "Passed: completed response received.";
  };
  return (
    <Page>
      <Header title="Live device check" />
      <FormScroll>
        <Text style={s.h2}>Check Nylo on this device</Text>
        <Text style={s.text}>
          Watch a real reply, approve a test memory, then check it in a fresh
          conversation. Only synthetic test text is used. Your other
          conversations are not sent.
        </Text>
        <Text style={s.sub}>
          Nylo {Constants.expoConfig?.version} · build{" "}
          {Constants.nativeBuildVersion || "Development"}. Results stay on this
          device; this screen does not share them with support or this chat.
        </Text>
        <View style={s.card}>
          <Text style={s.h2}>Offline AI engine check</Text>
          <Text style={s.sub}>
            Checks streaming, real image upload encoding, PDF/text document
            tools and local exports on this device using synthetic data. No
            provider, credentials or conversations are contacted.
          </Text>
          <Button
            title="Check AI engine offline"
            secondary
            disabled={disabled}
            onPress={() =>
              void action(async () => {
                setSDKResult("");
                setSDKDocuments([]);
                setSDKFile(await checkSDKOnDevice(setSDKDocuments));
                await checkLocalExports();
                setSDKResult(
                  "Passed: SDK tools, images and local file exports.",
                );
              })
            }
          />
          {sdkResult ? (
            <Text accessibilityLabel={sdkResult} style={s.text}>
              {sdkResult}
            </Text>
          ) : null}
          {sdkFile ? (
            <Button
              title="Open offline sample"
              secondary
              disabled={disabled}
              onPress={() =>
                void action(async () => {
                  const connectionId =
                    data.defaultConnectionId || "sdk-offline-provider";
                  const chat = createConversation(connectionId);
                  await update((d) => ({
                    ...d,
                    connections: d.connections.some(
                      (c) => c.id === connectionId,
                    )
                      ? d.connections
                      : [
                          ...d.connections,
                          {
                            id: connectionId,
                            name: "Offline SDK example",
                            provider: "custom",
                            protocol: "openai",
                            baseUrl: "https://example.invalid/v1",
                            model: "synthetic-no-network",
                          },
                        ],
                    conversations: [
                      ...d.conversations,
                      {
                        ...chat,
                        title: "Example: SDK image",
                        messages: [
                          {
                            id: uid(),
                            role: "assistant",
                            text: "Synthetic offline SDK example.\n\n## Offline sample overview\n\n- **Local files:** the green tile and documents are synthetic test data.\n- **References:** [Synthetic reference](https://sdk-check.invalid/reference?utm_source=offline).\n\nNo live provider request was made.",
                            sources: [
                              {
                                title: "Synthetic reference",
                                url: "https://sdk-check.invalid/reference",
                              },
                              {
                                title: "Offline diagnostic notes",
                                url: "https://sdk-check.invalid/notes",
                              },
                            ],
                            status: "complete",
                            createdAt: Date.now(),
                            generatedFiles: [sdkFile, ...sdkDocuments],
                          },
                        ],
                      },
                    ],
                  }));
                  router.push({
                    pathname: "/chat/[id]",
                    params: { id: chat.id },
                  });
                })
              }
            />
          ) : null}
        </View>
        {!check ? (
          <>
            <Text style={s.eyebrow}>CHOOSE A SAVED PROVIDER</Text>
            {data.connections.map((c) => (
              <Press
                key={c.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected === c.id }}
                onPress={() => setSelected(c.id)}
                style={[
                  s.card,
                  {
                    minHeight: 60,
                    borderColor: selected === c.id ? theme.green : theme.line,
                  },
                ]}
              >
                <Text style={s.text}>
                  {c.name}
                  {selected === c.id ? " · Selected" : ""}
                </Text>
                <Text style={s.sub}>
                  {new URL(c.baseUrl).host} · {c.model}
                </Text>
              </Press>
            ))}
            {!data.connections.length ? (
              <Button
                title="Connect your AI"
                onPress={() => router.push("/connection")}
              />
            ) : null}
            <Button
              title="Prepare local test"
              disabled={disabled || !connection}
              onPress={() =>
                void action(async () => {
                  if (!connection) return;
                  const agentId = uid();
                  const stream = createConversation(connection.id);
                  const recall = createConversation(connection.id, agentId);
                  await update((d) => ({
                    ...d,
                    deviceCheck: {
                      agentId,
                      streamChatId: stream.id,
                      recallChatId: recall.id,
                      connectionId: connection.id,
                      word: `cedar-${uid()}`,
                      sessionId,
                      createdAt: Date.now(),
                    },
                    agents: [
                      ...d.agents,
                      {
                        id: agentId,
                        name: "Nylo device check",
                        description:
                          "Synthetic test data. Safe to remove after checking.",
                        instructions: testInstructions,
                        connectionId: connection.id,
                        color: theme.green,
                        memories: [],
                        createdAt: Date.now(),
                      },
                    ],
                    conversations: [
                      ...d.conversations,
                      { ...stream, title: "Device check: live reply" },
                      { ...recall, title: "Device check: fresh memory recall" },
                    ],
                  }));
                })
              }
            />
            <Text style={s.sub}>
              Preparing creates a test agent and two test conversations locally.
              It makes no network request.
            </Text>
          </>
        ) : (
          <>
            <View style={s.card}>
              <Text style={s.text}>
                {connection?.name || "Provider removed"} · {connection?.model}
              </Text>
              <Text style={s.sub}>
                {connection
                  ? new URL(connection.baseUrl).host
                  : "Remove this test and choose another provider."}
              </Text>
            </View>
            <Text style={s.eyebrow}>1. LIVE REPLY</Text>
            <Text style={s.text}>
              {result(stream, "Nylo live stream is working.")}
            </Text>
            <Text style={s.sub}>
              {testRunning && runningId === check.streamChatId && events > 0
                ? `${events} text events observed so far.`
                : check.streamEvents !== undefined
                  ? `${check.streamEvents} text events observed.`
                  : "Text-event count unavailable until a test completes."}{" "}
              Multiple events show incremental text delivery; a single event
              does not establish gradual streaming.
            </Text>
            {stream?.role === "assistant" && stream.text ? (
              <Text selectable style={[s.text, s.card]}>
                {stream.text}
              </Text>
            ) : null}
            <Button
              title={
                streamChat?.messages.length
                  ? "Run live reply again"
                  : "Run live reply"
              }
              disabled={disabled || !connection}
              onPress={() => run("stream")}
            />
            <Text style={s.eyebrow}>2. APPROVE TEST MEMORY</Text>
            <Text selectable style={s.text}>
              {fact(check.word)}
            </Text>
            <Text style={s.sub}>
              {memorySaved
                ? "Saved in the test agent’s memory."
                : "Save this generated fact only in the test agent. This does not make a provider request."}
            </Text>
            <Button
              title="Approve & save test memory"
              disabled={disabled || memorySaved || !agent}
              secondary
              onPress={() =>
                void action(async () => {
                  await update((d) => ({
                    ...d,
                    agents: d.agents.map((a) =>
                      a.id === check.agentId
                        ? {
                            ...a,
                            memories: [
                              ...a.memories.filter(
                                (m) => m.text !== fact(check.word),
                              ),
                              {
                                id: uid(),
                                text: fact(check.word),
                                createdAt: Date.now(),
                              },
                            ],
                          }
                        : a,
                    ),
                  }));
                })
              }
            />
            <Text style={s.eyebrow}>3. FRESH CONVERSATION RECALL</Text>
            <Text style={s.text}>{result(recall, check.word)}</Text>
            {recall?.role === "assistant" && recall.text ? (
              <Text selectable style={[s.text, s.card]}>
                {recall.text}
              </Text>
            ) : null}
            <Button
              title={
                recallChat?.messages.length
                  ? "Run memory recall again"
                  : "Run memory recall"
              }
              disabled={disabled || !memorySaved || !connection}
              onPress={() => run("recall")}
            />
            <Text style={s.eyebrow}>4. REOPEN & CHECK SAVED DATA</Text>
            <Text style={s.text}>
              Close Nylo fully, reopen it, then return to Settings → Live device
              check. This check uses no API request.
            </Text>
            <Button
              title="Check after reopening"
              secondary
              disabled={disabled}
              onPress={() => {
                setRestartResult(
                  check.sessionId === sessionId
                    ? "Still in the same app session. Close Nylo fully and reopen before checking."
                    : memorySaved && !!streamChat && !!recallChat
                      ? "Passed: a new app session restored the test agent, approved memory and both conversations. Check the live results above for their separate outcomes."
                      : "Saved test data is incomplete. No persistence pass recorded.",
                );
              }}
            />
            {restartResult ? (
              <Text accessibilityRole="alert" style={s.text}>
                {restartResult}
              </Text>
            ) : null}
            <Text style={s.sub}>
              You can also leave Nylo during a live test, then return to inspect
              its interrupted status and retained partial text. This screen does
              not certify VoiceOver, keyboard layout or iPhone compatibility.
            </Text>
            <Button
              title="Remove test data"
              secondary
              destructive
              disabled={disabled}
              onPress={() =>
                void action(async () => {
                  if (
                    !(await confirm(
                      "Remove device-check data?",
                      "This removes the test agent, its two test conversations and these results. Other agents, conversations and provider keys are kept.",
                      "Remove",
                    ))
                  )
                    return;
                  await update(removeDeviceCheckData);
                  setRestartResult("");
                })
              }
            />
          </>
        )}
        {testRunning ? (
          <Button
            title="Stop live test"
            secondary
            onPress={() => {
              if (runningId) stop(runningId);
            }}
          />
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        ) : null}
      </FormScroll>
    </Page>
  );
}
