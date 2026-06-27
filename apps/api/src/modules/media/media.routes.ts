import { Hono } from "hono";
import {
  idParamSchema,
  paginationSchema,
  persistMediaSchema,
  presignUploadSchema,
} from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";
import { getUser, requireRole } from "../../middleware/auth";

export function mediaRoutes(container: Container) {
  const app = new Hono<AppEnv>();

  // All media operations require at least an editor.
  app.use("*", requireRole(container.config, "EDITOR"));

  app.post("/presign", validate("json", presignUploadSchema), async (c) => {
    return ok(c, await container.media.createPresignedUpload(c.req.valid("json")));
  });

  app.post("/", validate("json", persistMediaSchema), async (c) => {
    const media = await container.media.persist(c.req.valid("json"), getUser(c).id);
    return ok(c, { media });
  });

  app.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.media.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  });

  app.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.media.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });

  return app;
}
