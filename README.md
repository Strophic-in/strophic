# Strophic

The web platform for **Strophic** (https://strophic.in) — an AI consulting & product company.

A monorepo with three independently deployable apps and shared packages. The goal is a premium,
fast, SEO/GEO-optimized site that converts visitors into qualified leads, backed by an admin
dashboard that runs the whole business.

> **New here?** Read [`CLAUDE.md`](./CLAUDE.md) — it's the source of truth for architecture,
> conventions, quality budgets, and the implementation roadmap.

## Apps & packages

| Path | What it is | Deploys to |
| --- | --- | --- |
| `apps/website` | Astro marketing site (static, SEO/GEO) | Cloudflare Pages |
| `apps/admin` | Next.js admin dashboard | Vercel |
| `apps/api` | Hono API on Cloudflare Workers | Cloudflare Workers |
| `packages/*` | Shared `ui`, `types`, `utils`, `validation`, `email`, `database`, `auth`, `seo`, `api-client`, `config` | — |

## Tech stack

npm workspaces + Turborepo · TypeScript (strict) · Astro · Next.js (App Router) · Hono ·
Prisma 7 + Neon Postgres · Tailwind v4 + shadcn/ui · Resend (email) · Supabase Storage (files).

## Getting started

```bash
npm install            # install all workspaces
npm run dev            # run all apps in dev
npm run build          # build everything (Turborepo, cached)
npm run lint           # lint
npm run typecheck      # type-check
npm test               # tests
```

Run a single app: `npm run dev -w apps/website` (or `apps/admin`, `apps/api`).

## Status

Built phase by phase — see the roadmap in [`CLAUDE.md`](./CLAUDE.md) §12. Current phase: **Phase 0 (foundations)**.

## License

Proprietary — © Strophic. All rights reserved.
