import { describe, expect, it } from "vitest";
import {
  nextColorSchemePreference,
  parseColorSchemePreference,
  resolveColorScheme,
} from "./color-scheme";

describe("parseColorSchemePreference", () => {
  it("keeps valid values", () => {
    expect(parseColorSchemePreference("dark")).toBe("dark");
    expect(parseColorSchemePreference("light")).toBe("light");
    expect(parseColorSchemePreference("system")).toBe("system");
  });

  it("falls back to system for anything else", () => {
    for (const raw of [null, undefined, "", "DARK", "{}", 1]) {
      expect(parseColorSchemePreference(raw)).toBe("system");
    }
  });
});

describe("resolveColorScheme", () => {
  it("follows the OS only for system", () => {
    expect(resolveColorScheme("system", true)).toBe("dark");
    expect(resolveColorScheme("system", false)).toBe("light");
    expect(resolveColorScheme("light", true)).toBe("light");
    expect(resolveColorScheme("dark", false)).toBe("dark");
  });
});

describe("nextColorSchemePreference", () => {
  it("cycles system → light → dark → system", () => {
    expect(nextColorSchemePreference("system")).toBe("light");
    expect(nextColorSchemePreference("light")).toBe("dark");
    expect(nextColorSchemePreference("dark")).toBe("system");
  });
});
