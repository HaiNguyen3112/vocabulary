import { apiFetch } from "@/api/client";
import type { BulkInsertResult, Word, WordInput, WordPage, WordWithRelated } from "@shared/word";

export type WordPageParams = {
  search: string;
  /** "" = all categories. */
  category: string;
  page: number;
  pageSize: number;
};

export async function fetchWordsRequest() {
  return apiFetch<{ words: Word[] }>("/api/words");
}

export async function fetchWordPageRequest(params: WordPageParams, signal?: AbortSignal) {
  const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.search.trim()) query.set("q", params.search.trim());
  if (params.category) query.set("category", params.category);
  return apiFetch<WordPage>(`/api/words?${query}`, { signal });
}

export async function fetchWordRequest(id: string, signal?: AbortSignal) {
  return apiFetch<WordWithRelated>(`/api/words/${encodeURIComponent(id)}`, { signal });
}

export async function createWordRequest(input: WordInput) {
  return apiFetch<{ word: Word }>("/api/words", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function importWordsRequest(words: WordInput[]) {
  return apiFetch<BulkInsertResult>("/api/words/bulk", {
    method: "POST",
    body: JSON.stringify({ words }),
  });
}

export async function updateWordRequest(id: string, input: WordInput) {
  return apiFetch<{ word: Word }>(`/api/words/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
