import { parseWordInput, type WordInput } from "@shared/word";

export type InvalidRow = {
  /** 1-based row number as shown in Excel (header = row 1). */
  rowNumber: number;
  error: string;
};

export type ParsedWordRows = {
  valid: WordInput[];
  invalid: InvalidRow[];
};

const HEADER_ROW_OFFSET = 2;

/** Accepted header spellings (lower-cased, spaces removed) → input field. */
const HEADER_ALIASES: Record<string, string> = {
  word: "word",
  definition: "definition",
  meaning: "definition",
  category: "category",
  partofspeech: "partOfSpeech",
  type: "partOfSpeech",
  pos: "partOfSpeech",
  example: "examples",
  examples: "examples",
};

function normalizeHeaders(row: unknown): Record<string, unknown> {
  if (!row || typeof row !== "object") return {};
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
    const field = HEADER_ALIASES[key.replace(/\s+/g, "").toLowerCase()];
    if (field) result[field] = value;
  }
  return result;
}

/**
 * Rows come from `XLSX.utils.sheet_to_json` (one object per row, keyed by header).
 * Columns: word, definition, category + optional partOfSpeech, example (one per line).
 */
export function parseWordRows(rows: readonly unknown[]): ParsedWordRows {
  const valid: WordInput[] = [];
  const invalid: InvalidRow[] = [];
  rows.forEach((row, index) => {
    const parsed = parseWordInput(normalizeHeaders(row));
    if (parsed.ok) valid.push(parsed.value);
    else invalid.push({ rowNumber: index + HEADER_ROW_OFFSET, error: parsed.error });
  });
  return { valid, invalid };
}
