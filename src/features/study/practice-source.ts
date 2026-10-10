import { useLocation, useNavigate } from "react-router-dom";
import { isCategory } from "@shared/categories";
import type { Word, WordInput } from "@shared/word";
import { ROUTES } from "@/app/nav-items";
import { ALL_CATEGORIES, type CategoryFilter } from "@/constants/categories";
import type { StudyWord } from "@/lib/exercise";

/** Router state handed from the hub to a study route (and back): the hub's filter + uploaded file deck. */
export type PracticeState = {
  category: CategoryFilter;
  fileDeck: WordInput[] | null;
};

/** Missing / unknown router state (reload, deep link) → word bank, all categories. */
export function readPracticeState(state: unknown): PracticeState {
  if (!state || typeof state !== "object") return { category: ALL_CATEGORIES, fileDeck: null };
  const { category, fileDeck } = state as Record<string, unknown>;
  return {
    category: isCategory(category) ? category : ALL_CATEGORIES,
    fileDeck: Array.isArray(fileDeck) ? (fileDeck as WordInput[]) : null,
  };
}

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
