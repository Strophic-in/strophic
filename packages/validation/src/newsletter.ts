import { z } from "zod";

export const newsletterSubscribeSchema = z.object({
  email: z.email().trim().toLowerCase(),
  source: z.string().max(40).optional(),
  // Honeypot.
  website: z.string().max(0).optional(),
});
export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;

export const newsletterUnsubscribeSchema = z.object({
  token: z.string().min(1, "Unsubscribe token is required"),
});
export type NewsletterUnsubscribeInput = z.infer<typeof newsletterUnsubscribeSchema>;
