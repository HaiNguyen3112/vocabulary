import type { Category } from "../../shared/categories";
import type { WordSense } from "../../shared/word";

export type WordDoc = {
  _id: string;
  word: string;
  /** normalizeWordKey(word) — indexed, used for duplicate checks */
  wordKey: string;
  category: Category;
  senses: WordSense[];
  /** Words sharing a familyId are related to each other. Absent = no family. */
  familyId?: string;
  createdAt: Date;
  updatedAt?: Date;
};

/** Shape before the senses migration (scripts/migrate-word-senses.ts). */
export type LegacyWordDoc = Omit<WordDoc, "senses"> & { definition: string };
