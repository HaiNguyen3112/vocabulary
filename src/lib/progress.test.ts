import { describe, expect, it } from "vitest";
import type { ActivityDay, WordReview } from "@shared/review";
import {
  countBuckets,
  findStrugglingWords,
  formatDayLabel,
  heatLevel,
  niceMax,
  monthLabel,
  progressBucket,
  retentionPercent,
  toWeekColumns,
} from "./progress";

function r(over: Partial<WordReview> = {}): WordReview {
  return {
    wordId: "x",
    state: "review",
    dueAt: "2026-10-10T00:00:00.000Z",
    reps: 3,
    lapses: 0,
    stability: 5,
    difficulty: 5,
    firstReviewedAt: "2026-10-01T00:00:00.000Z",
    ...over,
  };
}

describe("progressBucket", () => {
  it("classifies by state and stability", () => {
    expect(progressBucket(undefined)).toBe("unstudied");
    expect(progressBucket(r({ state: "learning" }))).toBe("learning");
    expect(progressBucket(r({ state: "relearning", stability: 50 }))).toBe("learning");
    expect(progressBucket(r({ stability: 20.9 }))).toBe("known");
    expect(progressBucket(r({ stability: 21 }))).toBe("mastered");
  });
});

describe("countBuckets", () => {
  it("counts every word once, ignoring reviews of deleted words", () => {
    const words = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const byWordId = { a: r({ stability: 30 }), b: r({ state: "learning" }), gone: r() };
    expect(countBuckets(words, byWordId)).toEqual({ unstudied: 1, learning: 1, known: 0, mastered: 1 });
  });
});

describe("findStrugglingWords", () => {
  it("keeps lapsed or hard words, most lapses first, then hardest", () => {
    const words = ["a", "b", "c", "d", "e"].map((id) => ({ id }));
    const byWordId = {
      a: r({ lapses: 2, difficulty: 5 }),
      b: r({ lapses: 1, difficulty: 9 }),
      c: r({ lapses: 1, difficulty: 6 }), // neither
      d: r({ lapses: 4, difficulty: 7 }),
      e: r({ lapses: 2, difficulty: 8.5 }),
    };
    const ids = findStrugglingWords(words, byWordId, 10).map((item) => item.word.id);
    expect(ids).toEqual(["d", "e", "a", "b"]);
    expect(findStrugglingWords(words, byWordId, 2)).toHaveLength(2);
  });
});

describe("retentionPercent", () => {
  it("rounds, and is null without answers", () => {
    expect(retentionPercent({ passed: 2, total: 3 })).toBe(67);
    expect(retentionPercent({ passed: 0, total: 0 })).toBeNull();
  });
});

describe("heatLevel", () => {
  it("maps counts onto 0 + 4 steps relative to the busiest day", () => {
    expect(heatLevel(0, 20)).toBe(0);
    expect(heatLevel(1, 20)).toBe(1);
    expect(heatLevel(10, 20)).toBe(2);
    expect(heatLevel(20, 20)).toBe(4);
    expect(heatLevel(0, 0)).toBe(0);
  });
});

describe("toWeekColumns", () => {
  const day = (date: string): ActivityDay => ({ date, reviews: 0, mastered: null });

  it("starts columns on Monday and pads the first and last week", () => {
    // 2026-10-07 is a Wednesday, 2026-10-13 a Tuesday.
    const days = ["07", "08", "09", "10", "11", "12", "13"].map((d) => day(`2026-10-${d}`));
    const columns = toWeekColumns(days);
    expect(columns).toHaveLength(2);
    expect(columns[0]?.map((cell) => cell?.date ?? null)).toEqual([
      null,
      null,
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
    expect(columns[1]?.map((cell) => cell?.date ?? null)).toEqual([
      "2026-10-12",
      "2026-10-13",
      null,
      null,
      null,
      null,
      null,
    ]);
  });
});

describe("formatDayLabel / monthLabel", () => {
  it("formats Vietnamese short day labels", () => {
    expect(formatDayLabel("2026-10-10")).toBe("T7, 10/10");
    expect(formatDayLabel("2026-10-12")).toBe("T2, 12/10");
    expect(formatDayLabel("2026-10-11")).toBe("CN, 11/10");
  });

  it("labels the column holding the 1st of a month", () => {
    const day = (date: string): ActivityDay => ({ date, reviews: 0, mastered: null });
    expect(monthLabel([null, day("2026-09-30"), day("2026-10-01")])).toBe("Th10");
    expect(monthLabel([day("2026-10-02"), null])).toBeNull();
  });
});

describe("niceMax", () => {
  it("rounds up to 5, 10, 20, 50…", () => {
    expect(niceMax(0)).toBe(5);
    expect(niceMax(5)).toBe(5);
    expect(niceMax(6)).toBe(10);
    expect(niceMax(37)).toBe(50);
    expect(niceMax(120)).toBe(200);
  });
});
