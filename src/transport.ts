import { fetch as expoFetch } from "expo/fetch";
export const streamingFetch = expoFetch as unknown as typeof fetch;
