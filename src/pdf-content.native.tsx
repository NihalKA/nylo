import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View, ViewProps } from "react-native";
import { requireNativeView, requireOptionalNativeModule } from "expo";
import { Attachment } from "./types";
import { preparePdfPreview } from "./document-preview";
import { Text } from "./typography";
import { theme } from "./ui";
export function PDFContent({ file }: { file: Attachment }) {
  const [uri, setUri] = useState("");
  const [error, setError] = useState("");
  const NativeView = useMemo(
    () =>
      requireOptionalNativeModule("NyloDocumentPreview")
        ? requireNativeView<ViewProps & { uri: string }>("NyloDocumentPreview")
        : null,
    [],
  );
  useEffect(() => {
    if (!NativeView) return;
    let cancelled = false;
    setUri("");
    setError("");
    void preparePdfPreview(file)
      .then((copy) => {
        if (cancelled) copy.cleanup();
        else setUri(copy.uri);
      })
      .catch(
        () =>
          !cancelled &&
          setError(
            "This PDF could not be opened. Save or share is still available.",
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [file.id]);
  if (error || !NativeView)
    return (
      <Text style={{ color: theme.error }}>
        {error || "PDF preview needs the updated app."}
      </Text>
    );
  return (
    <View style={{ flex: 1 }}>
      {uri ? (
        <NativeView
          uri={uri}
          style={{ flex: 1 }}
          accessibilityLabel={`PDF preview: ${file.name}`}
        />
      ) : (
        <ActivityIndicator accessibilityLabel="Opening PDF" />
      )}
    </View>
  );
}
