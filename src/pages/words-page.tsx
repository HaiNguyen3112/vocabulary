import { useParams } from "react-router-dom";
import { WordsWorkspace } from "@/features/words/words-workspace";

/**
 * `/vocabulary-management` and `/vocabulary-management/:id`. One component for both routes so the
 * list (scroll, focus, import preview) stays mounted while a word opens beside it (≥992px) or in a drawer.
 */
export function WordsPage() {
  const { id } = useParams();
  return <WordsWorkspace selectedId={id} />;
}
