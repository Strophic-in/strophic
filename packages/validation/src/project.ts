import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "Use a hex color like #7c5cff");

// Bare fields (no defaults) — defaults apply only on create; update is built from
// these so a partial PATCH leaves omitted keys untouched (see blog.ts rationale).
const projectFields = {
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphenated slug")
    .max(120),
  title: z.string().min(1, "Title is required").max(160),
  summary: z.string().min(1, "Summary is required").max(400),
  category: z.string().min(1).max(60),
  tags: z.array(z.string().max(40)).max(20),
  year: z.string().min(1).max(10),
  accentFrom: hexColor,
  accentTo: hexColor,
  results: z.array(z.string().max(120)).max(12),
  coverImage: z.string().max(500).optional(),
  content: z.string().max(50000).optional(),
  featured: z.boolean(),
  published: z.boolean(),
  order: z.number().int().min(0).max(9999),
};

export const createProjectSchema = z.object({
  ...projectFields,
  tags: projectFields.tags.default([]),
  accentFrom: projectFields.accentFrom.default("#7c5cff"),
  accentTo: projectFields.accentTo.default("#3d2689"),
  results: projectFields.results.default([]),
  featured: projectFields.featured.default(false),
  published: projectFields.published.default(true),
  order: projectFields.order.default(0),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object(projectFields).partial();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
