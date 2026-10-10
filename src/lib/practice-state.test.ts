import { describe, expect, it } from "vitest";
import type { Word } from "@shared/word";
import { ALL_CATEGORIES } from "@/constants/categories";
import { readPracticeState, toPracticeDeck } from "./practice-state";

const word: Word = {
  id: "w1",
  word: "resilient",
  category: "OTHER",
  senses: [{ partOfSpeech: null, definition: "kiên cường", examples: [] }],
  relatedWordIds: [],
  createdAt: "2026-10-10T00:00:00.000Z",
  updatedAt: null,
};

describe("readPracticeState", () => {
  it("falls back to the word bank for missing or broken state", () => {
    const fallback = { category: ALL_CATEGORIES, fileDeck: null, deckLabel: null };
    expect(readPracticeState(null)).toEqual(fallback);
    expect(readPracticeState({ category: "nope", fileDeck: "x", deckLabel: 3 })).toEqual(fallback);
  });

  it("keeps a deck label only together with a deck", () => {
    expect(readPracticeState({ fileDeck: null, deckLabel: "Từ hay quên" }).deckLabel).toBeNull();
    expect(readPracticeState({ fileDeck: [], deckLabel: "Từ hay quên" }).deckLabel).toBe("Từ hay quên");
  });
});

describe("toPracticeDeck", () => {
  it("drops ids so practice answers are never recorded", () => {
    const state = toPracticeDeck([word], "Từ hay quên");
    expect(state.fileDeck?.[0]).not.toHaveProperty("id");
    expect(state.fileDeck?.[0]?.word).toBe("resilient");
    expect(readPracticeState(state)).toEqual(state);
  });
});
