import { credentialDestination } from "../src/credentials";
import { listModels } from "../src/models";
import { streamingFetch } from "../src/transport";
import { readKey } from "../src/storage";
import { askPermission } from "../src/consent";
import React, { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Connection, Protocol } from "../src/types";
import {
  protocolDefaults,
  uid,
  sameDestination,
  connectionProvider,
} from "../src/domain";
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

const providerPresets = [
  {
    id: "openai",
    label: "OpenAI",
    provider: "openai",
    protocol: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
  },
  {
    id: "anthropic",
    label: "Claude",
    provider: "anthropic",
    protocol: "anthropic",
    name: "Claude",
    baseUrl: "https://api.anthropic.com/v1",
  },
  {
    id: "nylohq",
    label: "NyloHQ",
    provider: "custom",
    protocol: "openai",
    name: "NyloHQ",
    baseUrl: "https://codex.nylohq.com/v1",
  },
  {
    id: "custom",
    label: "Custom API",
    provider: "custom",
    protocol: "compatible",
    name: "Custom provider",
    baseUrl: "",
  },
] as const;
function selectedPreset(connection: Connection) {
  if (connectionProvider(connection) !== "custom")
    return connectionProvider(connection);
  return connection.protocol === "openai" &&
    connection.baseUrl.replace(/\/+$/, "") === "https://codex.nylohq.com/v1"
    ? "nylohq"
    : "custom";
}

const draftConnection = (protocol: Protocol = "openai"): Connection => ({
  id: uid(),
  protocol,
  provider: protocol === "compatible" ? "custom" : protocol,
  ...protocolDefaults[protocol],
  model: "",
});
export default function Settings() {
  const { data, saveConnection, deleteConnection, update, runningId } =
    useStore();
  const [draft, setDraft] = useState<Connection | null>(
    data.connections.length ? null : draftConnection(),
  );
  const [advanced, setAdvanced] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const draftRevision = useRef(0);
  useEffect(() => {
    draftRevision.current++;
    setModels([]);
    setModelsOpen(false);
    setModelSearch("");
    setError("");
  }, [draft?.id, draft?.protocol, draft?.baseUrl, key]);
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
  useEffect(() => {
    if (!modelsOpen) return;
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      setModelsOpen(false);
      return true;
    });
    return () => listener.remove();
  }, [modelsOpen]);
  if (modelsOpen && draft)
    return (
      <Page>
        <View
          style={{
            flex: 1,
            padding: 20,
            paddingTop: 24,
            backgroundColor: theme.card,
            gap: 16,
          }}
        >
          <View style={s.between}>
            <Text accessibilityRole="header" style={[s.h2, { fontSize: 24 }]}>
              Choose a model
            </Text>
            <IconButton
              name="close"
              label="Close models"
              onPress={() => setModelsOpen(false)}
            />
          </View>
          <Field
            label="Search available models"
            value={modelSearch}
            onChangeText={setModelSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <FlatList
            data={models.filter((model) =>
              model.toLowerCase().includes(modelSearch.toLowerCase()),
            )}
            keyExtractor={(model) => model}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item: model }) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel={model}
                accessibilityState={{ checked: draft?.model === model }}
                onPress={() => {
                  setDraft((current) =>
                    current ? { ...current, model } : current,
                  );
                  setModelsOpen(false);
                }}
                style={[
                  s.between,
                  {
                    minHeight: 56,
                    gap: 12,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.line,
                  },
                ]}
              >
                <Text style={[s.text, { flex: 1 }]}>{model}</Text>
                {draft?.model === model ? (
                  <Icon name="checkmark-circle" color={theme.green} />
                ) : null}
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={s.sub}>No matching model. Try another search.</Text>
            }
          />
          <Text style={s.sub}>
            Choose a text model. Listing a model does not verify its chat or
            memory-tool access.
          </Text>
        </View>
      </Page>
    );
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
                <Text style={s.sub}>
                  {connectionProvider(c) === "custom" ? "Custom API · " : ""}
                  {new URL(c.baseUrl).host}
                </Text>
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
            {(data.providerConsents || []).some(
              (grant) => grant.credentialId === (c.credentialId || c.id),
            ) ? (
              <Button
                title={`Reset sharing approval for ${c.name}`}
                secondary
                disabled={!!runningId}
                onPress={() =>
                  void action(async () => {
                    await update((d) => ({
                      ...d,
                      providerConsents: (d.providerConsents || []).filter(
                        (grant) =>
                          grant.credentialId !== (c.credentialId || c.id),
                      ),
                    }));
                  }, "Sharing approval reset. Nylo will ask before the next message.")
                }
              />
            ) : null}
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
            <View style={[s.row, { gap: 8, flexWrap: "wrap" }]}>
              {providerPresets.map((preset) => (
                <Pressable
                  key={preset.id}
                  accessibilityRole="radio"
                  accessibilityLabel={preset.label}
                  accessibilityState={{
                    checked: selectedPreset(draft) === preset.id,
                  }}
                  onPress={() => {
                    setDraft({
                      ...draft,
                      provider: preset.provider,
                      protocol: preset.protocol,
                      name: preset.name,
                      baseUrl: preset.baseUrl,
                      model: "",
                    });
                    setKey("");
                    setModels([]);
                    setAdvanced(false);
                  }}
                  style={{
                    minHeight: 48,
                    minWidth: "45%",
                    flexGrow: 1,
                    borderWidth: 1,
                    borderColor:
                      selectedPreset(draft) === preset.id
                        ? theme.green
                        : theme.line,
                    backgroundColor:
                      selectedPreset(draft) === preset.id
                        ? theme.pale
                        : theme.card,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color:
                        selectedPreset(draft) === preset.id
                          ? theme.green
                          : theme.ink,
                    }}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {advanced ? (
              <Field
                label="Connection name"
                value={draft.name}
                onChangeText={(name) => setDraft({ ...draft, name })}
                maxLength={60}
              />
            ) : null}
            {connectionProvider(draft) === "custom" &&
            (advanced || selectedPreset(draft) === "custom") ? (
              <Field
                label="API base URL"
                value={draft.baseUrl}
                onChangeText={(baseUrl) => setDraft({ ...draft, baseUrl })}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="https://your-provider.com/v1"
                help={
                  connectionProvider(draft) === "custom"
                    ? "Enter your provider’s HTTPS URL. Choose its API format in Advanced settings."
                    : draft.protocol === "openai"
                      ? "Uses the OpenAI Responses API."
                      : "Uses the Anthropic Messages API."
                }
              />
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                advanced ? "Hide advanced settings" : "Advanced settings"
              }
              onPress={() => setAdvanced(!advanced)}
              style={[s.row, { minHeight: 44, gap: 6 }]}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: theme.green }}
              >
                {advanced ? "Hide advanced settings" : "Advanced settings"}
              </Text>
              <Icon
                name={advanced ? "chevron-up" : "chevron-down"}
                size={14}
                color={theme.green}
              />
            </Pressable>
            {advanced && connectionProvider(draft) === "custom" ? (
              <View style={{ gap: 8 }}>
                <Text style={s.text}>API format</Text>
                <View style={[s.row, { flexWrap: "wrap", gap: 8 }]}>
                  {(
                    [
                      { id: "compatible", label: "Chat Completions" },
                      { id: "openai", label: "Responses" },
                      { id: "anthropic", label: "Messages" },
                    ] as const
                  ).map((format) => (
                    <Pressable
                      key={format.id}
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked: draft.protocol === format.id,
                      }}
                      onPress={() => {
                        setDraft({ ...draft, protocol: format.id });
                        setKey("");
                      }}
                      style={{
                        minHeight: 44,
                        padding: 12,
                        borderRadius: 10,
                        backgroundColor:
                          draft.protocol === format.id
                            ? theme.pale
                            : theme.card,
                        borderWidth: 1,
                        borderColor: theme.line,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: theme.ink }}>
                        {format.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={s.sub}>
                  Use the format your provider supports. Codex-style services
                  commonly use Responses.
                </Text>
              </View>
            ) : null}
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
            <Text style={s.sub}>
              Get an API key from your provider’s developer dashboard. An
              ordinary chat subscription may use separate billing.
            </Text>
            <Button
              title={
                models.length ? "Choose another model" : "Find available models"
              }
              secondary
              loading={busy}
              onPress={() =>
                void action(async () => {
                  if (models.length) {
                    setModelsOpen(true);
                    return;
                  }
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
                  const secret =
                    key.trim() ||
                    (await readKey(
                      previous?.credentialId || draft.id,
                      credentialDestination(draft),
                    ));
                  if (!secret) throw new Error("Enter your API key first.");
                  if (
                    !(await askPermission(
                      "Contact this provider?",
                      `Your API key will be sent to ${new URL(draft.baseUrl).host} to request its model list. No chat history is sent.`,
                      "Find models",
                    ))
                  )
                    return;
                  let found: string[];
                  try {
                    found = await listModels(draft, secret, streamingFetch);
                  } catch (error) {
                    if (revision !== draftRevision.current) return;
                    throw error;
                  }
                  if (revision === draftRevision.current) {
                    setModels(found);
                    if (!(
                      selectedPreset(draft) === "nylohq" &&
                      found.includes("gpt-6-luna")
                    ))
                      setModelsOpen(true);
                    if (
                      selectedPreset(draft) === "nylohq" &&
                      !draft.model &&
                      found.includes("gpt-6-luna")
                    )
                      setDraft((current) =>
                        current ? { ...current, model: "gpt-6-luna" } : current,
                      );
                  }
                })
              }
            />
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
        {!draft && notice ? (
          <Button
            title="Done"
            icon="checkmark"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
          />
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
