/**
 * @strophic/utils - small, pure, framework-agnostic helpers.
 * No DOM, no Node-only APIs, no framework imports: safe to use anywhere.
 */

// Homepage section registry (shared by admin + website).
export * from "./homepage-sections";

/** Convert arbitrary text into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics (combining marks)
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics → hyphen
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

/** Estimate reading time in whole minutes (≈200 wpm), never less than 1. */
export function readingTimeMinutes(text: string, wordsPerMinute = 200): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/** Format a date as e.g. "Jun 27, 2026". Accepts an ISO string or Date. */
export function formatDate(date: string | Date, locale = "en-US"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Resolve a path against a base into an absolute URL string. */
export function absoluteUrl(path: string, base: string): string {
  return new URL(path, base).toString();
}

/** Truncate text to `max` characters on a word boundary, adding an ellipsis. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  // If the cut lands exactly on a space, the slice is already whole words.
  if (text[max] === " ") return `${slice.trimEnd()}…`;
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`;
}
