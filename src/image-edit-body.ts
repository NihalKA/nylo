// Expo fetch accepts file/blob objects with readable bytes, not RN URI records.
export function imageEditBody(options: {
  model: string;
  prompt: string;
  size: string;
  files: readonly Blob[];
}): FormData {
  const body = new FormData();
  body.append("model", options.model);
  body.append("prompt", options.prompt);
  body.append("n", "1");
  body.append("size", options.size);
  body.append("quality", "low");
  body.append("output_format", "png");
  for (const file of options.files) body.append("image", file);
  return body;
}
