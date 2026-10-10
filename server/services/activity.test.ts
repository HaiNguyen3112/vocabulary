import { describe, expect, it } from "vitest";
import type { Rating, ReviewState } from "../../shared/review";
import { buildActivity, isValidTimeZone, type ActivityCard, type ActivityLog } from "./activity";

const TZ = "Asia/Ho_Chi_Minh"; // UTC+7
const now = new Date("2026-10-10T05:00:00Z"); // 12:00 local, 10 Oct

function log(
  reviewedAt: string,
  rating: Rating = "good",
  before: [ReviewState, number] = ["review", 5],
  after: [ReviewState, number] = ["review", 10],
  wordId = "w1",
): ActivityLog {
  return {
    wordId,
    rating,
    stateBefore: before[0],
    stabilityBefore: before[1],
    stateAfter: after[0],
    stabilityAfter: after[1],
    reviewedAt: new Date(reviewedAt),
  };
}

function build(logs: ActivityLog[], cards: ActivityCard[] = [], days = 7) {
  return buildActivity({ logs, cards, now, timeZone: TZ, days });
}

describe("buildActivity", () => {
  it("returns an empty history with no logs", () => {
    const activity = build([]);
    expect(activity.since).toBeNull();
    expect(activity.days).toHaveLength(7);
    expect(activity.days.at(-1)).toEqual({ date: "2026-10-10", reviews: 0, mastered: null });
    expect(activity.days[0]?.date).toBe("2026-10-04");
    expect(activity.retention).toEqual({ passed: 0, total: 0 });
    expect(activity.streak).toEqual({ current: 0, longest: 0 });
  });

  it("buckets answers by the learner's local day", () => {
    // 18:00Z on 9 Oct is 01:00 on 10 Oct in UTC+7.
    const activity = build([log("2026-10-09T16:00:00Z"), log("2026-10-09T18:00:00Z")]);
    expect(activity.days.at(-2)?.reviews).toBe(1);
    expect(activity.days.at(-1)?.reviews).toBe(1);
  });

  it("counts retention on review-state answers from the last 30 days only", () => {
    const activity = build([
      log("2026-08-01T05:00:00Z", "again"), // too old
      log("2026-10-01T05:00:00Z", "again"),
      log("2026-10-02T05:00:00Z", "hard"),
      log("2026-10-03T05:00:00Z", "good"),
      log("2026-10-04T05:00:00Z", "again", ["learning", 1], ["learning", 1]), // not a review-state answer
    ]);
    expect(activity.retention).toEqual({ passed: 2, total: 3 });
  });

  it("keeps the current streak alive until today ends", () => {
    const activity = build([
      log("2026-10-01T05:00:00Z"),
      log("2026-10-02T05:00:00Z"),
      log("2026-10-03T05:00:00Z"),
      log("2026-10-08T05:00:00Z"),
      log("2026-10-09T05:00:00Z"),
    ]);
    expect(activity.streak).toEqual({ current: 2, longest: 3 });
  });

  it("breaks the streak after a missed day", () => {
    const activity = build([log("2026-10-07T05:00:00Z"), log("2026-10-08T05:00:00Z")]);
    expect(activity.streak).toEqual({ current: 0, longest: 2 });
  });

  it("rebuilds mastered counts backwards from today's cards", () => {
    const activity = build(
      [
        log("2026-10-08T05:00:00Z", "good", ["review", 10], ["review", 25], "w1"), // w1 becomes mastered
        log("2026-10-09T05:00:00Z", "again", ["review", 30], ["relearning", 3], "w2"), // w2 lapses
      ],
      [
        { wordId: "w1", state: "review", stability: 25 },
        { wordId: "w2", state: "relearning", stability: 3 },
        { wordId: "w3", state: "review", stability: 40 },
      ],
    );
    const mastered = Object.fromEntries(activity.days.map((day) => [day.date, day.mastered]));
    expect(activity.since).toBe("2026-10-08T05:00:00.000Z");
    expect(mastered["2026-10-07"]).toBeNull();
    expect(mastered["2026-10-08"]).toBe(3); // w1, w2, w3
    expect(mastered["2026-10-09"]).toBe(2); // w1, w3
    expect(mastered["2026-10-10"]).toBe(2);
  });
});

describe("isValidTimeZone", () => {
  it("accepts IANA zones only", () => {
    expect(isValidTimeZone("Asia/Ho_Chi_Minh")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Mars/Base")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });
});
