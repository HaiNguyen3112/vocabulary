import type { Category } from "../../shared/categories";
import type { WordSense } from "../../shared/word";
import type { StoredCard } from "../services/scheduler";

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

export type LearnerDoc = {
  _id: string;
  /** Lowercased user id as entered. */
  userId: string;
  /** normalizeUserIdKey(userId) — unique index */
  userIdKey: string;
  name: string;
  createdAt: Date;
};

export type ReviewDoc = {
  _id: string;
  learnerId: string;
  wordId: string;
  card: StoredCard;
  dueAt: Date;
  firstReviewedAt: Date;
  updatedAt: Date;
};
