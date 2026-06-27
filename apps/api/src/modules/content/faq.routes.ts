import { Hono } from "hono";
import {
  createFaqSchema,
  idParamSchema,
  paginationSchema,
  updateFaqSchema,
} from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";
import { requireRole } from "../../middleware/auth";

/** Admin FAQ management (RBAC-gated). */
export function faqRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.use("*", requireRole(container.config, "EDITOR"));

  app.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.faqs.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  });

  app.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { faq: await container.faqs.get(c.req.valid("param").id) });
  });

  app.post("/", validate("json", createFaqSchema), async (c) => {
    return ok(c, { faq: await container.faqs.create(c.req.valid("json")) });
  });

  app.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updateFaqSchema),
    async (c) => {
      const faq = await container.faqs.update(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, { faq });
    },
  );

  app.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.faqs.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });

  return app;
}

/** Public, read-only FAQs (published only). */
export function publicFaqRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.get("/", async (c) => {
    const { items } = await container.faqs.listPublished();
    return ok(c, { items });
  });
  return app;
}
