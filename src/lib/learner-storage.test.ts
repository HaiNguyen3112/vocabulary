import { describe, expect, it } from "vitest";
import { parseStoredLearner } from "@/lib/learner-storage";

describe("parseStoredLearner", () => {
  it("returns the learner for valid JSON", () => {
    const learner = { id: "1", userId: "ann", name: "Ann" };
    expect(parseStoredLearner(JSON.stringify(learner))).toEqual(learner);
  });

  it("rejects null, malformed JSON and missing fields", () => {
    expect(parseStoredLearner(null)).toBeNull();
    expect(parseStoredLearner("{")).toBeNull();
    expect(parseStoredLearner('{"id":"1"}')).toBeNull();
  });
});
