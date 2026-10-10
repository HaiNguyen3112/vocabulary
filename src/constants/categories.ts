import { CATEGORIES, type Category } from "@shared/categories";

export const CATEGORY_LABEL: Record<Category, string> = {
  DINNINGOUT: "Dinning Out",
  ENTERTAINMENT: "Entertainment",
  GENERAL_BUSINESS: "General Business",
  MANUFACTURING: "Manufacturing",
  OFFICES: "Offices",
  PERSONAL: "Personal",
  PURCHASING: "Purchasing",
  TECHNOLOGY: "Technology",
  TRAVEL: "Travel",
  PHRASAL_VERB: "Phrasal verb",
  IDIOM: "Idiom",
  LINKING_WORD: "Linking word",
  OTHER: "Other",
};

/** Ant Design preset tag colours. */
export const CATEGORY_COLOR: Record<Category, string> = {
  DINNINGOUT: "blue",
  ENTERTAINMENT: "purple",
  GENERAL_BUSINESS: "cyan",
  MANUFACTURING: "green",
  OFFICES: "magenta",
  PERSONAL: "pink",
  PURCHASING: "red",
  TECHNOLOGY: "orange",
  TRAVEL: "gold",
  PHRASAL_VERB: "volcano",
  IDIOM: "geekblue",
  LINKING_WORD: "lime",
  OTHER: "default",
};

/** Empty value = no category filter. */
export const ALL_CATEGORIES = "";
export type CategoryFilter = Category | typeof ALL_CATEGORIES;

export const CATEGORY_OPTIONS = CATEGORIES.map((category) => ({
  value: category,
  label: CATEGORY_LABEL[category],
}));

export const CATEGORY_FILTER_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: ALL_CATEGORIES, label: "All" },
  ...CATEGORY_OPTIONS,
];
