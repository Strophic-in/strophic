import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import type { ApiSuccess } from "@strophic/types";
import { createContainer } from "./container";
import type { AppEnv } from "./context";
import type { AppConfig } from "./env";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { authRoutes } from "./modules/auth/auth.routes";
import { blogRoutes } from "./modules/blog/blog.routes";
import { postsRoutes } from "./modules/blog/posts.routes";
import { contactRoutes } from "./modules/leads/contact.routes";
import { leadRoutes } from "./modules/leads/lead.routes";
import { mediaRoutes } from "./modules/media/media.routes";
import { newsletterRoutes } from "./modules/newsletter/newsletter.routes";
import { settingsRoutes } from "./modules/settings/settings.routes";

/** Build the fully-wired Hono application for a given config. */
export function createApp(config: AppConfig) {
  const container = createContainer(config);
  const app = new Hono<AppEnv>();

  app.use(
    "*",
    cors({
      origin: config.corsOrigins,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );
  // CSRF: for unsafe methods, require the Origin to be one of our front-ends.
  app.use("*", csrf({ origin: config.corsOrigins }));

  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  app.get("/health", (c) => {
    const body: ApiSuccess<{ status: string; service: string }> = {
      ok: true,
      data: { status: "healthy", service: "strophic-api" },
    };
    return c.json(body);
  });

  const v1 = new Hono<AppEnv>();
  v1.route("/auth", authRoutes(container));
  v1.route("/contact", contactRoutes(container));
  v1.route("/newsletter", newsletterRoutes(container));
  v1.route("/posts", postsRoutes(container));
  v1.route("/leads", leadRoutes(container));
  v1.route("/media", mediaRoutes(container));
  v1.route("/settings", settingsRoutes(container));
  v1.route("/blog", blogRoutes(container));
  app.route("/api/v1", v1);

  return app;
}
