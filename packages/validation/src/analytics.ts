import { z } from "zod";

/** Public page-view / event beacon payload (visitor identity is derived server-side). */
export const trackEventSchema = z.object({
  type: z.enum(["pageview", "event"]).default("pageview"),
  name: z.string().max(80).optional(),
  path: z.string().min(1).max(512),
  referrer: z.string().max(512).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
});
export type TrackEventInput = z.infer<typeof trackEventSchema>;

/** Time-window query for the admin analytics dashboard. */
export const analyticsRangeSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});
export type AnalyticsRangeInput = z.infer<typeof analyticsRangeSchema>;
