/** Breathing room between the composer and the top of the keyboard. */
export const KEYBOARD_GAP = 8;

/**
 * How far the chat must rise so the composer clears the keyboard.
 *
 * - iOS: the keyboard's top edge (screenY) is exact, so lift by however much
 *   of the container's bottom it covers (falling back to height minus the
 *   home-indicator area when the container could not be measured).
 * - Android (edge-to-edge): React Native reports the keyboard height with
 *   the navigation bar already removed, and the container already ends above
 *   that bar, so the lift is the reported height itself.
 */
export function keyboardLiftFor({
  platform,
  keyboardHeight,
  keyboardTop,
  containerBottom,
  safeBottom,
  windowShrunk,
}: {
  platform: string;
  keyboardHeight: number;
  keyboardTop?: number;
  containerBottom?: number;
  safeBottom: number;
  /** Android resized the window for the keyboard itself. */
  windowShrunk?: boolean;
}) {
  if (keyboardHeight <= 0) return 0;
  if (platform === "ios") {
    if (containerBottom && keyboardTop)
      return Math.max(0, containerBottom - keyboardTop + KEYBOARD_GAP);
    return Math.max(0, keyboardHeight - safeBottom + KEYBOARD_GAP);
  }
  if (windowShrunk) return KEYBOARD_GAP;
  return keyboardHeight + KEYBOARD_GAP;
}
