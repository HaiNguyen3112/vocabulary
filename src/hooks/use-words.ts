import { useEffect } from "react";
import { useWordsStore } from "@/store/words-store";

/** Subscribes to the words cache and loads it from the API on first use. */
export function useWords() {
  const words = useWordsStore((state) => state.words);
  const status = useWordsStore((state) => state.status);
  const error = useWordsStore((state) => state.error);
  const load = useWordsStore((state) => state.load);

  useEffect(() => {
    void load();
  }, [load]);

  return { words, isLoading: status === "loading" || status === "idle", error, reload: () => load(true) };
}
