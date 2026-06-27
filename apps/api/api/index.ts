import { handle } from "hono/vercel";
import { createApp } from "../src/app";
import { loadConfig } from "../src/env";

// Vercel Node serverless function. Env vars are injected by Vercel.
export const config = { runtime: "nodejs" };

const app = createApp(loadConfig());

export default handle(app);
