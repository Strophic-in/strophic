import { z } from "zod";

export const productStatusValues = ["LIVE", "BETA", "SOON"] as const;

const hexColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "Use a hex color like #7c5cff");

const productFields = {
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphenated slug")
    .max(120),
  name: z.string().min(1, "Name is required").max(120),
  tagline: z.string().min(1, "Tagline is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  status: z.enum(productStatusValues),
  url: z.string().url().max(500).optional(),
  logoImage: z.string().max(500).optional(),
  pricing: z.string().min(1).max(120),
  features: z.array(z.string().max(120)).max(20),
  accentFrom: hexColor,
  accentTo: hexColor,
  content: z.string().max(50000).optional(),
  featured: z.boolean(),
  published: z.boolean(),
  order: z.number().int().min(0).max(9999),
};

export const createProductSchema = z.object({
  ...productFields,
  status: productFields.status.default("BETA"),
  features: productFields.features.default([]),
  accentFrom: productFields.accentFrom.default("#7c5cff"),
  accentTo: productFields.accentTo.default("#3d2689"),
  featured: productFields.featured.default(false),
  published: productFields.published.default(true),
  order: productFields.order.default(0),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object(productFields).partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
