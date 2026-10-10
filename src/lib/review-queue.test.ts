import { describe, expect, it } from "vitest";
import type { WordReview } from "@shared/review";
import type { StudyWord } from "./exercise";
import { buildReviewQueue, countNewToday, pickExerciseKind, todayStats } from "./review-queue";

const now = new Date(2026, 9, 10, 12, 0);
const DAY = 86_400_000;

function w(id: string | null, word: string, example = ""): StudyWord {
  return {
    id,
    word,
    category: "OTHER",
    senses: [{ partOfSpeech: null, definition: "m", examples: example ? [example] : [] }],
  };
}

function r(over: Partial<WordReview> = {}): WordReview {
  return {
    wordId: "x",
    state: "review",
    dueAt: now.toISOString(),
    reps: 1,
    lapses: 0,
    stability: 5,
    difficulty: 5,
    firstReviewedAt: now.toISOString(),
    ...over,
  };
}

const due = (id: string, days: number, over: Partial<WordReview> = {}) =>
  r({ wordId: id, dueAt: new Date(now.getTime() + days * DAY).toISOString(), ...over });

const words = [w("w1", "one"), w("w2", "two"), w("w3", "three"), w("n1", "alpha"), w("n2", "beta"), w("n3", "gamma"), w(null, "file")];
const byId = { w1: due("w1", -1), w2: due("w2", -2), w3: due("w3", 1) };

describe("countNewToday", () => {
  it("uses the local calendar day", () => {
    const n = new Date(2026, 9, 10, 0, 1);
    expect(
      countNewToday(
        [
          r({ firstReviewedAt: new Date(2026, 9, 9, 23, 59).toISOString() }),
          r({ firstReviewedAt: new Date(2026, 9, 10, 0, 0).toISOString() }),
        ],
        n,
      ),
    ).toBe(1);
  });
});

describe("buildReviewQueue", () => {
  it("orders due words then adds capped new words", () => {
    const q = buildReviewQueue(words, byId, now, 2, 20);
    expect(q.slice(0, 2).map((x) => x.id)).toEqual(["w2", "w1"]);
    expect(q.filter((x) => x.id && !byId[x.id as keyof typeof byId])).toHaveLength(2);
    expect(q.map((x) => x.id)).not.toContain("w3");
    expect(q.map((x) => x.id)).not.toContain(null);
  });

  it("respects size and zero allowance", () => {
    expect(buildReviewQueue(words, byId, now, 10, 1)).toHaveLength(1);
    expect(buildReviewQueue(words, byId, now, 0, 20)).toHaveLength(2);
    expect(buildReviewQueue(words, byId, now, -1, 20)).toHaveLength(2);
  });

  it("skips duplicate new words", () => {
    const dup = [w("a", "Same"), w("b", "same")];
    expect(buildReviewQueue(dup, {}, now, 5, 20)).toHaveLength(1);
  });
});

describe("pickExerciseKind", () => {
  it("uses choice for new and learning words", () => {
    expect(pickExerciseKind(undefined, w("a", "a"))).toBe("choice");
    expect(pickExerciseKind(r({ state: "learning" }), w("a", "a"))).toBe("choice");
    expect(pickExerciseKind(r({ state: "relearning" }), w("a", "a"))).toBe("choice");
  });

  it("rotates for review words and falls back from cloze", () => {
    const x = w("a", "run", "I run daily.");
    expect(pickExerciseKind(r({ reps: 3 }), x)).toBe("type");
    expect(pickExerciseKind(r({ reps: 4 }), x)).toBe("listen");
    expect(pickExerciseKind(r({ reps: 5 }), x)).toBe("cloze");
    expect(pickExerciseKind(r({ reps: 5 }), w("a", "run"))).toBe("type");
  });
});

describe("todayStats", () => {
  it("counts due, learned and remaining new words", () => {
    const stats = todayStats(words, { ...byId, gone: due("gone", -1) }, now);
    expect(stats).toEqual({ due: 2, newLeft: 3, learned: 3 });
  });

  it("limits new words by the daily allowance and unreviewed count", () => {
    const stats = todayStats(words, { w1: due("w1", 1, { firstReviewedAt: now.toISOString() }) }, now);
    expect(stats.newLeft).toBe(5);
  });
});
