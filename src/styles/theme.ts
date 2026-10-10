import type { ThemeConfig } from "antd";

/** Keep in sync with `_tokens.scss` and docs/DESIGN.md. */
export const brand = {
  primary: "#1677ff",
  background: "#f5f7fb",
} as const;

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: brand.primary,
    colorBgLayout: brand.background,
    borderRadius: 8,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
};
