import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { config as loadEnv } from "dotenv";
import { createApp } from "./app";
import { loadConfig } from "./env";

// Local dev: load the repo-root .env (apps/api/src → repo root is three levels up).
// On Vercel, env vars come from the platform, so a missing file here is harmless.
const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, "../../../.env") });

const config = loadConfig();
const app = createApp(config);

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.warn(`[api] listening on http://localhost:${info.port}`);
});
