import { Hono } from "hono";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { UnauthorizedError } from "../../lib/errors";
import { ok } from "../../lib/response";

/**
 * Scheduled-job endpoints, invoked by Vercel Cron. Protected by CRON_SECRET:
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically when the env
 * var is set. When no secret is configured we only allow it outside production
 * (local testing); in production a missing secret means the job is disabled.
 */
export function cronRoutes(container: Container) {
  const app = new Hono<AppEnv>();

  app.use("*", async (c, next) => {
    const secret = container.config.cronSecret;
    if (secret) {
      const auth = c.req.header("authorization");
      if (auth !== `Bearer ${secret}`) throw new UnauthorizedError("Invalid cron credentials");
    } else if (container.config.isProd) {
      throw new UnauthorizedError("Cron is not configured");
    }
    await next();
  });

  app.get("/reminders", async (c) => {
    return ok(c, await container.reminders.runDailyDigest());
  });

  return app;
}
