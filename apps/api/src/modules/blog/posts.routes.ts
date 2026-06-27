import { Hono } from "hono";
import { paginationSchema, slugParamSchema } from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";

/** Public, read-only blog endpoints (published posts only). */
export function postsRoutes(container: Container) {
  const app = new Hono<AppEnv>();

  app.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.blog.listPublished({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  });

  app.get("/:slug", validate("param", slugParamSchema), async (c) => {
    return ok(c, { post: await container.blog.getPublishedBySlug(c.req.valid("param").slug) });
  });

  return app;
}
