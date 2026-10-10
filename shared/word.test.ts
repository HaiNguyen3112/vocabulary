import { describe, expect, it } from "vitest";
import {
  DEFAULT_WORDS_PAGE_SIZE,
  MAX_WORDS_PAGE_SIZE,
  formatDefinition,
  normalizeDefinition,
  normalizeWordKey,
  parseWordInput,
  parseWordPageQuery,
} from "./word";

describe("normalizeWordKey", () => {
  it("ignores case and extra whitespace", () => {
    expect(normalizeWordKey("  Break   Down ")).toBe("break down");
  });
});

describe("normalizeDefinition", () => {
  it("turns literal \\n into real line breaks", () => {
    expect(normalizeDefinition("a\\nb\\nc ")).toBe("a\nb\nc");
  });
});

describe("formatDefinition", () => {
  it("prints one sense plainly and several as tagged bullets", () => {
    expect(formatDefinition([{ partOfSpeech: null, definition: "tip", examples: [] }])).toBe("tip");
    expect(
      formatDefinition([
        { partOfSpeech: "verb", definition: "nắm lấy", examples: [] },
        { partOfSpeech: "noun", definition: "vali", examples: ["x"] },
      ]),
    ).toBe("- nắm lấy (Verb)\n- vali (Noun)");
  });
});

describe("parseWordInput", () => {
  it("accepts the senses shape", () => {
    expect(
      parseWordInput({
        word: " grip ",
        category: "other",
        senses: [{ partOfSpeech: "V", definition: "nắm lấy", examples: [" Grip it ", ""] }],
        relatedWordIds: ["a", "a", "b"],
      }),
    ).toEqual({
      ok: true,
      value: {
        word: "grip",
        category: "OTHER",
        senses: [{ partOfSpeech: "verb", definition: "nắm lấy", examples: ["Grip it"] }],
        relatedWordIds: ["a", "b"],
      },
    });
  });

  it("converts the flat Excel / legacy shape into senses", () => {
    const result = parseWordInput({
      word: 24,
      definition: "hai mươi bốn",
      partOfSpeech: "noun",
      examples: "I am 24\nShe is 24",
      category: "OTHER",
    });
    expect(result).toEqual({
      ok: true,
      value: {
        word: "24",
        category: "OTHER",
        senses: [
          { partOfSpeech: "noun", definition: "hai mươi bốn", examples: ["I am 24", "She is 24"] },
        ],
        relatedWordIds: [],
      },
    });
  });

  it.each([
    [{ definition: "x", category: "OTHER" }, "Missing word"],
    [{ word: "x", category: "OTHER" }, "Missing definition"],
    [{ word: "x", category: "OTHER", senses: [] }, "Add at least one meaning"],
    [{ word: "x", category: "OTHER", senses: [{ definition: "" }] }, "Meaning 1: missing definition"],
    [
      { word: "x", category: "OTHER", senses: [{ definition: "y", partOfSpeech: "zz" }] },
      'Meaning 1: unknown part of speech "zz"',
    ],
    [{ word: "x", definition: "y", category: "NOPE" }, 'Unknown category "NOPE"'],
    [{ word: "x", definition: "y", category: "OTHER", relatedWordIds: [1] }, "relatedWordIds must be a list of ids"],
    [null, "Invalid payload"],
  ])("rejects %j", (raw, error) => {
    expect(parseWordInput(raw)).toEqual({ ok: false, error });
  });
});

describe("parseWordPageQuery", () => {
  it("applies defaults", () => {
    expect(parseWordPageQuery({})).toEqual({
      ok: true,
      value: { search: "", category: null, page: 1, pageSize: DEFAULT_WORDS_PAGE_SIZE },
    });
  });

  it("parses page, size, trimmed search and category", () => {
    expect(parseWordPageQuery({ page: "3", pageSize: "50", q: "  tip ", category: "personal" })).toEqual({
      ok: true,
      value: { search: "tip", category: "PERSONAL", page: 3, pageSize: 50 },
    });
  });

  it("rejects bad numbers and unknown categories", () => {
    expect(parseWordPageQuery({ page: "0" }).ok).toBe(false);
    expect(parseWordPageQuery({ page: "1.5" }).ok).toBe(false);
    expect(parseWordPageQuery({ pageSize: String(MAX_WORDS_PAGE_SIZE + 1) }).ok).toBe(false);
    expect(parseWordPageQuery({ category: "nope" }).ok).toBe(false);
  });
});
