import { z } from "zod";

/** Standard pagination query params (coerced from strings). */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

/** A CUID-ish/opaque id path param. */
export const idParamSchema = z.object({
  id: z.string().min(1, "id is required"),
});
export type IdParam = z.infer<typeof idParamSchema>;

/** A URL slug path param. */
export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1, "slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase, hyphenated slug"),
});
export type SlugParam = z.infer<typeof slugParamSchema>;
