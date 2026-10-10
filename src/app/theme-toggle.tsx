import { DesktopOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import type { ReactNode } from "react";
import { nextColorSchemePreference, type ColorSchemePreference } from "@/lib/color-scheme";
import { useColorSchemeStore } from "@/store/color-scheme-store";

const LABEL: Record<ColorSchemePreference, string> = { system: "System", light: "Light", dark: "Dark" };
const ICON: Record<ColorSchemePreference, ReactNode> = {
  system: <DesktopOutlined />,
  light: <SunOutlined />,
  dark: <MoonOutlined />,
};

/** Cycles System → Light → Dark. */
export function ThemeToggle() {
  const { preference, setPreference } = useColorSchemeStore();
  const next = nextColorSchemePreference(preference);

  return (
    <Tooltip title={`Theme: ${LABEL[preference]}`}>
      <Button
        type="text"
        shape="circle"
        icon={ICON[preference]}
        aria-label={`Theme: ${LABEL[preference]}. Switch to ${LABEL[next]}`}
        onClick={() => setPreference(next)}
      />
    </Tooltip>
  );
}
