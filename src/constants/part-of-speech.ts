import { PARTS_OF_SPEECH, type PartOfSpeech } from "@shared/part-of-speech";

export const PART_OF_SPEECH_NAME: Record<PartOfSpeech, string> = {
  noun: "Noun",
  verb: "Verb",
  adjective: "Adjective",
  adverb: "Adverb",
  preposition: "Preposition",
  conjunction: "Conjunction",
  pronoun: "Pronoun",
  phrase: "Phrase",
};

/** Ant Design preset tag colours. */
export const PART_OF_SPEECH_COLOR: Record<PartOfSpeech, string> = {
  noun: "blue",
  verb: "green",
  adjective: "orange",
  adverb: "purple",
  preposition: "cyan",
  conjunction: "magenta",
  pronoun: "gold",
  phrase: "geekblue",
};

export const PART_OF_SPEECH_OPTIONS = PARTS_OF_SPEECH.map((value) => ({
  value,
  label: PART_OF_SPEECH_NAME[value],
}));
