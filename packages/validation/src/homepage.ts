import { z } from "zod";

const homepageSectionFields = {
  key: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphenated key")
    .max(60),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(400).optional(),
  enabled: z.boolean(),
  order: z.number().int().min(0).max(9999),
  config: z.record(z.string(), z.unknown()),
};

export const upsertHomepageSectionSchema = z.object({
  ...homepageSectionFields,
  enabled: homepageSectionFields.enabled.default(true),
  order: homepageSectionFields.order.default(0),
  config: homepageSectionFields.config.default({}),
});
export type UpsertHomepageSectionInput = z.infer<typeof upsertHomepageSectionSchema>;

export const updateHomepageSectionSchema = z
  .object(homepageSectionFields)
  .omit({ key: true })
  .partial();
export type UpdateHomepageSectionInput = z.infer<typeof updateHomepageSectionSchema>;
