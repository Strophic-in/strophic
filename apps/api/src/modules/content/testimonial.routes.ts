import { Hono } from "hono";
import {
  createTestimonialSchema,
  idParamSchema,
  paginationSchema,
  updateTestimonialSchema,
} from "@strophic/validation";
import type { Container } from "../../container";
import type { AppEnv } from "../../context";
import { ok } from "../../lib/response";
import { validate } from "../../lib/validate";
import { requireRole } from "../../middleware/auth";

/** Admin testimonial management (RBAC-gated). */
export function testimonialRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.use("*", requireRole(container.config, "EDITOR"));

  app.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.testimonials.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  });

  app.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { testimonial: await container.testimonials.get(c.req.valid("param").id) });
  });

  app.post("/", validate("json", createTestimonialSchema), async (c) => {
    return ok(c, { testimonial: await container.testimonials.create(c.req.valid("json")) });
  });

  app.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updateTestimonialSchema),
    async (c) => {
      const testimonial = await container.testimonials.update(
        c.req.valid("param").id,
        c.req.valid("json"),
      );
      return ok(c, { testimonial });
    },
  );

  app.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.testimonials.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });

  return app;
}

/** Public, read-only testimonials (published only). */
export function publicTestimonialRoutes(container: Container) {
  const app = new Hono<AppEnv>();
  app.get("/", async (c) => {
    const { items } = await container.testimonials.listPublished();
    return ok(c, { items });
  });
  return app;
}
