import { isNetworkError } from "@/api/client";
import { fetchWordPageRequest, type WordPageParams } from "@/api/words-api";
import { useRemote } from "@/hooks/use-remote";
import { buildWordPage } from "@/lib/word-page-local";
import { getAllWords, useWordsStore } from "@/store/words-store";

/**
 * One server-side page of the word list; refetches after any add / edit / import.
 * Offline, the page is rebuilt from the full list (store copy or service worker cache).
 */
export function useWordPage(params: WordPageParams) {
  const revision = useWordsStore((state) => state.revision);
  const key = JSON.stringify({ ...params, revision });
  return useRemote(
    key,
    async (signal) => {
      try {
        return await fetchWordPageRequest(params, signal);
      } catch (error) {
        if (!isNetworkError(error)) throw error;
        return buildWordPage(await getAllWords(), params);
      }
    },
    "Could not load words",
  );
}
