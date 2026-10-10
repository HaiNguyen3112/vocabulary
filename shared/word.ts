import { isCategory, type Category } from "./categories";
import { parseLegacyDefinition } from "./legacy-definition";
import { PART_OF_SPEECH_LABEL, parsePartOfSpeech, type PartOfSpeech } from "./part-of-speech";

export const MAX_WORD_LENGTH = 200;
export const MAX_DEFINITION_LENGTH = 2000;
export const MAX_EXAMPLE_LENGTH = 500;
export const MAX_SENSES = 10;
export const MAX_EXAMPLES_PER_SENSE = 10;
export const MAX_RELATED_WORDS = 50;
export const MAX_BULK_WORDS = 2000;

/** One meaning of a word for one part of speech, with its example sentences. */
export type WordSense = {
  partOfSpeech: PartOfSpeech | null;
  definition: string;
  examples: string[];
};

export type WordInput = {
  word: string;
  category: Category;
  senses: WordSense[];
  /** Word family (e.g. produce ↔ production ↔ productive). Symmetric & transitive on the server. */
  relatedWordIds: string[];
};

export type Word = WordInput & {
  id: string;
  createdAt: string;
  updatedAt: string | null;
};

export type BulkInsertResult = {
  inserted: Word[];
  skipped: string[];
};

export type WordInputResult =
  | { ok: true; value: WordInput }
  | { ok: false; error: string };

/** Key used for duplicate detection: case-insensitive, whitespace-collapsed. */
export function normalizeWordKey(word: string): string {
  return word.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Old data stores some line breaks as the literal two characters `\n`. */
export function normalizeDefinition(definition: string): string {
  return definition.replace(/\\n/g, "\n").trim();
}

/** Compact one-string definition (study board, previews): "- nắm lấy (Verb)\n- vali (Noun)". */
export function formatDefinition(senses: readonly WordSense[]): string {
  const lines = senses.map((sense) =>
    sense.partOfSpeech
      ? `${sense.definition} (${PART_OF_SPEECH_LABEL[sense.partOfSpeech]})`
      : sense.definition,
  );
  return lines.length > 1 ? lines.map((line) => `- ${line}`).join("\n") : (lines[0] ?? "");
}

function toText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function toExamples(value: unknown): string[] {
  const list = Array.isArray(value) ? value : toText(value).split("\n");
  return list.map(toText).filter(Boolean);
}

function parseSenses(raw: Record<string, unknown>): WordSense[] | string {
  // Flat shape (Excel rows, legacy data): definition [+ partOfSpeech] [+ examples].
  if (raw.senses === undefined) {
    const definition = normalizeDefinition(toText(raw.definition));
    if (!definition) return "Missing definition";
    const senses = parseLegacyDefinition(definition);
    const partOfSpeech = parsePartOfSpeech(raw.partOfSpeech);
    const extraExamples = toExamples(raw.examples);
    if (senses.length === 1) {
      senses[0].partOfSpeech ??= partOfSpeech;
      senses[0].examples.push(...extraExamples);
    }
    return senses;
  }

  if (!Array.isArray(raw.senses) || raw.senses.length === 0) return "Add at least one meaning";
  if (raw.senses.length > MAX_SENSES) return `At most ${MAX_SENSES} meanings`;
  const senses: WordSense[] = [];
  for (const [index, item] of raw.senses.entries()) {
    const sense = (item ?? {}) as Record<string, unknown>;
    const definition = normalizeDefinition(toText(sense.definition));
    const examples = toExamples(sense.examples);
    if (!definition) return `Meaning ${index + 1}: missing definition`;
    if (sense.partOfSpeech && !parsePartOfSpeech(sense.partOfSpeech)) {
      return `Meaning ${index + 1}: unknown part of speech "${String(sense.partOfSpeech)}"`;
    }
    if (examples.length > MAX_EXAMPLES_PER_SENSE) {
      return `Meaning ${index + 1}: at most ${MAX_EXAMPLES_PER_SENSE} examples`;
    }
    senses.push({ partOfSpeech: parsePartOfSpeech(sense.partOfSpeech), definition, examples });
  }
  return senses;
}

export function parseWordInput(raw: unknown): WordInputResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid payload" };
  }
  const body = raw as Record<string, unknown>;
  const word = toText(body.word);
  const category = toText(body.category).toUpperCase();

  if (!word) return { ok: false, error: "Missing word" };
  if (word.length > MAX_WORD_LENGTH) return { ok: false, error: "Word is too long" };
  if (!isCategory(category)) {
    return { ok: false, error: `Unknown category "${toText(body.category)}"` };
  }

  const senses = parseSenses(body);
  if (typeof senses === "string") return { ok: false, error: senses };
  if (senses.some((sense) => sense.definition.length > MAX_DEFINITION_LENGTH)) {
    return { ok: false, error: "Definition is too long" };
  }
  if (senses.some((sense) => sense.examples.some((example) => example.length > MAX_EXAMPLE_LENGTH))) {
    return { ok: false, error: "Example is too long" };
  }

  const relatedWordIds = body.relatedWordIds ?? [];
  if (!Array.isArray(relatedWordIds) || relatedWordIds.some((id) => typeof id !== "string")) {
    return { ok: false, error: "relatedWordIds must be a list of ids" };
  }
  if (relatedWordIds.length > MAX_RELATED_WORDS) {
    return { ok: false, error: `At most ${MAX_RELATED_WORDS} related words` };
  }

  return {
    ok: true,
    value: { word, category, senses, relatedWordIds: [...new Set(relatedWordIds as string[])] },
  };
}

export const DEFAULT_WORDS_PAGE_SIZE = 20;
export const MAX_WORDS_PAGE_SIZE = 100;
export const MAX_WORD_SEARCH_LENGTH = 200;

/** One page of the word list, plus the family members its words point to (for related-word labels). */
export type WordPage = {
  words: Word[];
  related: Word[];
  total: number;
  page: number;
  pageSize: number;
};

/** A single word with its family members, for the detail panel. */
export type WordWithRelated = {
  word: Word;
  related: Word[];
};

export type WordPageQuery = {
  search: string;
  category: Category | null;
  page: number;
  pageSize: number;
};

export type WordPageQueryResult =
  | { ok: true; value: WordPageQuery }
  | { ok: false; error: string };

function toPositiveInt(value: string | undefined, fallback: number): number | null {
  if (value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : null;
}

/** Validates `GET /api/words?page=&pageSize=&q=&category=`. */
export function parseWordPageQuery(raw: Record<string, string | undefined>): WordPageQueryResult {
  const page = toPositiveInt(raw.page, 1);
  if (page === null) return { ok: false, error: "page must be a positive integer" };
  const pageSize = toPositiveInt(raw.pageSize, DEFAULT_WORDS_PAGE_SIZE);
  if (pageSize === null || pageSize > MAX_WORDS_PAGE_SIZE) {
    return { ok: false, error: `pageSize must be between 1 and ${MAX_WORDS_PAGE_SIZE}` };
  }
  const search = (raw.q ?? "").trim();
  if (search.length > MAX_WORD_SEARCH_LENGTH) return { ok: false, error: "Search is too long" };
  const category = raw.category ? raw.category.toUpperCase() : null;
  if (category !== null && !isCategory(category)) {
    return { ok: false, error: `Unknown category "${raw.category}"` };
  }
  return { ok: true, value: { search, category, page, pageSize } };
}
