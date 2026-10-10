import { useLocation, useNavigate } from "react-router-dom";
import type { Word, WordInput } from "@shared/word";
import { ROUTES } from "@/app/nav-items";
import type { StudyWord } from "@/lib/exercise";
import { readPracticeState, type PracticeState } from "@/lib/practice-state";

export function usePracticeState(): PracticeState {
  return readPracticeState(useLocation().state);
}

/** Back to the hub, keeping its category + file deck; replaces the session entry so Back skips it. */
export function useBackToHub(): () => void {
  const navigate = useNavigate();
  const { state } = useLocation();
  return () => navigate(ROUTES.study, { state: readPracticeState(state), replace: true });
}

/** Bank words keep their id (reviews are recorded); file-deck words get `id: null` (never recorded). */
export function toStudyWord(word: Word | WordInput): StudyWord {
  return {
    id: "id" in word ? word.id : null,
    word: word.word,
    category: word.category,
    senses: word.senses,
  };
}
