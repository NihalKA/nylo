import { modelCatalogReducer } from "../src/model-catalog";
import { connectionModels } from "../src/model-library";
import { credentialDestination } from "../src/credentials";
import { listModels } from "../src/models";
import { streamingFetch } from "../src/transport";
import { readKey } from "../src/storage";
import { askPermission } from "../src/consent";
import React, { useEffect, useReducer, useRef, useState } from "react";
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
  const [catalog, dispatchCatalog] = useReducer(modelCatalogReducer, {
    kind: "unloaded",
    revision: 0,
  });
  const [savedModels, setSavedModels] = useState<string[]>([]);
  const models = catalog.kind === "ready" ? catalog.models : [];
  const shownModels = [
    ...new Set([
      ...models,
      ...savedModels,
      ...(draft ? connectionModels(draft) : []),
    ]),
  ];
  const [modelsOpen, setModelsOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const draftRevision = useRef(0);
  const actionLocked = useRef(false);
  useEffect(() => {
    draftRevision.current++;
    setSavedModels(draft ? connectionModels(draft) : []);
    dispatchCatalog({ type: "reset", revision: draftRevision.current });
    setModelsOpen(false);
    setModelSearch("");
    setError("");
  }, [draft?.id, draft?.protocol, draft?.baseUrl, key]);
  const action = async (fn: () => Promise<unknown>, success?: string) => {
    if (actionLocked.current) return;
    actionLocked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      if (success) setNotice(success);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      actionLocked.current = false;
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
              Choose models
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
          <View style={[s.row, { gap: 10, flexWrap: "wrap" }]}>
            <Button
              title={`Select all ${shownModels.length} shown models`}
              secondary
              onPress={() =>
                setDraft((c) =>
                  c
                    ? {
                        ...c,
                        models: shownModels,
                        model: c.model || shownModels[0] || "",
                      }
                    : c,
                )
              }
            />
            <Button
              title="Clear selection"
              secondary
              onPress={() =>
                setDraft((c) => (c ? { ...c, models: [], model: "" } : c))
              }
            />
          </View>
          <Text style={s.sub}>
            {draft.model ? connectionModels(draft).length : 0} selected · choose
            one in each chat
          </Text>
          <FlatList
            data={shownModels.filter((model) =>
              model.toLowerCase().includes(modelSearch.toLowerCase()),
            )}
            keyExtractor={(model) => model}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item: model }) => (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={model}
                accessibilityState={{
                  checked: connectionModels(draft).includes(model),
                }}
                onPress={() => {
                  setDraft((current) => {
                    if (!current) return current;
                    const selected = connectionModels(current);
                    const next = selected.includes(model)
                      ? selected.filter((m) => m !== model)
                      : [...selected, model];
                    return {
                      ...current,
                      models: next,
                      model: next.includes(current.model)
                        ? current.model
                        : next[0] || "",
                    };
                  });
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
                {connectionModels(draft).includes(model) ? (
                  <Icon name="checkmark-circle" color={theme.green} />
                ) : null}
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={s.sub}>No matching model. Try another search.</Text>
            }
          />
          <Button
            title="Done choosing models"
            disabled={!draft.model}
            onPress={() => setModelsOpen(false)}
          />
          <Text style={s.sub}>
            {catalog.kind === "ready"
              ? "Showing the returned catalog and saved models."
              : "Showing saved models. Refresh the provider model list to discover more."}{" "}
            Choose models supported by this API. Listing a model does not verify
            its chat or memory-tool access.
          </Text>
        </View>
      </Page>
    );
  return (
    <Page>
      <Header title="AI providers" dismissKeyboard />
      <FormScroll>
        <Text style={s.sub}>
          Connect your provider with an API key. Its charges and data policies
          apply.
        </Text>
        {data.connections.length ? (
          <View style={[s.between, { marginTop: 4 }]}>
            <Text style={s.h2}>Saved providers</Text>
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
        ) : null}
        {data.connections.map((c) => (
          <View key={c.id} style={[s.card, { gap: 12 }]}>
            <View style={[s.between, { gap: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.text, { fontWeight: "600" }]}>{c.name}</Text>
                <Text style={s.sub}>
                  {connectionModels(c).length}{" "}
                  {connectionModels(c).length === 1 ? "model" : "models"} ·
                  default {c.model}
                </Text>
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
                disabled={!!runningId || busy}
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
          <View style={{ gap: 20 }}>
            {data.connections.length ? (
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
            ) : null}
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
                      models: [],
                    });
                    setKey("");
                    dispatchCatalog({
                      type: "reset",
                      revision: ++draftRevision.current,
                    });
                    setAdvanced(false);
                  }}
                  style={{
                    minHeight: 48,
                    minWidth: "45%",
                    flexGrow: 1,
                    borderWidth: 1,
                    borderColor:
                      selectedPreset(draft) === preset.id
                        ? theme.ink
                        : theme.line,
                    backgroundColor:
                      selectedPreset(draft) === preset.id
                        ? theme.ink
                        : theme.surface,
                    borderRadius: 14,
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
                          ? "#FFFFFF"
                          : theme.ink,
                    }}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>
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
            {shownModels.length ? (
              <Button
                title="Manage selected models"
                secondary
                onPress={() => setModelsOpen(true)}
              />
            ) : null}
            <Button
              title={
                savedModels.length
                  ? "Refresh provider model list"
                  : "Find available models"
              }
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
                  if (revision !== draftRevision.current) return;
                  dispatchCatalog({ type: "load", revision });
                  let found: string[];
                  try {
                    found = await listModels(draft, secret, streamingFetch);
                  } catch (error) {
                    if (revision !== draftRevision.current) return;
                    dispatchCatalog({
                      type: "failed",
                      revision,
                      message: "Could not refresh the model catalog.",
                    });
                    throw error;
                  }
                  if (revision === draftRevision.current) {
                    dispatchCatalog({
                      type: "loaded",
                      revision,
                      models: found,
                    });
                    setModelsOpen(true);
                  }
                })
              }
            />
            <Field
              label="Default model"
              value={draft.model}
              onChangeText={(model) => setDraft({ ...draft, model })}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Paste a model ID from your provider"
              help="Select several models above, or type a default model ID. It is included in your saved models. Switch between them in any chat."
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                advanced ? "Hide advanced settings" : "Advanced settings"
              }
              onPress={() => setAdvanced(!advanced)}
              style={[s.row, { minHeight: 44, gap: 6 }]}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: theme.ink }}
              >
                {advanced ? "Hide advanced settings" : "Advanced settings"}
              </Text>
              <Icon
                name={advanced ? "chevron-up" : "chevron-down"}
                size={14}
                color={theme.ink}
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
                  commonly use Responses. Changing the format clears an entered
                  key; enter it again before saving.
                </Text>
              </View>
            ) : null}
            {advanced ? (
              <Field
                label="Connection name"
                value={draft.name}
                onChangeText={(name) => setDraft({ ...draft, name })}
                maxLength={60}
              />
            ) : null}
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
              Saving does not verify model access. Select all includes the
              returned catalog (up to 500 models); enter a model ID manually if
              missing. Consumer ChatGPT/Claude subscriptions do not include API
              credits.
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
