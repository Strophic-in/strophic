import { describe, expect, it } from "vitest";
import { absoluteUrl, formatDate, readingTimeMinutes, slugify, truncate } from "./index";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("strips diacritics and punctuation", () => {
    expect(slugify("Café & Résumé!")).toBe("cafe-resume");
  });
  it("trims leading/trailing separators", () => {
    expect(slugify("  --AI Agents--  ")).toBe("ai-agents");
  });
});

describe("readingTimeMinutes", () => {
  it("returns at least 1 minute", () => {
    expect(readingTimeMinutes("short")).toBe(1);
  });
  it("scales with word count", () => {
    const text = Array.from({ length: 400 }, () => "word").join(" ");
    expect(readingTimeMinutes(text, 200)).toBe(2);
  });
});

describe("formatDate", () => {
  it("formats an ISO string", () => {
    expect(formatDate("2026-06-27T00:00:00Z")).toMatch(/2026/);
  });
});

describe("absoluteUrl", () => {
  it("resolves a path against a base", () => {
    expect(absoluteUrl("/blog", "https://strophic.in")).toBe("https://strophic.in/blog");
  });
});

describe("truncate", () => {
  it("leaves short text untouched", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });
  it("cuts on a word boundary with an ellipsis", () => {
    expect(truncate("the quick brown fox", 9)).toBe("the quick…");
  });
});
