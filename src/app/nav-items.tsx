import { PlusCircleOutlined, ReadOutlined, UnorderedListOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";

export const ROUTES = {
  study: "/",
  words: "/vocabulary-management",
  wordNew: "/vocabulary-management/new",
  wordDetail: "/vocabulary-management/:id",
  wordEdit: "/vocabulary-management/:id/edit",
} as const;

export const wordDetailPath = (id: string) => `${ROUTES.words}/${encodeURIComponent(id)}`;
export const wordEditPath = (id: string) => `${wordDetailPath(id)}/edit`;

export type NavItem = {
  path: string;
  label: string;
  icon: ReactNode;
};

/** Desktop top-bar links. */
export const NAV_ITEMS: NavItem[] = [
  { path: ROUTES.study, label: "Study", icon: <ReadOutlined /> },
  { path: ROUTES.words, label: "Words", icon: <UnorderedListOutlined /> },
];

/** Mobile bottom tabs — adds a shortcut to the new-word form. */
export const TAB_ITEMS: NavItem[] = [
  ...NAV_ITEMS,
  { path: ROUTES.wordNew, label: "Add", icon: <PlusCircleOutlined /> },
];

/** Item owning a path (longest prefix wins, so word pages highlight "Words"). */
export function findNavKey(pathname: string, items: readonly NavItem[] = NAV_ITEMS): string {
  const matches = items.filter(
    (item) => pathname === item.path || pathname.startsWith(`${item.path.replace(/\/$/, "")}/`),
  );
  return matches.sort((a, b) => b.path.length - a.path.length)[0]?.path ?? ROUTES.study;
}
