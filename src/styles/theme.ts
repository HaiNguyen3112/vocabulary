import { theme, type ThemeConfig } from "antd";
import type { ColorScheme } from "@/lib/color-scheme";

/** Keep in sync with the CSS variables in `index.scss` and docs/DESIGN.md. */
export type Palette = {
  bg: string;
  surface: string;
  chrome: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  word: string;
  definition: string;
  cardSelected: string;
  cardRule: string;
  cardMargin: string;
  correct: string;
  wrong: string;
};

export const palettes: Record<ColorScheme, Palette> = {
  light: {
    bg: "#e9edf3",
    surface: "#ffffff",
    chrome: "#ffffff",
    border: "#d2dae6",
    text: "#24324d",
    textMuted: "#6a778f",
    primary: "#1d3a8a",
    word: "#1d3a8a",
    definition: "#34405a",
    cardSelected: "#eef2fd",
    cardRule: "#e3e9f4",
    cardMargin: "#f2b8c2",
    correct: "#cfe9d9",
    wrong: "#f8d4d8",
  },
  dark: {
    bg: "#121722",
    surface: "#1b2232",
    chrome: "#161c29",
    border: "#2c3549",
    text: "#dbe3f4",
    textMuted: "#8d99b3",
    primary: "#8fa8ff",
    word: "#b9c9ff",
    definition: "#c3cbe0",
    cardSelected: "#232d47",
    cardRule: "#232c40",
    cardMargin: "#6b3a48",
    correct: "#1f4a35",
    wrong: "#4f2630",
  },
};

export const fonts = {
  body: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  display: "'Literata', Georgia, 'Times New Roman', serif",
} as const;

function buildTheme(scheme: ColorScheme): ThemeConfig {
  const palette = palettes[scheme];
  return {
    algorithm: scheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: palette.primary,
      colorLink: palette.primary,
      // Progress bars (and info alerts / messages) use colorInfo — keep them ink blue, not antd blue.
      colorInfo: palette.primary,
      colorBgLayout: palette.bg,
      colorBgContainer: palette.surface,
      colorBgElevated: palette.surface,
      colorBorder: palette.border,
      colorText: palette.text,
      colorTextSecondary: palette.textMuted,
      borderRadius: 4,
      fontFamily: fonts.body,
      // Dark primary is light — keep text on primary buttons dark enough to read.
      ...(scheme === "dark" && { colorTextLightSolid: "#0f1420" }),
    },
    components: {
      Table: { headerBg: palette.bg, rowHoverBg: palette.cardSelected },
      // Detail drawer sits on the desk colour so its index cards stand out.
      Drawer: { colorBgElevated: palette.bg },
      // The dark override above would put dark text on the tooltip's grey — keep tooltips light-on-dark.
      ...(scheme === "dark" && { Tooltip: { colorTextLightSolid: "#ffffff" } }),
    },
  };
}

export const appThemes: Record<ColorScheme, ThemeConfig> = {
  light: buildTheme("light"),
  dark: buildTheme("dark"),
};
