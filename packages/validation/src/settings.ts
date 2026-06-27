import { z } from "zod";

/**
 * Settings are stored as grouped key/value JSON rows. The API accepts a partial
 * update of a single group; finer per-key schemas live with each settings group
 * as the admin UI for them is built.
 */
export const settingsGroupSchema = z.enum(["company", "social", "email", "seo", "theme"]);
export type SettingsGroup = z.infer<typeof settingsGroupSchema>;

export const updateSettingsSchema = z.object({
  group: settingsGroupSchema,
  value: z.record(z.string(), z.unknown()),
});
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
