import React from "react";
import { Attachment } from "./types";
export function PDFContent({ file }: { file: Attachment }) {
  return React.createElement("iframe", {
    title: file.name,
    src: `data:application/pdf;base64,${file.data}`,
    style: { width: "100%", height: "100%", flex: 1, border: 0 },
  });
}
