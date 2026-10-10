import { fetchWordPageRequest, type WordPageParams } from "@/api/words-api";
import { useRemote } from "@/hooks/use-remote";
import { useWordsStore } from "@/store/words-store";

/** One server-side page of the word list; refetches after any add / edit / import. */
export function useWordPage(params: WordPageParams) {
  const revision = useWordsStore((state) => state.revision);
  const key = JSON.stringify({ ...params, revision });
  return useRemote(key, (signal) => fetchWordPageRequest(params, signal), "Could not load words");
}
