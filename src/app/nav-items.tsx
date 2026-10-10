import { HomeOutlined, UnorderedListOutlined } from "@ant-design/icons";
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

export const NAV_ITEMS: NavItem[] = [
  { path: ROUTES.study, label: "Vocabulary Studying", icon: <HomeOutlined /> },
  { path: ROUTES.words, label: "Vocabulary Management", icon: <UnorderedListOutlined /> },
];

/** Nav item owning a path (longest prefix wins, so word pages highlight "Management"). */
export function findNavKey(pathname: string): string {
  const matches = NAV_ITEMS.filter(
    (item) => pathname === item.path || pathname.startsWith(`${item.path.replace(/\/$/, "")}/`),
  );
  return matches.sort((a, b) => b.path.length - a.path.length)[0]?.path ?? ROUTES.study;
}
