import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";
import {
  acquireResponseLease,
  ResponseLeaseAdapter,
} from "./response-lifetime";

type BackgroundModule = {
  begin: (token: string) => Promise<boolean>;
  end: (token: string) => Promise<void>;
  addListener: (
    event: "expired",
    listener: (event: { token: string }) => void,
  ) => { remove: () => void };
};
const native =
  Platform.OS === "ios" || Platform.OS === "android"
    ? requireOptionalNativeModule<BackgroundModule>("NyloBackgroundResponse")
    : null;
const adapter: ResponseLeaseAdapter | null = native
  ? {
      begin: (token) => native.begin(token),
      end: (token) => native.end(token),
      subscribe: (expired) => {
        const subscription = native.addListener("expired", ({ token }) =>
          expired(token),
        );
        return () => subscription.remove();
      },
    }
  : null;
export const beginBackgroundResponse = (
  token: string,
  interrupt: () => void,
  signal: AbortSignal,
) => acquireResponseLease(adapter, token, interrupt, signal);
