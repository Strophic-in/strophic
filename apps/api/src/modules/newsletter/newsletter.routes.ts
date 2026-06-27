import { Hono } from "hono";
import {
  newsletterSubscribeSchema,
  newsletterUnsubscribeSchema,
  paginationSchema,
} from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";
import { requireRole } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rate-limit";

export function newsletterRoutes(container: Container) {
  const app = new Hono<AppEnv>();

  app.post(
    "/subscribe",
    rateLimit({ windowMs: 60 * 60 * 1000, max: 30, keyPrefix: "newsletter" }),
    validate("json", newsletterSubscribeSchema),
    async (c) => {
      const input = c.req.valid("json");
      if (input.website) return ok(c, { success: true }); // honeypot
      await container.newsletter.subscribe(input.email, input.source);
      return ok(c, { success: true });
    },
  );

  app.post("/unsubscribe", validate("json", newsletterUnsubscribeSchema), async (c) => {
    await container.newsletter.unsubscribe(c.req.valid("json").token);
    return ok(c, { success: true });
  });

  // Admin: list subscribers.
  app.get("/", requireRole(container.config, "ADMIN"), validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.newsletter.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  });

  return app;
}
