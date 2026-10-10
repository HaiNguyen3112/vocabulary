import { describe, expect, it } from "vitest";
import { parseLegacyDefinition } from "./legacy-definition";

describe("parseLegacyDefinition", () => {
  it("keeps a plain definition as one untyped sense", () => {
    expect(parseLegacyDefinition("tiền thưởng (từ khách hàng cho người phục vụ)")).toEqual([
      { partOfSpeech: null, definition: "tiền thưởng (từ khách hàng cho người phục vụ)", examples: [] },
    ]);
  });

  it("reads a trailing part-of-speech tag", () => {
    expect(parseLegacyDefinition("một cách hiệu quả (Adv)")).toEqual([
      { partOfSpeech: "adverb", definition: "một cách hiệu quả", examples: [] },
    ]);
  });

  it("splits bulleted lines tagged with parts of speech", () => {
    expect(parseLegacyDefinition("- nắm lấy, nắm chặt (Verb)\n- vali, chuôi (Noun)")).toEqual([
      { partOfSpeech: "verb", definition: "nắm lấy, nắm chặt", examples: [] },
      { partOfSpeech: "noun", definition: "vali, chuôi", examples: [] },
    ]);
  });

  it("reads 'noun: …' prefixes", () => {
    expect(parseLegacyDefinition("noun: thương vụ mua bán\nverb: mạo hiểm")).toEqual([
      { partOfSpeech: "noun", definition: "thương vụ mua bán", examples: [] },
      { partOfSpeech: "verb", definition: "mạo hiểm", examples: [] },
    ]);
  });

  it("moves 'ex:' lines into examples", () => {
    expect(parseLegacyDefinition("Thay cho\nex: He used a knife in place of a spoon.")).toEqual([
      { partOfSpeech: null, definition: "Thay cho", examples: ["He used a knife in place of a spoon."] },
    ]);
  });

  it("keeps mixed tagged/untagged lines untouched", () => {
    const text = "- khinh thường (adv)\n- khinh rẻ (n)\n- cho dù";
    expect(parseLegacyDefinition(text)).toEqual([{ partOfSpeech: null, definition: text, examples: [] }]);
  });

  it("does not treat unknown prefixes as parts of speech", () => {
    expect(parseLegacyDefinition("compare to: so sánh")[0].partOfSpeech).toBeNull();
  });
});
