import { describe, expect, it } from "vitest";
import { fsrs } from "ts-fsrs";
import { scheduleReview } from "./scheduler";

const now = new Date("2026-10-10T08:00:00Z");
const engine = fsrs({ enable_fuzz: false });

describe("scheduleReview", () => {
  it("schedules a new card forward and counts the rep", () => {
    const first = scheduleReview(null, "good", now, engine);
    expect(first.reps).toBe(1);
    expect(first.due.getTime()).toBeGreaterThan(now.getTime());
    expect(first.state).not.toBe("new");
    expect(first.last_review).toEqual(now);

    const easy = scheduleReview(null, "easy", now, engine);
    expect(easy.due.getTime()).toBeGreaterThanOrEqual(first.due.getTime());
  });

  it("counts a lapse and relearns when a review card is failed", () => {
    let card = scheduleReview(null, "easy", now, engine);
    for (let i = 0; i < 5 && card.state !== "review"; i += 1) {
      card = scheduleReview(card, "good", new Date(card.due.getTime() + 60_000), engine);
    }
    expect(card.state).toBe("review");
    const lapsed = scheduleReview(card, "again", new Date(card.due.getTime() + 60_000), engine);
    expect(lapsed.lapses).toBe(card.lapses + 1);
    expect(lapsed.state).toBe("relearning");
  });
});
