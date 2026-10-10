import { apiFetch } from "@/api/client";
import type { BulkInsertResult, Word, WordInput } from "@shared/word";

export async function fetchWordsRequest() {
  return apiFetch<{ words: Word[] }>("/api/words");
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
