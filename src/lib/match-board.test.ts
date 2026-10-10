import { describe, expect, it } from "vitest";
import { buildMatchBoard, isMatch, pickPairs, type MatchSource } from "./match-board";

const word = (text: string, definition = `def of ${text}`): MatchSource => ({
  word: text,
  definition,
});

describe("pickPairs", () => {
  it("never picks the same word twice (case-insensitive)", () => {
    const words = [word("break down", "a"), word("Break Down", "b"), word("tip")];
    const picked = pickPairs(words, 3);
    expect(picked).toHaveLength(2);
    expect(new Set(picked.map((w) => w.word.toLowerCase())).size).toBe(2);
  });

  it("caps at the requested pair count", () => {
    const words = Array.from({ length: 20 }, (_, i) => word(`w${i}`));
    expect(pickPairs(words, 8)).toHaveLength(8);
  });
});

describe("buildMatchBoard", () => {
  const words = Array.from({ length: 12 }, (_, i) => word(`w${i}`));
  const board = buildMatchBoard(words, 8);

  it("alternates definition / word cards", () => {
    expect(board).toHaveLength(16);
    board.forEach((card, index) => {
      expect(card.kind).toBe(index % 2 === 0 ? "definition" : "word");
    });
  });

  it("pairs each word card with exactly one definition card", () => {
    const wordCards = board.filter((card) => card.kind === "word");
    for (const wordCard of wordCards) {
      const partners = board.filter((card) => isMatch(wordCard, card));
      expect(partners).toHaveLength(1);
      expect(partners[0].content).toBe(`def of ${wordCard.content}`);
    }
  });

  it("uses unique card ids", () => {
    expect(new Set(board.map((card) => card.id)).size).toBe(board.length);
  });

  it("returns an empty board for no words", () => {
    expect(buildMatchBoard([], 8)).toEqual([]);
  });
});
