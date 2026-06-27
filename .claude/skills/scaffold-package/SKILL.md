---
name: scaffold-package
description: Scaffold a new shared package in the Strophic monorepo under packages/. Use whenever you need to create a new internal package (e.g. "@strophic/email", "add a shared package for X", "create a new package", "spin up a utils/validation/seo package"), so it gets the standard package.json, tsconfig, exports, and lint setup consistent with the rest of the workspace. Use this instead of hand-rolling a package directory.
---

# Scaffold a Strophic monorepo package

Create a new internal package under `packages/<name>` that matches the repo's conventions
(see `CLAUDE.md` §4 and §6). Packages are imported as `@strophic/<name>`.

## Before you start
- Confirm the package name and one-line purpose. Names are short, `kebab-case` (e.g. `seo`, `api-client`).
- Decide if it is **server-only** (`database`, `auth`, `email`) — those must never be bundled into client
  code; note it in the README and keep Node-only deps out of any client entry.
- Decide its dependencies. Leaf packages (`types`, `utils`) must not depend on other internal packages.
  Never depend on anything in `apps/`.

## Steps

1. Create `packages/<name>/` with:
   - `package.json` — name `@strophic/<name>`, `"private": true`, `"type": "module"`, `version `0.0.0`.
     Use `exports` (not just `main`) pointing at `./src/index.ts` (or built output if the package is
     compiled). Add `"scripts": { "lint": "eslint .", "typecheck": "tsc --noEmit" }`.
   - `tsconfig.json` — `extends` the shared base from `@strophic/config` (`packages/config`); set
     `outDir`/`rootDir` only if the package is compiled rather than consumed as source.
   - `src/index.ts` — the public entrypoint; export the package's surface from here. Keep internals in
     sibling files and re-export.
   - `README.md` — purpose, public API, server-only flag, example import.

2. Wire it up:
   - Ensure the root `pnpm-workspace.yaml` already globs `packages/*` (it does after Phase 0).
   - Add `@strophic/<name>` to the `dependencies` of any package/app that will consume it. npm workspaces use
     `"@strophic/<name>": "*"` (there is no `workspace:` protocol in npm).
   - Run `npm install` so workspace symlinks are created. For a consumer that's a Next app, also add the package
     to `transpilePackages` in `next.config`.

3. Verify: `npm run typecheck -w packages/<name>` and `npm run lint -w packages/<name>` pass, and the consumer
   can import from `@strophic/<name>` without deep relative paths.

## Conventions to honor
- TypeScript strict; no `any`. Pure, framework-agnostic code where possible.
- Re-export a clean public API from `src/index.ts`; don't make consumers reach into internal files.
- If the package owns Zod schemas, it's probably `validation`; if it owns DB access, it's `database`.
  Don't duplicate those responsibilities in a new package — extend the existing one.
- Add any new package to `CLAUDE.md` §4 if it's a long-lived architectural package.
