import { handle } from "hono/vercel";
import { createApp } from "./app";
import { loadConfig } from "./env";

// Vercel Node serverless function. Env vars are injected by Vercel.
// This file is the esbuild entry; the bundled output (api/index.js) is the
// actual deployed function. See apps/api/build.mjs.
export const config = { runtime: "nodejs" };

const app = createApp(loadConfig());

export default handle(app);
