import { Alert, Platform } from "react-native";
export async function askPermission(
  title: string,
  message: string,
  action = "Allow",
): Promise<boolean> {
  if (Platform.OS === "web") return window.confirm(`${title}\n\n${message}`);
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: "Not now", style: "cancel", onPress: () => resolve(false) },
        { text: action, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}
