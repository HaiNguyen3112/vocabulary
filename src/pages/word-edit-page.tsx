import { useParams } from "react-router-dom";
import { WordEditForm } from "@/features/words/word-edit-form";

/** `/vocabulary-management/new` and `/vocabulary-management/:id/edit`. */
export function WordEditPage() {
  const { id } = useParams();
  return <WordEditForm id={id} />;
}
