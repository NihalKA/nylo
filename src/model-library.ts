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
