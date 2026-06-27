// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Static output (no adapter) → deploys to Cloudflare Pages. See CLAUDE.md §3.
export default defineConfig({
  site: "https://strophic.in",
  output: "static",
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
