import { Connection } from "./types";
export function connectionModels(connection: Connection): string[] {
  return [
    ...new Set(
      [connection.model, ...(connection.models || [])]
        .map((m) => m.trim())
        .filter(Boolean),
    ),
  ].slice(0, 500);
}
export function modelChoices(connections: Connection[]) {
  return connections.flatMap((connection) =>
    connectionModels(connection).map((model) => ({
      connection,
      model,
      id: `${connection.id}:${model}`,
    })),
  );
}
// Keep connection identity even when providers share a name or model ID.
export function modelSections(connections: Connection[], search = "") {
  const query = search.trim().toLowerCase();
  return connections
    .map((connection) => ({
      key: connection.id,
      connection,
      data: connectionModels(connection)
        .filter((model) =>
          `${connection.name} ${model}`.toLowerCase().includes(query),
        )
        .map((model) => ({ id: `${connection.id}:${model}`, model })),
    }))
    .filter((section) => section.data.length > 0);
}
export function selectedConnection(
  connection: Connection,
  model?: string,
): Connection {
  if (model && !connectionModels(connection).includes(model))
    throw new Error(
      "This model is no longer in the provider’s saved models. Choose another model.",
    );
  return { ...connection, model: model || connection.model };
}
