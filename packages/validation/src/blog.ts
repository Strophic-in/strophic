import { z } from "zod";
import { paginationSchema } from "./common";

export const postStatusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

// Field definitions WITHOUT defaults. Defaults are applied only on create; a
// partial update must leave omitted fields untouched, so the update schema is
// built from these bare fields (Zod's `.partial()` would otherwise re-inject a
// field's `.default()` for omitted keys, silently resetting tags/category/status).
const postFields = {
  title: z.string().min(1, "Title is required").max(160),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphenated slug")
    .max(120),
  excerpt: z.string().min(1, "Excerpt is required").max(320),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().max(500).optional(),
  category: z.string().min(1).max(60),
  tags: z.array(z.string().max(40)).max(20),
  status: z.enum(postStatusValues),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(200).optional(),
};

export const createPostSchema = z.object({
  ...postFields,
  category: postFields.category.default("Engineering"),
  tags: postFields.tags.default([]),
  status: postFields.status.default("DRAFT"),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = z.object(postFields).partial();
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const blogFilterSchema = paginationSchema.extend({
  status: z.enum(postStatusValues).optional(),
});
export type BlogFilterInput = z.infer<typeof blogFilterSchema>;
