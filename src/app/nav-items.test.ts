import { describe, expect, it } from "vitest";
import { isPracticeMode } from "@/constants/study-modes";
import { ROUTES, TAB_ITEMS, findNavKey, studyModePath } from "./nav-items";

describe("findNavKey", () => {
  it("keeps study routes under Study", () => {
    expect(findNavKey("/study/review", TAB_ITEMS)).toBe(ROUTES.study);
    expect(findNavKey("/study/flashcards")).toBe(ROUTES.study);
  });
});

describe("studyModePath", () => {
  it("builds the free-practice path", () => {
    expect(studyModePath("cloze")).toBe("/study/cloze");
  });
});

describe("isPracticeMode", () => {
  it("accepts known modes only", () => {
    expect(isPracticeMode("cloze")).toBe(true);
    expect(isPracticeMode("match")).toBe(true);
    expect(isPracticeMode("review")).toBe(false);
    expect(isPracticeMode("nope")).toBe(false);
  });
});
