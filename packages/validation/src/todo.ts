import { z } from "zod";
import { paginationSchema } from "./common";

export const todoStatusValues = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const todoPriorityValues = ["LOW", "MEDIUM", "HIGH"] as const;

// undefined → omitted (untouched); null/"" → clear; string/Date → Date.
const nullableDate = z
  .preprocess((v) => (v === "" || v === null ? null : v), z.coerce.date().nullable())
  .optional();

const todoFields = {
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().max(4000).optional(),
  status: z.enum(todoStatusValues),
  priority: z.enum(todoPriorityValues),
  dueDate: nullableDate,
  reminderAt: nullableDate,
};

export const createTodoSchema = z.object({
  ...todoFields,
  status: todoFields.status.default("TODO"),
  priority: todoFields.priority.default("MEDIUM"),
});
export type CreateTodoInput = z.infer<typeof createTodoSchema>;

export const updateTodoSchema = z.object(todoFields).partial();
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

export const todoFilterSchema = paginationSchema.extend({
  status: z.enum(todoStatusValues).optional(),
});
export type TodoFilterInput = z.infer<typeof todoFilterSchema>;
