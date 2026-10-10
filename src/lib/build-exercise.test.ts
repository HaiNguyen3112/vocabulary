import type { Category } from "@shared/categories";
import type { PartOfSpeech } from "@shared/part-of-speech";
import { describe, expect, it } from "vitest";
import { CHOICE_OPTION_COUNT } from "@/constants/study";
import { buildExercise, findCloze } from "./build-exercise";
import type { StudyWord } from "./exercise";

function w(
  word: string,
  definition: string,
  partOfSpeech: PartOfSpeech | null = null,
  examples: string[] = [],
  category: Category = "OTHER",
): StudyWord {
  return { id: word, word, category, senses: [{ partOfSpeech, definition, examples }] };
}

const random = () => 0.5;

describe("buildExercise choice", () => {
  const pool = [w("big", "lớn"), w("large", "lớn"), w("tiny", "nhỏ"), w("Big", "to")];

  it("offers distinct word options including the answer", () => {
    const ex = buildExercise(pool[0], "choice", pool, { direction: "meaning-to-word", random });
    if (ex.kind !== "choice") throw new Error("expected choice");
    expect(ex.options).toContain("big");
    expect(new Set(ex.options.map((o) => o.toLowerCase())).size).toBe(ex.options.length);
    expect(ex.options).not.toContain("Big");
    expect(ex.options.length).toBeLessThanOrEqual(CHOICE_OPTION_COUNT);
    expect(ex.answer).toBe("big");
    expect(ex.prompt).toBe("lớn");
  });

  it("dedupes identical definitions", () => {
    const ex = buildExercise(pool[0], "choice", pool, { direction: "word-to-meaning", random });
    if (ex.kind !== "choice") throw new Error("expected choice");
    expect(ex.options.filter((o) => o === "lớn")).toHaveLength(1);
    expect(ex.prompt).toBe("big");
  });

  it("never offers a second correct answer (meaning-to-word)", () => {
    const ex = buildExercise(pool[0], "choice", pool, { direction: "meaning-to-word", random });
    if (ex.kind !== "choice") throw new Error("expected choice");
    expect(ex.options).not.toContain("large");
  });

  it("never offers a second correct answer (word-to-meaning)", () => {
    const ex = buildExercise(pool[0], "choice", pool, { direction: "word-to-meaning", random });
    if (ex.kind !== "choice") throw new Error("expected choice");
    expect(ex.options.filter((o) => o === "lớn")).toHaveLength(1);
    expect(ex.answer).toBe("lớn");
  });

  it("defaults to word-to-meaning", () => {
    const ex = buildExercise(pool[0], "choice", pool, { random });
    expect(ex.kind === "choice" && ex.direction).toBe("word-to-meaning");
  });

  it("handles a tiny bank", () => {
    const ex = buildExercise(w("a1", "x"), "choice", [w("a1", "x"), w("b2", "y")]);
    if (ex.kind !== "choice") throw new Error("expected choice");
    expect(ex.options).toHaveLength(2);
  });

  it.each(["word-to-meaning", "meaning-to-word"] as const)(
    "prefers the same part of speech (%s)",
    (direction) => {
      const answer = w("run", "chạy", "verb");
      const verb = w("walk", "đi bộ", "verb");
      const others = ["a", "b", "c", "d", "e"].map((s) => w(`n-${s}`, `def-${s}`, "noun"));
      const ex = buildExercise(answer, "choice", [...others, answer, verb], { direction, random });
      if (ex.kind !== "choice") throw new Error("expected choice");
      expect(ex.options).toHaveLength(CHOICE_OPTION_COUNT);
      expect(ex.options).toContain(direction === "meaning-to-word" ? "walk" : "đi bộ (Verb)");
    },
  );
});

describe("findCloze", () => {
  it("blanks only the first matched form", () => {
    expect(findCloze(w("produce", "sx", "verb", ["They produced it and produce more."]))).toEqual({
      sentence: "They ___ it and produce more.",
      answer: "produced",
    });
  });

  it("blanks every occurrence of the matched form, case-insensitively", () => {
    expect(findCloze(w("produce", "sx", "verb", ["Produce what you produce."]))).toEqual({
      sentence: "___ what you ___.",
      answer: "produce",
    });
  });

  it("matches phrases", () => {
    expect(
      findCloze(w("take off", "cất cánh", null, ["The plane will take off soon."]))?.sentence,
    ).toBe("The plane will ___ soon.");
  });

  it("matches e-dropping -ing", () => {
    expect(findCloze(w("make", "làm", null, ["We are making tea."]))?.answer).toBe("making");
  });

  it("respects word boundaries", () => {
    expect(findCloze(w("cat", "mèo", null, ["Concatenate"]))).toBeNull();
  });
});

describe("buildExercise other kinds", () => {
  const word = w("cat", "mèo", "noun", ["A cat sleeps."]);

  it("builds flashcard, type and listen", () => {
    expect(buildExercise(word, "flashcard", [])).toMatchObject({ front: "cat", back: "mèo (Noun)" });
    expect(buildExercise(word, "type", [])).toMatchObject({ prompt: "mèo (Noun)", answer: "cat" });
    expect(buildExercise(word, "listen", [])).toMatchObject({ answer: "cat" });
  });

  it("builds cloze, falling back to type without an example", () => {
    expect(buildExercise(word, "cloze", [])).toMatchObject({
      kind: "cloze",
      sentence: "A ___ sleeps.",
      hint: "mèo (Noun)",
      answer: "cat",
    });
    expect(buildExercise(w("cat", "mèo"), "cloze", []).kind).toBe("type");
  });
});
