import React from "react";
import { Image, Modal, ScrollView, View } from "react-native";
import { Attachment } from "./types";
import { Text } from "./typography";
import { Button, IconButton, Page, s, theme } from "./ui";
import { attachmentUri } from "./attachments";
import { PDFContent } from "./pdf-content";
import { shareGeneratedFile } from "./file-export";

export function DocumentPreviewModal({
  file,
  onClose,
  onError,
}: {
  file: Attachment | null;
  onClose: () => void;
  onError: (e: unknown) => void;
}) {
  return (
    <Modal
      visible={!!file}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {file ? (
        <Page>
          <View style={[s.between, { gap: 12, minHeight: 56 }]}>
            <Text numberOfLines={2} style={[s.h2, { flex: 1 }]}>
              {file.name}
            </Text>
            <IconButton
              name="close"
              label={
                file.mimeType.startsWith("image/")
                  ? "Close image preview"
                  : "Close document preview"
              }
              onPress={onClose}
            />
          </View>
          {file.mimeType.startsWith("image/") ? (
            <Image
              source={{ uri: attachmentUri(file) }}
              accessibilityLabel={`Image preview: ${file.name}`}
              resizeMode="contain"
              style={{ flex: 1, width: "100%", minHeight: 160 }}
            />
          ) : file.mimeType === "application/pdf" ? (
            <PDFContent file={file} />
          ) : (
            <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>
              <Text
                selectable
                style={{ color: theme.ink, fontSize: 15, lineHeight: 24 }}
              >
                {file.data}
              </Text>
            </ScrollView>
          )}
          <Button
            title="Save or share"
            secondary
            icon="share-outline"
            onPress={() => {
              void shareGeneratedFile(file).catch(onError);
            }}
          />
        </Page>
      ) : null}
    </Modal>
  );
}
