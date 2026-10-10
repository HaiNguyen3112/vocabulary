import { describe, expect, it } from "vitest";
import type { Word } from "@shared/word";
import type { WordPageParams } from "@/api/words-api";
import { buildWordPage, buildWordWithRelated } from "./word-page-local";

type Options = { definition?: string; examples?: string[]; relatedWordIds?: string[] };

const word = (id: string, text: string, category: Word["category"], options: Options = {}): Word => ({
  id,
  word: text,
  category,
  senses: [{ partOfSpeech: null, definition: options.definition ?? `${text} meaning`, examples: options.examples ?? [] }],
  relatedWordIds: options.relatedWordIds ?? [],
  createdAt: "2026-10-10T00:00:00.000Z",
  updatedAt: null,
});

const params = (overrides: Partial<WordPageParams> = {}): WordPageParams => ({
  search: "",
  category: "",
  page: 1,
  pageSize: 10,
  ...overrides,
});

const ids = (words: readonly Word[]) => words.map((item) => item.id);

// Newest first, like the server's full list.
const all = [
  word("tip", "tip", "DINNINGOUT", { definition: "tiền thưởng" }),
  word("eligible", "eligible", "PERSONAL", { examples: ["She is eligible for the award"] }),
  word("break-down", "break down", "IDIOM"),
  word("piece-of-cake", "piece of cake", "IDIOM"),
  word("other", "other", "OTHER"),
];

describe("buildWordPage", () => {
  it("searches the word case-insensitively", () => {
    expect(ids(buildWordPage(all, params({ search: "TIP" })).words)).toEqual(["tip"]);
  });

  it("searches definitions and examples", () => {
    expect(ids(buildWordPage(all, params({ search: "thưởng" })).words)).toEqual(["tip"]);
    expect(ids(buildWordPage(all, params({ search: "award" })).words)).toEqual(["eligible"]);
  });

  it("filters by category", () => {
    const page = buildWordPage(all, params({ category: "IDIOM" }));
    expect(ids(page.words)).toEqual(["break-down", "piece-of-cake"]);
    expect(page.total).toBe(2);
  });

  it("keeps the input order and slices the page", () => {
    const page = buildWordPage(all, params({ page: 2, pageSize: 2 }));
    expect(ids(page.words)).toEqual(["break-down", "piece-of-cake"]);
    expect(page).toMatchObject({ total: 5, page: 2, pageSize: 2 });
  });

  it("clamps a page past the end to the last page", () => {
    const page = buildWordPage(all, params({ page: 9, pageSize: 2 }));
    expect(page.page).toBe(3);
    expect(ids(page.words)).toEqual(["other"]);
  });

  it("returns page 1 with no words when nothing matches", () => {
    expect(buildWordPage(all, params({ search: "zzz", page: 4 }))).toMatchObject({ words: [], total: 0, page: 1 });
  });

  it("puts family members that are not on the page into related", () => {
    const family = [
      word("a", "apply", "OTHER", { relatedWordIds: ["b", "c"] }),
      word("b", "applicant", "OTHER", { relatedWordIds: ["a", "c"] }),
      word("x", "unrelated", "OTHER"),
      word("c", "application", "OTHER", { relatedWordIds: ["a", "b"] }),
    ];
    const page = buildWordPage(family, params({ pageSize: 2 }));
    expect(ids(page.words)).toEqual(["a", "b"]);
    expect(ids(page.related)).toEqual(["c"]);
  });
});

describe("buildWordWithRelated", () => {
  const family = [
    word("a", "apply", "OTHER", { relatedWordIds: ["b", "c"] }),
    word("b", "applicant", "OTHER", { relatedWordIds: ["a", "c"] }),
    word("c", "application", "OTHER", { relatedWordIds: ["a", "b"] }),
  ];

  it("returns the word and its family members", () => {
    const result = buildWordWithRelated(family, "a");
    expect(result?.word.id).toBe("a");
    expect(ids(result?.related ?? [])).toEqual(["b", "c"]);
  });

  it("returns null for an unknown id", () => {
    expect(buildWordWithRelated(family, "nope")).toBeNull();
  });
});
