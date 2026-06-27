import { z } from "zod";

// Field definitions without defaults. Defaults apply only on create; the update
// schema is built from bare fields so a partial update leaves omitted keys
// untouched (see blog.ts for the Zod `.partial()` + `.default()` pitfall).
const testimonialFields = {
  quote: z.string().min(1, "Quote is required").max(800),
  author: z.string().min(1, "Author is required").max(120),
  role: z.string().min(1, "Role is required").max(120),
  company: z.string().min(1, "Company is required").max(120),
  avatarUrl: z.string().max(500).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  featured: z.boolean(),
  published: z.boolean(),
  order: z.number().int().min(0).max(9999),
};

export const createTestimonialSchema = z.object({
  ...testimonialFields,
  featured: testimonialFields.featured.default(false),
  published: testimonialFields.published.default(true),
  order: testimonialFields.order.default(0),
});
export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;

export const updateTestimonialSchema = z.object(testimonialFields).partial();
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
