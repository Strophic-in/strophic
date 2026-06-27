import { Hono } from "hono";
import { blogFilterSchema, createPostSchema, idParamSchema, updatePostSchema } from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";
import { getUser, requireRole } from "../../middleware/auth";

/** Admin blog management (RBAC-gated). */
export function blogRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.use("*", requireRole(container.config, "EDITOR"));

  app.get("/", validate("query", blogFilterSchema), async (c) => {
    const { page, pageSize, status } = c.req.valid("query");
    const { items, total } = await container.blog.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
      status,
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  });

  app.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { post: await container.blog.get(c.req.valid("param").id) });
  });

  app.post("/", validate("json", createPostSchema), async (c) => {
    const post = await container.blog.create(c.req.valid("json"), getUser(c).id);
    return ok(c, { post });
  });

  app.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updatePostSchema),
    async (c) => {
      const post = await container.blog.update(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, { post });
    },
  );

  app.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.blog.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });

  return app;
}
