import { Hono } from "hono";
import { analyticsRangeSchema, trackEventSchema } from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { requestContext } from "../../lib/request";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";
import { requireRole } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rate-limit";

/** Public, write-only analytics ingest (rate-limited per IP). */
export function eventsRoutes(container: Container) {
  const app = new Hono<AppEnv>();

  app.post(
    "/",
    rateLimit({ windowMs: 60 * 1000, max: 120, keyPrefix: "events" }),
    validate("json", trackEventSchema),
    async (c) => {
      const { ip, userAgent } = requestContext(c);
      await container.analytics.track(c.req.valid("json"), { ip, userAgent });
      return ok(c, { success: true });
    },
  );

  return app;
}

/** Admin analytics dashboard (RBAC-gated, read-only). */
export function analyticsRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.use("*", requireRole(container.config, "EDITOR"));

  app.get("/", validate("query", analyticsRangeSchema), async (c) => {
    return ok(c, await container.analytics.dashboard(c.req.valid("query").days));
  });

  return app;
}
