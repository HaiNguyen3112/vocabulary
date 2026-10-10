export const PARTS_OF_SPEECH = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "pronoun",
  "phrase",
] as const;

export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number];

/** Short label used in compact definitions, e.g. "nắm lấy (Verb)". */
export const PART_OF_SPEECH_LABEL: Record<PartOfSpeech, string> = {
  noun: "Noun",
  verb: "Verb",
  adjective: "Adj",
  adverb: "Adv",
  preposition: "Prep",
  conjunction: "Conj",
  pronoun: "Pron",
  phrase: "Phrase",
};

const ALIASES: Record<string, PartOfSpeech> = {
  n: "noun",
  noun: "noun",
  v: "verb",
  verb: "verb",
  adj: "adjective",
  adjective: "adjective",
  adv: "adverb",
  adverb: "adverb",
  prep: "preposition",
  preposition: "preposition",
  conj: "conjunction",
  conjunction: "conjunction",
  pron: "pronoun",
  pronoun: "pronoun",
  phr: "phrase",
  phrase: "phrase",
};

/** Accepts full names and common abbreviations ("N", "adj", "Verb"…). */
export function parsePartOfSpeech(raw: unknown): PartOfSpeech | null {
  if (typeof raw !== "string") return null;
  return ALIASES[raw.trim().toLowerCase().replace(/\.$/, "")] ?? null;
}
