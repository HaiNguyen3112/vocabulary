import { formatDefinition, normalizeWordKey } from "@shared/word";
import { CHOICE_OPTION_COUNT } from "@/constants/study";
import type { ChoiceDirection, Exercise, ExerciseKind, StudyWord } from "./exercise";
import { shuffle } from "./shuffle";

const BLANK = "___";

export type BuildExerciseOptions = {
  direction?: ChoiceDirection;
  random?: () => number;
};

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The word plus simple inflections; phrases match any whitespace between words. */
function wordForms(word: string): string[] {
  const base = word.trim();
  const forms = [base, `${base}s`, `${base}es`, `${base}ed`, `${base}d`, `${base}ing`];
  if (base.endsWith("e")) forms.push(`${base.slice(0, -1)}ing`);
  return forms.map((form) => escapeRegExp(form).replace(/\s+/g, "\\s+"));
}

/** First example containing the word (or a simple form); every occurrence becomes `___`. */
export function findCloze(word: StudyWord): { sentence: string; answer: string } | null {
  if (!word.word.trim()) return null;
  const forms = [...new Set(wordForms(word.word))].sort((a, b) => b.length - a.length);
  const pattern = `(?<![\\p{L}\\p{N}])(?:${forms.join("|")})(?![\\p{L}\\p{N}])`;
  for (const sense of word.senses) {
    for (const example of sense.examples) {
      const first = new RegExp(pattern, "iu").exec(example);
      if (!first) continue;
      return {
        sentence: example.replace(new RegExp(pattern, "giu"), BLANK),
        answer: first[0].toLowerCase(),
      };
    }
  }
  return null;
}

function distractorRank(candidate: StudyWord, word: StudyWord): number {
  const pos = word.senses[0]?.partOfSpeech ?? null;
  if (pos && candidate.senses[0]?.partOfSpeech === pos) return 0;
  return candidate.category === word.category ? 1 : 2;
}

function buildChoice(
  word: StudyWord,
  pool: readonly StudyWord[],
  direction: ChoiceDirection,
  random: () => number,
): Exercise {
  const definition = formatDefinition(word.senses);
  const toText = (item: StudyWord) =>
    direction === "meaning-to-word" ? item.word : formatDefinition(item.senses);
  const dedupeKey = (text: string) =>
    direction === "meaning-to-word" ? text.toLowerCase() : text;

  const answer = toText(word);
  const answerKey = normalizeWordKey(word.word);
  const seen = new Set([dedupeKey(answer)]);
  const ranked = shuffle(pool, random)
    .map((item, index) => ({ item, index, rank: distractorRank(item, word) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index);

  const options = [answer];
  for (const { item } of ranked) {
    if (options.length >= CHOICE_OPTION_COUNT) break;
    if (normalizeWordKey(item.word) === answerKey) continue;
    const text = toText(item);
    if (seen.has(dedupeKey(text))) continue;
    seen.add(dedupeKey(text));
    options.push(text);
  }

  return {
    word,
    kind: "choice",
    direction,
    prompt: direction === "meaning-to-word" ? definition : word.word,
    options: shuffle(options, random),
    answer,
  };
}

/** Turns a word into an exercise; `pool` supplies multiple-choice distractors. */
export function buildExercise(
  word: StudyWord,
  kind: ExerciseKind,
  pool: readonly StudyWord[],
  options: BuildExerciseOptions = {},
): Exercise {
  const { direction = "word-to-meaning", random = Math.random } = options;
  const definition = formatDefinition(word.senses);
  switch (kind) {
    case "flashcard":
      return { word, kind, front: word.word, back: definition };
    case "choice":
      return buildChoice(word, pool, direction, random);
    case "listen":
      return { word, kind, answer: word.word };
    case "cloze": {
      const cloze = findCloze(word);
      if (cloze) return { word, kind, hint: definition, ...cloze };
      return { word, kind: "type", prompt: definition, answer: word.word };
    }
    case "type":
      return { word, kind, prompt: definition, answer: word.word };
  }
}
