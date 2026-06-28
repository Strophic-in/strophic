import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.email().trim().toLowerCase(),
  company: z.string().max(160).optional(),
  service: z.string().max(80).optional(),
  message: z.string().min(10, "Please add a little more detail").max(5000),
  source: z.string().max(40).optional(),
  utm: z.record(z.string(), z.string()).optional(),
  // Honeypot - legitimate users never fill this; bots do. Must stay empty.
  website: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;
