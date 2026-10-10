import type { Rating } from "@shared/review";

export type Grade = "correct" | "close" | "wrong";

const MIN_CLOSE_LENGTH = 5;

/** Trims, lowercases, collapses whitespace and strips trailing punctuation. */
export function normalizeAnswer(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:]+$/, "")
    .trim();
}

/** True when the strings differ by exactly one insertion, deletion or substitution. */
function isOneEditApart(a: string, b: string): boolean {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  return shorter.slice(i) === longer.slice(i + 1);
}

export function gradeAnswer(input: string, answer: string): Grade {
  const given = normalizeAnswer(input);
  const expected = normalizeAnswer(answer);
  if (!given) return "wrong";
  if (given === expected) return "correct";
  if (expected.length >= MIN_CLOSE_LENGTH && isOneEditApart(given, expected)) return "close";
  return "wrong";
}

export function gradeToRating(grade: Grade): Rating {
  if (grade === "correct") return "good";
  if (grade === "close") return "hard";
  return "again";
}

/** Flashcard self-rating → grade: again is wrong, hard is close, good / easy are correct. */
export function ratingToGrade(rating: Rating): Grade {
  switch (rating) {
    case "again":
      return "wrong";
    case "hard":
      return "close";
    case "good":
    case "easy":
      return "correct";
  }
}
