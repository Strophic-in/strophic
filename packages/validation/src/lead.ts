import { z } from "zod";
import { paginationSchema } from "./common";

export const leadStatusValues = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"] as const;
export const leadPriorityValues = ["LOW", "MEDIUM", "HIGH"] as const;

export const updateLeadSchema = z.object({
  status: z.enum(leadStatusValues).optional(),
  priority: z.enum(leadPriorityValues).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  assignedToId: z.string().min(1).nullable().optional(),
});
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const leadFilterSchema = paginationSchema.extend({
  status: z.enum(leadStatusValues).optional(),
});
export type LeadFilterInput = z.infer<typeof leadFilterSchema>;

export const leadNoteSchema = z.object({
  body: z.string().min(1, "Note can't be empty").max(2000),
});
export type LeadNoteInput = z.infer<typeof leadNoteSchema>;
