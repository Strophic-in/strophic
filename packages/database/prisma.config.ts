import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Load the repo-root .env so DATABASE_URL / DIRECT_URL are available to the CLI.
const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Migrations / introspection connect via the DIRECT (non-pooled) Neon URL.
  // The runtime client connects separately through the Neon driver adapter.
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
