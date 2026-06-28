import { getRequestListener } from "@hono/node-server";
import { createApp } from "./app";
import { loadConfig } from "./env";

// Vercel Node serverless function. Env vars are injected by Vercel.
// This file is the esbuild entry; the bundled output (api/index.js) is the
// actual deployed function. See apps/api/build.mjs.
//
// Vercel's Node runtime invokes the default export with the Node
// `(req, res) => void` signature, so we adapt Hono's web `fetch` handler with
// @hono/node-server's request listener rather than `hono/vercel`'s `handle`
// (which returns a web `Response` Vercel's Node runtime ignores).
export const config = { runtime: "nodejs" };

const app = createApp(loadConfig());

export default getRequestListener(app.fetch);
