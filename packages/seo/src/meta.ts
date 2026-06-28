export interface SeoImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

/** Per-page SEO inputs resolved into `<head>` tags by the website's BaseHead. */
export interface SeoMeta {
  title: string;
  description: string;
  /** Absolute canonical URL for this page. */
  canonical: string;
  type?: "website" | "article";
  image?: SeoImage;
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  section?: string;
  tags?: string[];
}

/** "Page - Site" (or just the site name on the home page). */
export function formatTitle(title: string, siteName: string, isHome = false): string {
  return isHome || title === siteName ? title : `${title} - ${siteName}`;
}

/** Trim a description to a sensible meta length on a word boundary. */
export function clampDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 40 ? lastSpace : max - 1).trimEnd()}…`;
}

/** Join a path to a base origin into an absolute URL. */
export function absoluteUrl(path: string, origin: string): string {
  return new URL(path, origin).toString();
}
