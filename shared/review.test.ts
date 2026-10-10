import { describe, expect, it } from "vitest";
import { parseReviewInput } from "./review";

describe("parseReviewInput", () => {
  it("accepts a valid review", () => {
    expect(parseReviewInput({ wordId: "w1", rating: "good" })).toEqual({
      ok: true,
      value: { wordId: "w1", rating: "good" },
    });
  });

  it("rejects unknown ratings", () => {
    expect(parseReviewInput({ wordId: "w1", rating: "perfect" }).ok).toBe(false);
  });

  it("rejects missing wordId", () => {
    expect(parseReviewInput({ wordId: "", rating: "good" }).ok).toBe(false);
    expect(parseReviewInput({ rating: "good" }).ok).toBe(false);
  });
});
