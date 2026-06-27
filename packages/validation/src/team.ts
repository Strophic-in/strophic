import { z } from "zod";

const teamMemberFields = {
  name: z.string().min(1, "Name is required").max(120),
  role: z.string().min(1, "Role is required").max(120),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().max(500).optional(),
  links: z.record(z.string(), z.string().url().max(500)),
  published: z.boolean(),
  order: z.number().int().min(0).max(9999),
};

export const createTeamMemberSchema = z.object({
  ...teamMemberFields,
  links: teamMemberFields.links.default({}),
  published: teamMemberFields.published.default(true),
  order: teamMemberFields.order.default(0),
});
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;

export const updateTeamMemberSchema = z.object(teamMemberFields).partial();
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
