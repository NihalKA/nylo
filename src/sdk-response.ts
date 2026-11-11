// React Native's global Response is not a Web Streams constructor. Preserve the
// real Expo response and bind native/private getters to it when monitoring SSE.
export function withStreamingBody(
  response: Response,
  body: ReadableStream<Uint8Array>,
): Response {
  return new Proxy(response, {
    get(target, property) {
      if (property === "body") return body;
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

// Only for synthetic offline diagnostics. Never asks the global constructor to
// consume a ReadableStream, which React Native's fetch polyfill cannot do.
export function syntheticStreamResponse(
  body: ReadableStream<Uint8Array>,
  init: ResponseInit,
): Response {
  const response = new Response(null, init);
  return withStreamingBody(response, body);
}

// RN's string Response supports text()/json() but has no readable body. The
// SDK reads JSON through body.getReader(), so synthetic responses need both.
export function syntheticJSONResponse(value: unknown): Response {
  const text = JSON.stringify(value);
  const bytes = new TextEncoder().encode(text);
  return withStreamingBody(
    new Response(text, { headers: { "content-type": "application/json" } }),
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    }),
  );
}
