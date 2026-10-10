import { normalizeWordKey } from "@shared/word";

/** Shared prefix long enough to guess a word family (produce / production / productive). */
const MIN_STEM_LENGTH = 4;
const MAX_SUGGESTIONS = 8;

function commonPrefixLength(a: string, b: string): number {
  let length = 0;
  while (length < a.length && length < b.length && a[length] === b[length]) length++;
  return length;
}

/** Ids of words that probably belong to the same family, best match first. */
export function suggestRelatedWords<T extends { id: string; word: string }>(
  word: string,
  candidates: readonly T[],
  excludeIds: ReadonlySet<string>,
): string[] {
  const key = normalizeWordKey(word);
  if (key.length < MIN_STEM_LENGTH || key.includes(" ")) return [];
  return candidates
    .filter((candidate) => !excludeIds.has(candidate.id))
    .map((candidate) => {
      const candidateKey = normalizeWordKey(candidate.word);
      return { id: candidate.id, isSame: candidateKey === key, score: commonPrefixLength(key, candidateKey) };
    })
    .filter(({ isSame, score }) => !isSame && score >= MIN_STEM_LENGTH)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS)
    .map(({ id }) => id);
}
