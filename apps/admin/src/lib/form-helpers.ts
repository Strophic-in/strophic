/** Form helpers for editing array fields as text. */

/** One item per line → trimmed, non-empty array. */
export const linesToArray = (s: string): string[] =>
  s.split("\n").map((l) => l.trim()).filter(Boolean);

export const arrayToLines = (a: string[] | undefined): string => (a ?? []).join("\n");

/** Comma-separated → trimmed, non-empty array. */
export const csvToArray = (s: string): string[] =>
  s.split(",").map((t) => t.trim()).filter(Boolean);

export const arrayToCsv = (a: string[] | undefined): string => (a ?? []).join(", ");
