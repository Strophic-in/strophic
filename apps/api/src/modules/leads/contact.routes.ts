import { Hono } from "hono";
import { contactSchema } from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { requestContext } from "../../lib/request";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";
import { rateLimit } from "../../middleware/rate-limit";

/** Public contact form endpoint → creates a Lead + sends emails. */
export function contactRoutes(container: Container) {
  const app = new Hono<AppEnv>();

  app.post(
    "/",
    rateLimit({ windowMs: 60 * 60 * 1000, max: 20, keyPrefix: "contact" }),
    validate("json", contactSchema),
    async (c) => {
      const input = c.req.valid("json");
      // Honeypot tripped → pretend success so bots don't learn the field name.
      if (input.website) return ok(c, { success: true });

      const { ip, userAgent } = requestContext(c);
      const result = await container.leads.submit(input, {
        ip,
        userAgent,
        referrer: c.req.header("referer") ?? null,
      });
      return ok(c, { success: true, id: result.id });
    },
  );

  return app;
}
