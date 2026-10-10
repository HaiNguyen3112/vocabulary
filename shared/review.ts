export const RATINGS = ["again", "hard", "good", "easy"] as const;
export type Rating = (typeof RATINGS)[number];

export const REVIEW_STATES = ["new", "learning", "review", "relearning"] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

/** Per-learner spaced-repetition state of one word (dates are ISO strings). */
export type WordReview = {
  wordId: string;
  state: ReviewState;
  dueAt: string;
  reps: number;
  lapses: number;
  firstReviewedAt: string;
};

export type ReviewInput = {
  wordId: string;
  rating: Rating;
};

export type ReviewInputResult =
  | { ok: true; value: ReviewInput }
  | { ok: false; error: string };

function toText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function isRating(value: string): value is Rating {
  return (RATINGS as readonly string[]).includes(value);
}

export function parseReviewInput(raw: unknown): ReviewInputResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid payload" };
  }
  const body = raw as Record<string, unknown>;
  const wordId = toText(body.wordId);
  const rating = toText(body.rating);

  if (!wordId) return { ok: false, error: "Missing wordId" };
  if (!isRating(rating)) return { ok: false, error: `Unknown rating "${rating}"` };

  return { ok: true, value: { wordId, rating } };
}
