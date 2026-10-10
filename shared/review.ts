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
  /** Days until recall probability drops to 90%. */
  stability: number;
  /** 1 (easy) – 10 (hard), for this learner. */
  difficulty: number;
  firstReviewedAt: string;
};

/** A word in `review` state with at least this stability counts as mastered. */
export const MATURE_STABILITY_DAYS = 21;

export function isMastered(state: ReviewState, stability: number): boolean {
  return state === "review" && stability >= MATURE_STABILITY_DAYS;
}

/** One local calendar day of review history. `mastered` is null before history starts. */
export type ActivityDay = {
  date: string;
  reviews: number;
  mastered: number | null;
};

export type Activity = {
  /** First logged answer (ISO); null when there is no history yet. */
  since: string | null;
  /** Oldest first, today last. */
  days: ActivityDay[];
  /** Answers on words already in `review` state over the last 30 days; passed = not rated "again". */
  retention: { passed: number; total: number };
  streak: { current: number; longest: number };
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
