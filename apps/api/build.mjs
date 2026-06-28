import { build } from "esbuild";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

// Vercel's zero-config Node builder transpiles the handler but does not bundle
// its imports. That breaks two ways here: ESM rejects our extensionless relative
// imports, and our @strophic/* workspace packages ship raw TypeScript (their
// `exports` point at ./src/*.ts) which Node can't execute.
//
// So we bundle the handler + all first-party TypeScript into one self-contained
// ESM function file. Real npm packages stay external, so Vercel's file tracer
// ships them into the lambda unchanged - importantly Prisma's runtime, which we
// must not bundle.
await build({
  entryPoints: [resolve(root, "src/vercel.ts")],
  outfile: resolve(root, "api/index.js"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  logLevel: "info",
  plugins: [
    {
      name: "externalize-npm",
      setup(b) {
        b.onResolve({ filter: /.*/ }, (args) => {
          if (args.kind === "entry-point") return null;
          // Relative/absolute imports -> inline into the bundle.
          if (args.path.startsWith(".") || args.path.startsWith("/")) return null;
          // First-party workspace packages ship raw TS -> inline them too.
          if (args.path.startsWith("@strophic/")) return null;
          // Everything else (npm deps, node: builtins) stays external for the
          // Vercel tracer to resolve from node_modules at runtime.
          return { path: args.path, external: true };
        });
      },
    },
  ],
});
