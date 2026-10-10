export type ColorScheme = "light" | "dark";
export type ColorSchemePreference = ColorScheme | "system";

/** Shared with the pre-paint script in index.html — keep identical. */
export const COLOR_SCHEME_STORAGE_KEY = "study-vocabulary:color-scheme";

const PREFERENCE_CYCLE: readonly ColorSchemePreference[] = ["system", "light", "dark"];

/** Unknown or corrupted stored values fall back to following the OS. */
export function parseColorSchemePreference(raw: unknown): ColorSchemePreference {
  return PREFERENCE_CYCLE.find((preference) => preference === raw) ?? "system";
}

export function resolveColorScheme(
  preference: ColorSchemePreference,
  systemPrefersDark: boolean,
): ColorScheme {
  if (preference !== "system") return preference;
  return systemPrefersDark ? "dark" : "light";
}

/** Theme toggle order: system → light → dark → system. */
export function nextColorSchemePreference(preference: ColorSchemePreference): ColorSchemePreference {
  const index = PREFERENCE_CYCLE.indexOf(preference);
  return PREFERENCE_CYCLE[(index + 1) % PREFERENCE_CYCLE.length];
}
