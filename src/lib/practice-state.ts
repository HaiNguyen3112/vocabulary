import { isCategory } from "@shared/categories";
import type { Word, WordInput } from "@shared/word";
import { ALL_CATEGORIES, type CategoryFilter } from "@/constants/categories";

/**
 * Router state handed to the study hub and its routes (and back): the hub's filter + a temporary deck —
 * an uploaded file or a list picked elsewhere (e.g. Progress). Deck words have no id, so nothing is recorded.
 */
export type PracticeState = {
  category: CategoryFilter;
  fileDeck: WordInput[] | null;
  /** Shown on the hub instead of "Studying file". */
  deckLabel: string | null;
};

/** Missing / unknown router state (reload, deep link) → word bank, all categories. */
export function readPracticeState(state: unknown): PracticeState {
  if (!state || typeof state !== "object") return { category: ALL_CATEGORIES, fileDeck: null, deckLabel: null };
  const { category, fileDeck, deckLabel } = state as Record<string, unknown>;
  const deck = Array.isArray(fileDeck) ? (fileDeck as WordInput[]) : null;
  return {
    category: isCategory(category) ? category : ALL_CATEGORIES,
    fileDeck: deck,
    deckLabel: deck && typeof deckLabel === "string" && deckLabel ? deckLabel : null,
  };
}

/** Bank words as a practice-only deck: ids are dropped so answers never reach the scheduler. */
export function toPracticeDeck(words: readonly Word[], deckLabel: string): PracticeState {
  return {
    category: ALL_CATEGORIES,
    fileDeck: words.map(({ word, category, senses, relatedWordIds }) => ({ word, category, senses, relatedWordIds })),
    deckLabel,
  };
}
