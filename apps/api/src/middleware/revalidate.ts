import { createMiddleware } from "hono/factory";
import type { Container } from "../container";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Route prefixes whose mutations change what the public website renders, so a
// successful change here should rebuild the static site. (Leads, media, todos,
// analytics, newsletter, auth do not affect public pages.)
const REBUILD_PREFIXES = [
  "/api/v1/blog",
  "/api/v1/settings",
  "/api/v1/admin/testimonials",
  "/api/v1/admin/faqs",
  "/api/v1/admin/projects",
  "/api/v1/admin/products",
  "/api/v1/admin/services",
  "/api/v1/admin/team",
  "/api/v1/admin/homepage",
];

/**
 * After a successful content mutation, trigger a website rebuild (best-effort).
 * No-op when DEPLOY_HOOK_URL is unset. Mounted once on the v1 router.
 */
export function revalidateAfterMutation(container: Container) {
  return createMiddleware(async (c, next) => {
    await next();
    if (!container.config.deployHookUrl) return;
    if (!MUTATING.has(c.req.method)) return;
    if (c.res.status >= 400) return;
    if (!REBUILD_PREFIXES.some((p) => c.req.path.startsWith(p))) return;
    await container.deploy.triggerRebuild();
  });
}
