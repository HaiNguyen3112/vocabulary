import { useEffect } from "react";
import { resolveColorScheme, type ColorScheme } from "@/lib/color-scheme";
import { useColorSchemeStore } from "@/store/color-scheme-store";
import { palettes } from "@/styles/theme";
import { useMediaQuery } from "./use-media-query";

/** The scheme actually shown: the user's choice, or the OS setting for "system". */
export function useResolvedColorScheme(): ColorScheme {
  const preference = useColorSchemeStore((state) => state.preference);
  const systemPrefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  return resolveColorScheme(preference, systemPrefersDark);
}

/** Switches the CSS variables (`data-theme`) and the browser chrome colour. */
export function useApplyColorScheme(scheme: ColorScheme) {
  useEffect(() => {
    document.documentElement.dataset.theme = scheme;
    document.getElementById("theme-color")?.setAttribute("content", palettes[scheme].chrome);
  }, [scheme]);
}
