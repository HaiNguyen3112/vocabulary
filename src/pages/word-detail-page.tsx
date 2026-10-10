import { useParams } from "react-router-dom";
import { WordDetail } from "@/features/words/word-detail";
import { WordsWorkspace } from "@/features/words/words-workspace";
import { useIsDesktop } from "@/hooks/use-media-query";

/** Desktop: the word opens beside the list (split view). Smaller screens: its own page. */
export function WordDetailPage() {
  const { id = "" } = useParams();
  const isDesktop = useIsDesktop();
  return isDesktop ? <WordsWorkspace selectedId={id} /> : <WordDetail key={id} id={id} />;
}
