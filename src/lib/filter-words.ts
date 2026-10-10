import type { WordInput } from "@shared/word";
import { ALL_CATEGORIES, type CategoryFilter } from "@/constants/categories";

export type WordFilter = {
  search: string;
  category: CategoryFilter;
};

/** Searches the word, its definitions and its example sentences. */
export function filterWords<T extends WordInput>(words: readonly T[], filter: WordFilter): T[] {
  const search = filter.search.trim().toLowerCase();
  return words.filter((word) => {
    if (filter.category !== ALL_CATEGORIES && word.category !== filter.category) return false;
    if (!search) return true;
    return (
      word.word.toLowerCase().includes(search) ||
      word.senses.some(
        (sense) =>
          sense.definition.toLowerCase().includes(search) ||
          sense.examples.some((example) => example.toLowerCase().includes(search)),
      )
    );
  });
}
