import { listModels } from "../src/models";
import { streamingFetch } from "../src/transport";
import { readKey } from "../src/storage";
import { askPermission } from "../src/consent";
import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Connection, Protocol } from "../src/types";
import { protocolDefaults, uid, sameDestination } from "../src/domain";
import { useStore } from "../src/store";
import {
  Badge,
  Button,
  Field,
  FormScroll,
  Header,
  Icon,
  IconButton,
  Page,
  confirm,
  s,
  theme,
} from "../src/ui";

const draftConnection = (protocol: Protocol = "openai"): Connection => ({
  id: uid(),
  protocol,
  ...protocolDefaults[protocol],
  model: "",
});
export default function Settings() {
  const { data, saveConnection, deleteConnection, update, runningId } =
    useStore();
  const [draft, setDraft] = useState<Connection | null>(draftConnection());
  const [advanced, setAdvanced] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [modelSearch, setModelSearch] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const draftRevision = useRef(0);
  useEffect(() => {
    draftRevision.current++;
    setModels([]);
    setModelSearch("");
  }, [draft?.id, draft?.protocol, draft?.baseUrl]);
  const action = async (fn: () => Promise<unknown>, success?: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      if (success) setNotice(success);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page>
      <Header title="AI providers" />
      <FormScroll>
        <View style={{ gap: 10 }}>
          <Badge text="DEVICE EDITION" />
          <Text style={s.title}>Choose your AI</Text>
          <Text style={s.sub}>
            Connect a provider you already use. Nylo has no subscription or
            account. Your provider’s API charges still apply.
          </Text>
        </View>
        <View style={[s.between, { marginTop: 10 }]}>
          <Text style={s.h2}>Connections</Text>
          {!draft ? (
            <Button
              title="Add connection"
              secondary
              icon="add"
              onPress={() => {
                setDraft(draftConnection());
                setKey("");
                setError("");
                setNotice("");
              }}
            />
          ) : null}
        </View>
        {data.connections.map((c) => (
          <View key={c.id} style={[s.card, { gap: 12 }]}>
            <View style={[s.between, { gap: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.text, { fontWeight: "600" }]}>{c.name}</Text>
                <Text style={s.sub}>{c.model}</Text>
              </View>
              <IconButton
                name="create-outline"
                label={`Edit ${c.name}`}
                onPress={() => {
                  setDraft(c);
                  setKey("");
                  setNotice("");
                }}
              />
              <IconButton
                name="trash-outline"
                label={`Remove ${c.name}`}
                disabled={!!runningId}
                onPress={() =>
                  void action(async () => {
                    if (
                      await confirm(
                        "Remove connection?",
                        "The saved key will be removed. Your conversations remain on this device.",
                        "Remove",
                      )
                    )
                      await deleteConnection(c.id);
                  })
                }
              />
            </View>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{
                checked: data.defaultConnectionId === c.id,
              }}
              onPress={() =>
                void action(() =>
                  update((d) => ({ ...d, defaultConnectionId: c.id })),
                )
              }
              style={[s.row, { gap: 7, minHeight: 44 }]}
            >
              <Icon
                name={
                  data.defaultConnectionId === c.id
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={17}
                color={theme.green}
              />
              <Text style={s.sub}>Default for new chats</Text>
            </Pressable>
          </View>
        ))}
        {draft ? (
          <View style={[s.card, { gap: 18 }]}>
            <View style={s.between}>
              <Text style={s.h2}>
                {data.connections.some((c) => c.id === draft.id)
                  ? "Edit connection"
                  : "Connect a provider"}
              </Text>
              {data.connections.length ? (
                <IconButton
                  name="close"
                  label="Cancel connection"
                  onPress={() => {
                    setDraft(null);
                    setKey("");
                  }}
                />
              ) : null}
            </View>
            <View style={[s.row, { gap: 7, flexWrap: "wrap" }]}>
              {(["openai", "anthropic", "compatible"] as const).map(
                (protocol) => (
                  <Pressable
                    key={protocol}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: draft.protocol === protocol,
                    }}
                    onPress={() => {
                      setDraft({
                        ...draft,
                        ...protocolDefaults[protocol],
                        protocol,
                        model: "",
                      });
                      setKey("");
                      setModels([]);
                    }}
                    style={{
                      borderWidth: 1,
                      borderColor:
                        draft.protocol === protocol ? theme.green : theme.line,
                      backgroundColor:
                        draft.protocol === protocol ? theme.pale : "#FFF",
                      borderRadius: 9,
                      paddingHorizontal: 13,
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color:
                          draft.protocol === protocol ? theme.green : theme.sub,
                      }}
                    >
                      {protocol === "compatible"
                        ? "Custom API"
                        : protocolDefaults[protocol].name}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
            {advanced ? (
              <Field
                label="Connection name"
                value={draft.name}
                onChangeText={(name) => setDraft({ ...draft, name })}
                maxLength={60}
              />
            ) : null}
            {advanced || draft.protocol === "compatible" ? (
              <Field
                label="API base URL"
                value={draft.baseUrl}
                onChangeText={(baseUrl) => setDraft({ ...draft, baseUrl })}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="https://your-provider.com/v1"
                help={
                  draft.protocol === "compatible"
                    ? "Uses the OpenAI-compatible Chat Completions API."
                    : draft.protocol === "openai"
                      ? "Uses the OpenAI Responses API."
                      : "Uses the Anthropic Messages API."
                }
              />
            ) : null}
            <Button
              title={advanced ? "Hide advanced settings" : "Advanced settings"}
              secondary
              onPress={() => setAdvanced(!advanced)}
            />
            <Field
              label="API key"
              value={key}
              onChangeText={setKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              placeholder={
                data.connections.some((c) => c.id === draft.id)
                  ? "Leave blank to keep the saved key"
                  : "Paste your API key"
              }
              help={
                Platform.OS === "web"
                  ? "Browser preview: keys stay in memory and disappear on reload. Mobile builds use secure device storage."
                  : "Encrypted in this phone’s secure storage. Keys are excluded from backups."
              }
            />
            <Button
              title="Find available models"
              secondary
              loading={busy}
              onPress={() =>
                void action(async () => {
                  const revision = draftRevision.current;
                  const previous = data.connections.find(
                    (c) => c.id === draft.id,
                  );
                  if (
                    !key.trim() &&
                    previous &&
                    !sameDestination(previous, draft)
                  )
                    throw new Error(
                      "Enter the API key again when changing provider or destination.",
                    );
                  const secret = key.trim() || (await readKey(draft.id));
                  if (!secret) throw new Error("Enter your API key first.");
                  if (
                    !(await askPermission(
                      "Contact this provider?",
                      `Your API key will be sent to ${new URL(draft.baseUrl).host} to request its model list. No chat history is sent.`,
                      "Find models",
                    ))
                  )
                    return;
                  const found = await listModels(draft, secret, streamingFetch);
                  if (revision === draftRevision.current) setModels(found);
                })
              }
            />
            {models.length ? (
              <View style={{ gap: 8 }}>
                <Field
                  label="Search available models"
                  value={modelSearch}
                  onChangeText={setModelSearch}
                  autoCapitalize="none"
                />
                <Text style={s.sub}>
                  Showing up to 20 matches. Choose a text model.
                </Text>
                {models
                  .filter((model) =>
                    model.toLowerCase().includes(modelSearch.toLowerCase()),
                  )
                  .slice(0, 20)
                  .map((model) => (
                    <Pressable
                      key={model}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: draft.model === model }}
                      onPress={() => setDraft({ ...draft, model })}
                      style={{
                        minHeight: 44,
                        justifyContent: "center",
                        paddingHorizontal: 12,
                        backgroundColor:
                          draft.model === model ? theme.pale : theme.card,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={s.text}>{model}</Text>
                    </Pressable>
                  ))}
              </View>
            ) : null}
            <Field
              label="Model"
              value={draft.model}
              onChangeText={(model) => setDraft({ ...draft, model })}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Paste a model ID from your provider"
              help="Choose a model above, or enter its ID manually. A listed model may not support text chat or memory tools."
            />
            <Text style={s.sub}>
              Your API key goes only to{" "}
              {draft.baseUrl || "the provider you choose"}. Saving does not send
              your chats.
            </Text>
            <Button
              title="Save connection"
              loading={busy}
              disabled={!!runningId}
              icon="checkmark"
              onPress={() =>
                void action(async () => {
                  await saveConnection(draft, key);
                  setDraft(null);
                  setKey("");
                }, "Connection saved on this device. Send a message to try it.")
              }
            />
            <Text style={s.sub}>
              Saving does not verify model access. Available models shows a
              limited first page; enter a model ID manually if missing. Consumer
              ChatGPT/Claude subscriptions do not include API credits.
            </Text>
          </View>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        ) : null}
        {notice ? (
          <Text
            accessibilityRole="alert"
            style={{ color: theme.green, fontSize: 13, lineHeight: 20 }}
          >
            {notice}
          </Text>
        ) : null}
      </FormScroll>
    </Page>
  );
}
