import { describe, expect, it } from "vitest";
import type { Word } from "@shared/word";
import { partsOfSpeechLabel } from "./word-labels";

const word = (parts: (Word["senses"][number]["partOfSpeech"])[]): Word =>
  ({
    id: "w",
    word: "run",
    category: "OTHER",
    relatedWordIds: [],
    senses: parts.map((partOfSpeech) => ({ partOfSpeech, definition: "d", examples: [] })),
  }) as unknown as Word;

describe("partsOfSpeechLabel", () => {
  it("lists each word type once, in first-seen order", () => {
    expect(partsOfSpeechLabel(word(["verb", "noun", "verb"]))).toBe("Verb, Noun");
  });

  it("is empty when no sense has a word type", () => {
    expect(partsOfSpeechLabel(word([null, null]))).toBe("");
  });
});
