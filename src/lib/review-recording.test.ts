import { describe, expect, it } from "vitest";
import { shouldRecordReview } from "./review-recording";

describe("shouldRecordReview", () => {
  it("records a bank word's first answer online", () => {
    expect(shouldRecordReview("w1", true, true)).toBe(true);
  });

  it("never records offline", () => {
    expect(shouldRecordReview("w1", true, false)).toBe(false);
  });

  it("never records file-deck words", () => {
    expect(shouldRecordReview(null, true, true)).toBe(false);
  });

  it("never records a repeat attempt", () => {
    expect(shouldRecordReview("w1", false, true)).toBe(false);
  });
});
