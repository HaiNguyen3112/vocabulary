import {
  AppstoreOutlined,
  CopyOutlined,
  EditOutlined,
  FormOutlined,
  SoundOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { createElement, type ReactNode } from "react";
import type { ExerciseKind } from "@/lib/exercise";

export const PRACTICE_MODES = ["match", "flashcards", "choice", "type", "listen", "cloze"] as const;

/** Free-practice mode, also the `/study/:mode` path segment. */
export type PracticeMode = (typeof PRACTICE_MODES)[number];

export function isPracticeMode(value: string): value is PracticeMode {
  return (PRACTICE_MODES as readonly string[]).includes(value);
}

/** Exercise used by every word of a practice session (match has its own board). */
export const PRACTICE_KIND: Record<Exclude<PracticeMode, "match">, ExerciseKind> = {
  flashcards: "flashcard",
  choice: "choice",
  type: "type",
  listen: "listen",
  cloze: "cloze",
};

export type StudyModeInfo = {
  mode: PracticeMode;
  label: string;
  description: string;
  icon: ReactNode;
};

export const STUDY_MODES: StudyModeInfo[] = [
  {
    mode: "match",
    label: "Match",
    description: "Pair words with their meanings on a board",
    icon: createElement(AppstoreOutlined),
  },
  {
    mode: "flashcards",
    label: "Flashcards",
    description: "Flip a card, then rate how well you knew it",
    icon: createElement(CopyOutlined),
  },
  {
    mode: "choice",
    label: "Multiple choice",
    description: "Pick the right meaning or word from four options",
    icon: createElement(UnorderedListOutlined),
  },
  {
    mode: "type",
    label: "Type the word",
    description: "Read the meaning and type the word",
    icon: createElement(EditOutlined),
  },
  {
    mode: "listen",
    label: "Listen & spell",
    description: "Hear the word and spell it",
    icon: createElement(SoundOutlined),
  },
  {
    mode: "cloze",
    label: "Fill in the blank",
    description: "Complete an example sentence with the missing word",
    icon: createElement(FormOutlined),
  },
];
