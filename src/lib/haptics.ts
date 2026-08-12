/** Light haptic feedback when supported (mostly Android Chrome). */
export function haptic(ms: number | number[] = 12) {
  if (typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    // ignore
  }
}
