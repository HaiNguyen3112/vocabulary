export const CATEGORIES = [
  "DINNINGOUT",
  "ENTERTAINMENT",
  "GENERAL_BUSINESS",
  "MANUFACTURING",
  "OFFICES",
  "PERSONAL",
  "PURCHASING",
  "TECHNOLOGY",
  "TRAVEL",
  "PHRASAL_VERB",
  "IDIOM",
  "LINKING_WORD",
  "OTHER",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return (
    typeof value === "string" && (CATEGORIES as readonly string[]).includes(value)
  );
}
