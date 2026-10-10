import type { ReviewState, WordReview } from "@shared/review";

export type ReviewStatus = {
  label: "New" | "Learning" | "Review";
  next: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const STATE_LABEL: Record<ReviewState, ReviewStatus["label"]> = {
  new: "New",
  learning: "Learning",
  relearning: "Learning",
  review: "Review",
};

function describeNext(dueAt: Date, now: Date): string {
  const remaining = dueAt.getTime() - now.getTime();
  if (remaining <= 0) return "due now";
  if (remaining < DAY_MS) return "next review today";
  const days = Math.ceil(remaining / DAY_MS);
  return `next review in ${days} ${days === 1 ? "day" : "days"}`;
}

/** Learner-facing status of a word: its stage and when it is next due. */
export function describeReviewStatus(review: WordReview | undefined, now: Date): ReviewStatus {
  if (!review) return { label: "New", next: null };
  const label = STATE_LABEL[review.state];
  return { label, next: label === "New" ? null : describeNext(new Date(review.dueAt), now) };
}
