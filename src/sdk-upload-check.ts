// Explicit offline diagnostic only: exercise the installed Expo fetch encoder.
// Keep this checked when upgrading the pinned Expo dependency.
import { normalizeBodyInitAsync } from "expo/src/winter/fetch/RequestUtils";

export async function checkSDKMultipartUpload(
  body: BodyInit | null | undefined,
  imageBase64: string,
) {
  const result = await normalizeBodyInitAsync(body);
  const contentType = result.overriddenHeaders?.find(
    ([name]) => name.toLowerCase() === "content-type",
  )?.[1];
  const expected = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
  const bytes = result.body;
  let found = false;
  if (bytes)
    for (let start = 0; start <= bytes.length - expected.length; start++) {
      if (expected.every((value, index) => bytes[start + index] === value)) {
        found = true;
        break;
      }
    }
  const headers = bytes ? new TextDecoder().decode(bytes) : "";
  if (
    !contentType?.startsWith("multipart/form-data; boundary=") ||
    !found ||
    !headers.includes('name="image"; filename=') ||
    !headers.includes("content-type: image/png")
  )
    throw new Error(
      "Offline image upload did not encode its multipart image bytes.",
    );
}
