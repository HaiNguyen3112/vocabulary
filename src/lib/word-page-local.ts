import type { Word, WordPage, WordWithRelated } from "@shared/word";
import type { WordPageParams } from "@/api/words-api";
import type { CategoryFilter } from "@/constants/categories";
import { filterWords } from "@/lib/filter-words";

/** Family members of `rows` that are not in `rows`, in list order. */
function relatedOutside(all: readonly Word[], rows: readonly Word[]): Word[] {
  const rowIds = new Set(rows.map((row) => row.id));
  const wanted = new Set(rows.flatMap((row) => row.relatedWordIds));
  return all.filter((item) => wanted.has(item.id) && !rowIds.has(item.id));
}

/**
 * The server's paged word list, rebuilt from the full list (offline fallback).
 * `all` must already be newest first; a page past the end returns the last page.
 */
export function buildWordPage(all: readonly Word[], params: WordPageParams): WordPage {
  const matches = filterWords(all, { search: params.search, category: params.category as CategoryFilter });
  const total = matches.length;
  const page = Math.min(params.page, Math.max(1, Math.ceil(total / params.pageSize)));
  const start = (page - 1) * params.pageSize;
  const words = matches.slice(start, start + params.pageSize);
  return { words, related: relatedOutside(all, words), total, page, pageSize: params.pageSize };
}

/** One word with its family members, from the full list (offline fallback). */
export function buildWordWithRelated(all: readonly Word[], id: string): WordWithRelated | null {
  const word = all.find((item) => item.id === id);
  return word ? { word, related: relatedOutside(all, [word]) } : null;
}
