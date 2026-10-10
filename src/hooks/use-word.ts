import { fetchWordRequest } from "@/api/words-api";
import { useRemote } from "@/hooks/use-remote";
import { useWordsStore } from "@/store/words-store";

/** One word with its family members; refetches after any add / edit / import. */
export function useWord(id: string) {
  const revision = useWordsStore((state) => state.revision);
  return useRemote(`${id}:${revision}`, (signal) => fetchWordRequest(id, signal), "Could not load the word");
}
