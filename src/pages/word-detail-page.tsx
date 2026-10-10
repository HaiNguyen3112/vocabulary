import { useParams } from "react-router-dom";
import { WordDetail } from "@/features/words/word-detail";

export function WordDetailPage() {
  const { id = "" } = useParams();
  return <WordDetail key={id} id={id} />;
}
