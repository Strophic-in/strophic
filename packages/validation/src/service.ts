import { z } from "zod";

export const serviceWorkflowStepSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(400),
});

export const serviceFaqSchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(2000),
});

const serviceFields = {
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphenated slug")
    .max(120),
  icon: z.string().min(1).max(40),
  image: z.string().max(500).optional(),
  title: z.string().min(1, "Title is required").max(160),
  summary: z.string().min(1, "Summary is required").max(400),
  description: z.string().min(1, "Description is required").max(4000),
  benefits: z.array(z.string().max(200)).max(20),
  stack: z.array(z.string().max(40)).max(30),
  workflow: z.array(serviceWorkflowStepSchema).max(12),
  faqs: z.array(serviceFaqSchema).max(20),
  featured: z.boolean(),
  published: z.boolean(),
  order: z.number().int().min(0).max(9999),
};

export const createServiceSchema = z.object({
  ...serviceFields,
  icon: serviceFields.icon.default("sparkles"),
  benefits: serviceFields.benefits.default([]),
  stack: serviceFields.stack.default([]),
  workflow: serviceFields.workflow.default([]),
  faqs: serviceFields.faqs.default([]),
  featured: serviceFields.featured.default(false),
  published: serviceFields.published.default(true),
  order: serviceFields.order.default(0),
});
export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = z.object(serviceFields).partial();
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
