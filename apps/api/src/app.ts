import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import type { ApiSuccess } from "@strophic/types";
import { createContainer } from "./container";
import type { AppEnv } from "./context";
import type { AppConfig } from "./env";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { authRoutes } from "./modules/auth/auth.routes";
import { blogRoutes } from "./modules/blog/blog.routes";
import { postsRoutes } from "./modules/blog/posts.routes";
import { analyticsRoutes, eventsRoutes } from "./modules/analytics/analytics.routes";
import { faqRoutes, publicFaqRoutes } from "./modules/content/faq.routes";
import { homepageRoutes, publicHomepageRoutes } from "./modules/content/homepage.routes";
import { productRoutes, publicProductRoutes } from "./modules/content/product.routes";
import { projectRoutes, publicProjectRoutes } from "./modules/content/project.routes";
import {
  publicServiceOfferingRoutes,
  serviceOfferingRoutes,
} from "./modules/content/service-offering.routes";
import { publicTeamRoutes, teamRoutes } from "./modules/content/team.routes";
import {
  publicTestimonialRoutes,
  testimonialRoutes,
} from "./modules/content/testimonial.routes";
import { todoRoutes } from "./modules/content/todo.routes";
import { contactRoutes } from "./modules/leads/contact.routes";
import { cronRoutes } from "./modules/reminders/cron.routes";
import { leadRoutes } from "./modules/leads/lead.routes";
import { mediaRoutes } from "./modules/media/media.routes";
import { newsletterRoutes } from "./modules/newsletter/newsletter.routes";
import { settingsRoutes } from "./modules/settings/settings.routes";

/** Build the fully-wired Hono application for a given config. */
export function createApp(config: AppConfig) {
  const container = createContainer(config);
  const app = new Hono<AppEnv>();

  // Security response headers. The API serves JSON only, so a deny-all CSP is safe
  // and strong; HSTS is enabled in production (HTTPS) only.
  app.use(
    "*",
    secureHeaders({
      contentSecurityPolicy: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      xFrameOptions: "DENY",
      referrerPolicy: "no-referrer",
      crossOriginResourcePolicy: "same-site",
      strictTransportSecurity: config.isProd
        ? "max-age=63072000; includeSubDomains; preload"
        : false,
    }),
  );

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
  v1.route("/testimonials", publicTestimonialRoutes(container));
  v1.route("/faqs", publicFaqRoutes(container));
  v1.route("/projects", publicProjectRoutes(container));
  v1.route("/products", publicProductRoutes(container));
  v1.route("/services", publicServiceOfferingRoutes(container));
  v1.route("/team", publicTeamRoutes(container));
  v1.route("/homepage", publicHomepageRoutes(container));
  v1.route("/events", eventsRoutes(container));
  v1.route("/leads", leadRoutes(container));
  v1.route("/media", mediaRoutes(container));
  v1.route("/settings", settingsRoutes(container));
  v1.route("/blog", blogRoutes(container));
  v1.route("/admin/testimonials", testimonialRoutes(container));
  v1.route("/admin/faqs", faqRoutes(container));
  v1.route("/admin/projects", projectRoutes(container));
  v1.route("/admin/products", productRoutes(container));
  v1.route("/admin/services", serviceOfferingRoutes(container));
  v1.route("/admin/team", teamRoutes(container));
  v1.route("/admin/homepage", homepageRoutes(container));
  v1.route("/admin/todos", todoRoutes(container));
  v1.route("/admin/analytics", analyticsRoutes(container));
  v1.route("/cron", cronRoutes(container));
  app.route("/api/v1", v1);

  return app;
}
