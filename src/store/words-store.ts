import { create } from "zustand";
import type { BulkInsertResult, Word, WordInput } from "@shared/word";
import { getErrorMessage } from "@/api/client";
import {
  createWordRequest,
  fetchWordsRequest,
  importWordsRequest,
  updateWordRequest,
} from "@/api/words-api";

type LoadStatus = "idle" | "loading" | "ready" | "error";

type WordsState = {
  words: Word[];
  status: LoadStatus;
  error: string | null;
  /** Bumped after every add / edit / import so server-paged views refetch. */
  revision: number;
  /** Loads once; pass `force` to refetch. */
  load: (force?: boolean) => Promise<void>;
  addWord: (input: WordInput) => Promise<Word>;
  updateWord: (id: string, input: WordInput) => Promise<Word>;
  importWords: (inputs: WordInput[]) => Promise<BulkInsertResult>;
};

export const useWordsStore = create<WordsState>((set, get) => {
  /** Saving related words also changes the other family members — refetch quietly. */
  const refreshSilently = async () => {
    try {
      const { words } = await fetchWordsRequest();
      set({ words });
    } catch {
      // keep the optimistic list; next load will retry
    }
  };

  return {
    words: [],
    status: "idle",
    error: null,
    revision: 0,

    load: async (force = false) => {
      const { status } = get();
      if (status === "loading" || (status === "ready" && !force)) return;
      set({ status: "loading", error: null });
      try {
        const { words } = await fetchWordsRequest();
        set({ words, status: "ready" });
      } catch (error) {
        set({ status: "error", error: getErrorMessage(error, "Could not load words") });
      }
    },

    addWord: async (input) => {
      const { word } = await createWordRequest(input);
      set((state) => ({ words: [word, ...state.words], revision: state.revision + 1 }));
      if (input.relatedWordIds.length > 0) await refreshSilently();
      return word;
    },

    updateWord: async (id, input) => {
      const { word } = await updateWordRequest(id, input);
      set((state) => ({
        words: state.words.map((item) => (item.id === id ? word : item)),
        revision: state.revision + 1,
      }));
      await refreshSilently();
      return word;
    },

    importWords: async (inputs) => {
      const result = await importWordsRequest(inputs);
      set((state) => ({ words: [...result.inserted, ...state.words], revision: state.revision + 1 }));
      return result;
    },
  };
});

/** The full list for offline fallbacks: the store's copy when loaded (newest edits), else the cached API. */
export async function getAllWords(): Promise<Word[]> {
  const { status, words } = useWordsStore.getState();
  return status === "ready" ? words : (await fetchWordsRequest()).words;
}
