import { describe, expect, it } from "vitest";
import { suggestRelatedWords } from "./related-words";

const words = [
  { id: "1", word: "produce" },
  { id: "2", word: "productive" },
  { id: "3", word: "productively" },
  { id: "4", word: "probably" },
  { id: "5", word: "Production" },
  { id: "6", word: "tip" },
];

describe("suggestRelatedWords", () => {
  it("suggests words sharing a stem, longest shared prefix first", () => {
    expect(suggestRelatedWords("product", words, new Set())).toEqual(["2", "3", "5", "1"]);
  });

  it("skips excluded ids and the same spelling", () => {
    expect(suggestRelatedWords("produce", words, new Set(["1", "2"]))).toEqual(["3", "5"]);
  });

  it("does not guess for short words or phrases", () => {
    expect(suggestRelatedWords("tip", words, new Set())).toEqual([]);
    expect(suggestRelatedWords("produce more", words, new Set())).toEqual([]);
  });
});
