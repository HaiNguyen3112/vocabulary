import { describe, expect, it } from "vitest";
import { gradeAnswer, gradeToRating, normalizeAnswer } from "./grade-answer";

describe("normalizeAnswer", () => {
  it("trims, lowercases, collapses whitespace and strips trailing punctuation", () => {
    expect(normalizeAnswer("  Take   Off!? ")).toBe("take off");
  });
});

describe("gradeAnswer", () => {
  it("accepts exact matches after normalising", () => {
    expect(gradeAnswer("Take  off.", "take off")).toBe("correct");
    expect(gradeAnswer("  PRODUCE ", "produce")).toBe("correct");
  });

  it("marks a single typo as close", () => {
    expect(gradeAnswer("produse", "produce")).toBe("close");
    expect(gradeAnswer("prodce", "produce")).toBe("close");
    expect(gradeAnswer("produced", "produce")).toBe("close");
  });

  it("does not allow close for short words", () => {
    expect(gradeAnswer("cst", "cat")).toBe("wrong");
  });

  it("marks distance 2 or more as wrong", () => {
    expect(gradeAnswer("prodeuc", "produce")).toBe("wrong");
  });

  it("marks empty input as wrong", () => {
    expect(gradeAnswer("", "produce")).toBe("wrong");
    expect(gradeAnswer("  ", "produce")).toBe("wrong");
  });
});

describe("gradeToRating", () => {
  it("maps grades to ratings", () => {
    expect(gradeToRating("correct")).toBe("good");
    expect(gradeToRating("close")).toBe("hard");
    expect(gradeToRating("wrong")).toBe("again");
  });
});
