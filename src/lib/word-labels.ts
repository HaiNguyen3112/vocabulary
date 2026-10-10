import { PART_OF_SPEECH_LABEL } from "@shared/part-of-speech";
import type { Word } from "@shared/word";

/** Word types across all senses, each once: "Verb, Noun". */
export function partsOfSpeechLabel(word: Word): string {
  const labels = new Set(
    word.senses.flatMap((sense) => (sense.partOfSpeech ? [PART_OF_SPEECH_LABEL[sense.partOfSpeech]] : [])),
  );
  return [...labels].join(", ");
}
