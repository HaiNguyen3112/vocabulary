import { parsePartOfSpeech, type PartOfSpeech } from "./part-of-speech";

export type LegacySense = {
  partOfSpeech: PartOfSpeech | null;
  definition: string;
  examples: string[];
};

const EXAMPLE_PREFIX = /^(?:ex|e\.g\.?|vd)\s*[:.]\s*/i;
const BULLET_PREFIX = /^[-•]\s*/;
const POS_SUFFIX = /\s*\(([^)]+)\)\s*$/;
const POS_PREFIX = /^([a-z]+)\s*:\s*/i;

function splitPartOfSpeech(line: string): { partOfSpeech: PartOfSpeech | null; text: string } {
  const text = line.replace(BULLET_PREFIX, "");
  const prefix = text.match(POS_PREFIX);
  const prefixPos = prefix ? parsePartOfSpeech(prefix[1]) : null;
  if (prefix && prefixPos) return { partOfSpeech: prefixPos, text: text.slice(prefix[0].length) };

  const suffix = text.match(POS_SUFFIX);
  const suffixPos = suffix ? parsePartOfSpeech(suffix[1]) : null;
  if (suffix && suffixPos) {
    return { partOfSpeech: suffixPos, text: text.slice(0, -suffix[0].length) };
  }
  return { partOfSpeech: null, text };
}

/**
 * Splits an old free-text definition into senses:
 *   "- nắm lấy (Verb)\n- vali (Noun)"   → 2 senses with parts of speech
 *   "noun: thương vụ\nverb: mạo hiểm"   → 2 senses
 *   "Thay cho\nex: He used a knife…"    → 1 sense + 1 example
 * Anything ambiguous stays as one untyped sense with the original text.
 */
export function parseLegacyDefinition(definition: string): LegacySense[] {
  const lines = definition
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const examples = lines.filter((line) => EXAMPLE_PREFIX.test(line)).map((line) => line.replace(EXAMPLE_PREFIX, "").trim());
  const body = lines.filter((line) => !EXAMPLE_PREFIX.test(line));

  if (body.length === 0) {
    return [{ partOfSpeech: null, definition: lines.join("\n"), examples: [] }];
  }

  const tagged = body.map(splitPartOfSpeech);
  if (tagged.every((line) => line.partOfSpeech && line.text)) {
    return tagged.map((line, index) => ({
      partOfSpeech: line.partOfSpeech,
      definition: line.text,
      // Old data never mixes examples with several senses; keep them on the last one.
      examples: index === tagged.length - 1 ? examples : [],
    }));
  }
  return [{ partOfSpeech: null, definition: body.join("\n"), examples }];
}
