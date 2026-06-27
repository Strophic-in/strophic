import { z } from "zod";
import { paginationSchema } from "./common";

export const postStatusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(160),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphenated slug")
    .max(120),
  excerpt: z.string().min(1, "Excerpt is required").max(320),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().max(500).optional(),
  category: z.string().min(1).max(60).default("Engineering"),
  tags: z.array(z.string().max(40)).max(20).default([]),
  status: z.enum(postStatusValues).default("DRAFT"),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(200).optional(),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = createPostSchema.partial();
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const blogFilterSchema = paginationSchema.extend({
  status: z.enum(postStatusValues).optional(),
});
export type BlogFilterInput = z.infer<typeof blogFilterSchema>;
