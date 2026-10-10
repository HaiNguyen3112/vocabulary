import { describe, expect, it } from "vitest";
import type { WordReview } from "@shared/review";
import { describeReviewStatus } from "./review-status";

const NOW = new Date("2026-10-10T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;

function review(dueInMs: number, state: WordReview["state"] = "review"): WordReview {
  return {
    wordId: "w1",
    state,
    dueAt: new Date(NOW.getTime() + dueInMs).toISOString(),
    reps: 1,
    lapses: 0,
    firstReviewedAt: NOW.toISOString(),
  };
}

describe("describeReviewStatus", () => {
  it("is New without a review", () => {
    expect(describeReviewStatus(undefined, NOW)).toEqual({ label: "New", next: null });
  });

  it("is due now when overdue", () => {
    expect(describeReviewStatus(review(-24 * HOUR), NOW)).toEqual({ label: "Review", next: "due now" });
  });

  it("rounds days up", () => {
    expect(describeReviewStatus(review(36 * HOUR), NOW).next).toBe("next review in 2 days");
  });

  it("says today under a day", () => {
    expect(describeReviewStatus(review(20 * HOUR), NOW).next).toBe("next review today");
  });

  it("uses singular for exactly one day", () => {
    expect(describeReviewStatus(review(24 * HOUR), NOW).next).toBe("next review in 1 day");
  });

  it("maps relearning to Learning", () => {
    expect(describeReviewStatus(review(HOUR, "relearning"), NOW).label).toBe("Learning");
  });
});
