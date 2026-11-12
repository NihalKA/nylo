import { Attachment } from "./types";
function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function shareGeneratedFile(file: Attachment) {
  const bytes =
    file.mimeType === "text/plain"
      ? new TextEncoder().encode(file.data)
      : Uint8Array.from(atob(file.data), (c) => c.charCodeAt(0));
  download(file.name, new Blob([bytes], { type: file.mimeType }));
}
export async function exportResponse(text: string, format: "txt" | "pdf") {
  if (format === "pdf") {
    window.print();
    return;
  }
  download(
    "Nylo-response.txt",
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
}

export async function checkLocalExports() {
  /* Native file checks run on iOS and Android. */
}
