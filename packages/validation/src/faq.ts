import { z } from "zod";

// Field definitions without defaults — defaults apply only on create (see blog.ts).
const faqFields = {
  question: z.string().min(1, "Question is required").max(300),
  answer: z.string().min(1, "Answer is required").max(2000),
  category: z.string().max(60).optional(),
  published: z.boolean(),
  order: z.number().int().min(0).max(9999),
};

export const createFaqSchema = z.object({
  ...faqFields,
  published: faqFields.published.default(true),
  order: faqFields.order.default(0),
});
export type CreateFaqInput = z.infer<typeof createFaqSchema>;

export const updateFaqSchema = z.object(faqFields).partial();
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;
