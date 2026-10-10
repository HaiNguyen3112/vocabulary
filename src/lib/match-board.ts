import { normalizeWordKey } from "@shared/word";
import { shuffle } from "./shuffle";

/** Anything with a word and a one-string definition (see `formatDefinition`). */
export type MatchSource = {
  word: string;
  definition: string;
};

export type MatchCardKind = "word" | "definition";

export type MatchCard = {
  id: string;
  kind: MatchCardKind;
  content: string;
  /** Same value on a word card and its definition card. */
  pairKey: string;
};

/** Picks random pairs with distinct words so every word card has exactly one partner. */
export function pickPairs<T extends MatchSource>(
  words: readonly T[],
  pairCount: number,
  random: () => number = Math.random,
): T[] {
  const picked: T[] = [];
  const keys = new Set<string>();
  for (const word of shuffle(words, random)) {
    const key = normalizeWordKey(word.word);
    if (keys.has(key)) continue;
    keys.add(key);
    picked.push(word);
    if (picked.length === pairCount) break;
  }
  return picked;
}

/**
 * Builds a board laid out as definition, word, definition, word… so that on a
 * 4-column grid columns 1 & 3 hold definitions and columns 2 & 4 hold words.
 */
export function buildMatchBoard(
  words: readonly MatchSource[],
  pairCount: number,
  random: () => number = Math.random,
): MatchCard[] {
  const pairs = pickPairs(words, pairCount, random).map((word, index) => ({
    word,
    pairKey: `pair-${index}`,
  }));
  const wordCards = shuffle(pairs, random).map<MatchCard>(({ word, pairKey }) => ({
    id: `${pairKey}-word`,
    kind: "word",
    content: word.word,
    pairKey,
  }));
  const definitionCards = shuffle(pairs, random).map<MatchCard>(({ word, pairKey }) => ({
    id: `${pairKey}-definition`,
    kind: "definition",
    content: word.definition,
    pairKey,
  }));
  return definitionCards.flatMap((card, index) => [card, wordCards[index]]);
}

export function isMatch(first: MatchCard, second: MatchCard): boolean {
  return first.kind !== second.kind && first.pairKey === second.pairKey;
}
