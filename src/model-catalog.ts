export type ModelCatalog =
  | { kind: "unloaded"; revision: number }
  | { kind: "loading"; revision: number }
  | { kind: "ready"; revision: number; models: string[] }
  | { kind: "failed"; revision: number; message: string };
export type CatalogEvent =
  | { type: "reset"; revision: number }
  | { type: "load"; revision: number }
  | { type: "loaded"; revision: number; models: string[] }
  | { type: "failed"; revision: number; message: string };
export function modelCatalogReducer(
  state: ModelCatalog,
  event: CatalogEvent,
): ModelCatalog {
  if (event.type === "reset" && event.revision < state.revision) return state;
  if (event.type === "reset")
    return { kind: "unloaded", revision: event.revision };
  if (event.revision !== state.revision) return state;
  if (event.type === "load")
    return { kind: "loading", revision: state.revision };
  if (state.kind !== "loading") return state;
  return event.type === "loaded"
    ? {
        kind: "ready",
        revision: state.revision,
        models: [...new Set(event.models)].slice(0, 500),
      }
    : { kind: "failed", revision: state.revision, message: event.message };
}
