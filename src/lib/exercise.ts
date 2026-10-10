import type { Category } from "@shared/categories";
import type { WordSense } from "@shared/word";

/** A word to study; `id` is null for file-deck words. */
export type StudyWord = {
  id: string | null;
  word: string;
  category: Category;
  senses: WordSense[];
};

export const EXERCISE_KINDS = ["flashcard", "choice", "type", "listen", "cloze"] as const;

export type ExerciseKind = (typeof EXERCISE_KINDS)[number];

export type ChoiceDirection = "word-to-meaning" | "meaning-to-word";

export type Exercise = { word: StudyWord } & (
  | { kind: "flashcard"; front: string; back: string }
  | {
      kind: "choice";
      direction: ChoiceDirection;
      prompt: string;
      options: string[];
      answer: string;
    }
  | { kind: "type"; prompt: string; answer: string }
  | { kind: "listen"; answer: string }
  | { kind: "cloze"; sentence: string; hint: string; answer: string }
);
