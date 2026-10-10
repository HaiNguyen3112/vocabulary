import { create } from "zustand";
import {
  COLOR_SCHEME_STORAGE_KEY,
  parseColorSchemePreference,
  type ColorSchemePreference,
} from "@/lib/color-scheme";

// Storage can throw (Safari private mode, blocked site data) — the preference then lives for the session only.
function readStoredPreference(): ColorSchemePreference {
  try {
    return parseColorSchemePreference(window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY));
  } catch {
    return "light";
  }
}

function writeStoredPreference(preference: ColorSchemePreference) {
  try {
    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, preference);
  } catch {
    // Ignore — see readStoredPreference.
  }
}

type ColorSchemeState = {
  preference: ColorSchemePreference;
  setPreference: (preference: ColorSchemePreference) => void;
};

export const useColorSchemeStore = create<ColorSchemeState>((set) => ({
  preference: readStoredPreference(),
  setPreference: (preference) => {
    writeStoredPreference(preference);
    set({ preference });
  },
}));
