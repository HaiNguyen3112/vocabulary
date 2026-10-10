import type { Category } from "@shared/categories";
import type { PartOfSpeech } from "@shared/part-of-speech";
import type { Word, WordInput } from "@shared/word";

export type SenseFormValue = {
  partOfSpeech?: PartOfSpeech | null;
  definition: string;
  /** One example sentence per line. */
  examplesText?: string;
};

export type WordFormValues = {
  word: string;
  category?: Category;
  senses: SenseFormValue[];
  relatedWordIds: string[];
};

export function toFormValues(word: Word | null): WordFormValues {
  if (!word) return { word: "", senses: [{ definition: "" }], relatedWordIds: [] };
  return {
    word: word.word,
    category: word.category,
    senses: word.senses.map((sense) => ({
      partOfSpeech: sense.partOfSpeech,
      definition: sense.definition,
      examplesText: sense.examples.join("\n"),
    })),
    relatedWordIds: word.relatedWordIds,
  };
}

/** Category is guaranteed by the form's required rule. */
export function toWordInput(values: WordFormValues & { category: Category }): WordInput {
  return {
    word: values.word.trim(),
    category: values.category,
    senses: values.senses.map((sense) => ({
      partOfSpeech: sense.partOfSpeech ?? null,
      definition: sense.definition.trim(),
      examples: (sense.examplesText ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    })),
    relatedWordIds: values.relatedWordIds ?? [],
  };
}
