import { describe, expect, it } from "vitest";
import { normalizeUserIdKey, parseLearnerInput } from "./learner";

describe("parseLearnerInput", () => {
  it("trims and lowercases the user id, trims the name", () => {
    expect(parseLearnerInput({ userId: "  Hai.Nguyen ", name: " Hải " })).toEqual({
      ok: true,
      value: { userId: "hai.nguyen", name: "Hải" },
    });
  });

  it("rejects invalid user ids", () => {
    expect(parseLearnerInput({ userId: "ab", name: "x" }).ok).toBe(false);
    expect(parseLearnerInput({ userId: "hai nguyen", name: "x" }).ok).toBe(false);
  });

  it("rejects empty or too long names", () => {
    expect(parseLearnerInput({ userId: "hai", name: "   " }).ok).toBe(false);
    expect(parseLearnerInput({ userId: "hai", name: "x".repeat(51) }).ok).toBe(false);
  });

  it("rejects non-objects", () => {
    expect(parseLearnerInput(null).ok).toBe(false);
  });
});

describe("normalizeUserIdKey", () => {
  it("trims and lowercases", () => {
    expect(normalizeUserIdKey(" HAI ")).toBe("hai");
  });
});
