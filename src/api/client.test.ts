import { describe, expect, it } from "vitest";
import { ApiError, isNetworkError } from "./client";

describe("isNetworkError", () => {
  it("is true for a fetch TypeError", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("is false for an ApiError", () => {
    expect(isNetworkError(new ApiError(404, "Word not found"))).toBe(false);
  });

  it("is false for an abort", () => {
    expect(isNetworkError(new DOMException("aborted", "AbortError"))).toBe(false);
  });
});
