import { useParams } from "react-router-dom";
import { WordDetail } from "@/features/words/word-detail";
import { WordsWorkspace } from "@/features/words/words-workspace";
import { useIsDesktop } from "@/hooks/use-media-query";

/**
 * `/vocabulary-management` and `/vocabulary-management/:id`. One component for both routes so the
 * desktop split view keeps its list (scroll, focus, import preview) when a word opens or closes.
 * Below 992px a word gets its own page.
 */
export function WordsPage() {
  const { id } = useParams();
  const isDesktop = useIsDesktop();
  if (id && !isDesktop) return <WordDetail key={id} id={id} />;
  return <WordsWorkspace selectedId={id} />;
}
