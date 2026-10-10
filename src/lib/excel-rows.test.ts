import { describe, expect, it } from "vitest";
import { parseWordRows } from "./excel-rows";

describe("parseWordRows", () => {
  it("accepts headers in any case and reports invalid rows with Excel row numbers", () => {
    const result = parseWordRows([
      { Word: "tip", Definition: "tiền thưởng", Category: "dinningout" },
      { Word: "", Definition: "x", Category: "OTHER" },
      { word: "idiom", definition: "thành ngữ", category: "WRONG" },
    ]);
    expect(result.valid).toEqual([
      {
        word: "tip",
        category: "DINNINGOUT",
        senses: [{ partOfSpeech: null, definition: "tiền thưởng", examples: [] }],
        relatedWordIds: [],
      },
    ]);
    expect(result.invalid).toEqual([
      { rowNumber: 3, error: "Missing word" },
      { rowNumber: 4, error: 'Unknown category "WRONG"' },
    ]);
  });

  it("reads optional part of speech and example columns", () => {
    const [word] = parseWordRows([
      { Word: "grip", Definition: "nắm chặt", Category: "OTHER", "Part of speech": "v", Example: "Grip the rope" },
    ]).valid;
    expect(word.senses).toEqual([
      { partOfSpeech: "verb", definition: "nắm chặt", examples: ["Grip the rope"] },
    ]);
  });
});
