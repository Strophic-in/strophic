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

  // One-click unsubscribe for email links (GET, opaque token, idempotent). Returns a
  // tiny self-contained HTML confirmation rather than JSON so it renders in a browser.
  app.get("/unsubscribe", async (c) => {
    const token = c.req.query("token");
    if (token) await container.newsletter.unsubscribe(token);
    const siteUrl = container.config.siteUrl;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" /><title>Unsubscribed</title></head>
<body style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;color:#0f172a;">
<div style="max-width:480px;margin:80px auto;padding:32px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;text-align:center;">
<h1 style="font-size:20px;margin:0 0 12px;">You're unsubscribed</h1>
<p style="color:#475569;margin:0 0 24px;">You won't receive any more emails from us. Changed your mind? You can resubscribe anytime.</p>
<a href="${siteUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:12px;">Back to Strophic</a>
</div></body></html>`;
    return c.html(html);
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
