import { describe, expect, it } from "vitest";
import type { WordInput } from "@shared/word";
import { filterWords } from "./filter-words";

const entry = (word: string, definition: string, category: WordInput["category"], examples: string[] = []): WordInput => ({
  word,
  category,
  senses: [{ partOfSpeech: null, definition, examples }],
  relatedWordIds: [],
});

const words = [
  entry("tip", "tiền thưởng", "DINNINGOUT"),
  entry("eligible", "đạt chuẩn", "PERSONAL", ["She is eligible for the award"]),
  entry("break down", "Ngừng hoạt động", "PHRASAL_VERB"),
];

describe("filterWords", () => {
  it("returns everything with an empty filter", () => {
    expect(filterWords(words, { search: "", category: "" })).toHaveLength(3);
  });

  it("searches word and definition, case-insensitive and trimmed", () => {
    expect(filterWords(words, { search: "  TIP ", category: "" })).toEqual([words[0]]);
    expect(filterWords(words, { search: "ngừng", category: "" })).toEqual([words[2]]);
  });

  it("searches example sentences", () => {
    expect(filterWords(words, { search: "award", category: "" })).toEqual([words[1]]);
  });

  it("combines search with category", () => {
    expect(filterWords(words, { search: "e", category: "PERSONAL" })).toEqual([words[1]]);
  });
});
