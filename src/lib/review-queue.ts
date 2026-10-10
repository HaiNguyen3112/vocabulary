import { normalizeWordKey } from "@shared/word";
import type { WordReview } from "@shared/review";
import { NEW_WORDS_PER_DAY } from "../constants/study";
import { findCloze } from "./build-exercise";
import type { ExerciseKind, StudyWord } from "./exercise";
import { shuffle } from "./shuffle";

const REVIEW_KINDS = ["type", "listen", "cloze"] as const;

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Reviews whose first review happened on `now`'s local calendar day. */
export function countNewToday(reviews: readonly WordReview[], now: Date): number {
  return reviews.filter((review) => isSameLocalDay(new Date(review.firstReviewedAt), now)).length;
}

function isUnreviewed(
  word: StudyWord,
  byWordId: Readonly<Record<string, WordReview>>,
): word is StudyWord & { id: string } {
  return word.id !== null && !byWordId[word.id];
}

/** Due words (oldest first), then up to `newAllowance` random unreviewed words. */
export function buildReviewQueue(
  words: readonly StudyWord[],
  byWordId: Readonly<Record<string, WordReview>>,
  now: Date,
  newAllowance: number,
  size: number,
  random: () => number = Math.random,
): StudyWord[] {
  const nowMs = now.getTime();
  const due = words
    .flatMap((word) => {
      const review = word.id === null ? undefined : byWordId[word.id];
      const dueMs = review ? new Date(review.dueAt).getTime() : Number.NaN;
      return review && dueMs <= nowMs ? [{ word, dueMs }] : [];
    })
    .sort((a, b) => a.dueMs - b.dueMs)
    .map((entry) => entry.word);

  const queue = due.slice(0, Math.max(0, size));
  const seen = new Set(queue.map((word) => normalizeWordKey(word.word)));

  if (newAllowance > 0) {
    let added = 0;
    for (const word of shuffle(words.filter((w) => isUnreviewed(w, byWordId)), random)) {
      if (queue.length >= size || added >= newAllowance) break;
      const key = normalizeWordKey(word.word);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push(word);
      added++;
    }
  }
  return queue;
}

/** Early-stage words get multiple choice; mature words rotate type / listen / cloze. */
export function pickExerciseKind(review: WordReview | undefined, word: StudyWord): ExerciseKind {
  if (!review || review.state !== "review") return "choice";
  const kind = REVIEW_KINDS[review.reps % REVIEW_KINDS.length];
  return kind === "cloze" && !findCloze(word) ? "type" : kind;
}

export function todayStats(
  words: readonly StudyWord[],
  byWordId: Readonly<Record<string, WordReview>>,
  now: Date,
): { due: number; newLeft: number; learned: number } {
  const nowMs = now.getTime();
  let due = 0;
  let learned = 0;
  let unreviewed = 0;
  for (const word of words) {
    if (word.id === null) continue;
    const review = byWordId[word.id];
    if (!review) {
      unreviewed++;
      continue;
    }
    if (new Date(review.dueAt).getTime() <= nowMs) due++;
    if (review.state === "review") learned++;
  }
  const newToday = countNewToday(Object.values(byWordId), now);
  const newLeft = Math.min(Math.max(0, NEW_WORDS_PER_DAY - newToday), unreviewed);
  return { due, newLeft, learned };
}
