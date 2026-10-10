import { ApiError, isNetworkError } from "@/api/client";
import { fetchWordRequest, fetchWordsRequest } from "@/api/words-api";
import { useRemote } from "@/hooks/use-remote";
import { buildWordWithRelated } from "@/lib/word-page-local";
import { useWordsStore } from "@/store/words-store";

/**
 * One word with its family members; refetches after any add / edit / import.
 * Offline, it is looked up in the full list (served from the service worker cache).
 */
export function useWord(id: string) {
  const revision = useWordsStore((state) => state.revision);
  return useRemote(
    `${id}:${revision}`,
    async (signal) => {
      try {
        return await fetchWordRequest(id, signal);
      } catch (error) {
        if (!isNetworkError(error)) throw error;
        const result = buildWordWithRelated((await fetchWordsRequest()).words, id);
        if (!result) throw new ApiError(404, "Word not found");
        return result;
      }
    },
    "Could not load the word",
  );
}
