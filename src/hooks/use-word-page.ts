import { isNetworkError } from "@/api/client";
import { fetchWordPageRequest, fetchWordsRequest, type WordPageParams } from "@/api/words-api";
import { useRemote } from "@/hooks/use-remote";
import { buildWordPage } from "@/lib/word-page-local";
import { useWordsStore } from "@/store/words-store";

/**
 * One server-side page of the word list; refetches after any add / edit / import.
 * Offline, the page is rebuilt from the full list (served from the service worker cache).
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
        return buildWordPage((await fetchWordsRequest()).words, params);
      }
    },
    "Could not load words",
  );
}
