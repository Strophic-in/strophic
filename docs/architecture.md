# Architecture

Strophic is a monorepo with three independently deployable apps and a set of shared
packages. Type-safety flows end-to-end: Zod schemas and TypeScript types are defined
once in `packages/*` and reused by the API, admin, and website.

See `CLAUDE.md` for the full rationale behind each decision; this file is a map.

## Apps

| App | Stack | Role | Deploys to |
|---|---|---|---|
| `apps/website` | Astro (static) + Tailwind + MDX + React islands | Public marketing/lead-gen site | Cloudflare Pages |
| `apps/admin` | Next.js (App Router) + shadcn/ui + TanStack Query | Auth-gated business dashboard | Vercel |
| `apps/api` | Hono on Node | REST API (`/api/v1`) | Vercel (serverless) |

## Packages

- `config` - shared tsconfig / eslint / prettier / Tailwind preset + tokens.
- `types` - shared TS types / DTOs (no runtime code).
- `utils` - framework-agnostic helpers (slugify, dates, reading time).
- `validation` - Zod schemas; the single source of truth for API + form validation.
- `database` - Prisma schema, generated client, repositories, seeds (Neon Postgres).
- `auth` - JWT (jose), scrypt password hashing, refresh-token rotation, RBAC.
- `email` - `EmailProvider` interface + Resend/console providers + templates.
- `seo` - metadata, Open Graph, JSON-LD, sitemap/RSS helpers.
- `api-client` - typed fetch client (admin uses it; website uses a build-time loader).
- `ui` - shared React + Tailwind components.

Dependency direction: `apps/*` depend on `packages/*`; packages depend only on
lower-level packages. `database`/`auth`/`email` are server-only.

## Request flow (API)

Clean architecture keeps the HTTP layer a thin, swappable edge:

```
route/controller  → parse + validate (Zod), shape the HTTP response
      │
   service        → business logic, framework-agnostic
      │
  repository      → data access over Prisma (one per aggregate)
```

Controllers never touch Prisma; services never touch `Request`/`Response`. Everything
is wired once in `apps/api/src/container.ts` (dependency injection) and mounted in
`apps/api/src/app.ts`. Two entrypoints share the same `createApp`:
`src/server.ts` (local Node via `@hono/node-server`) and `api/index.ts` (Vercel via
`hono/vercel`).

Middleware order: `secureHeaders` → `cors` → `csrf` → routes, with a central error
handler mapping typed errors to `{ ok:false, error:{ code, message, details? } }`.

## Website content (build time)

The website is static. `apps/website/src/lib/content.ts` fetches published content
from the API at build time and **falls back to the curated `src/data/*` placeholders**
when the API is empty or unreachable - so the build never breaks and switches to real
content on the next rebuild after publishing.

## Cross-cutting

- **Auth**: JWT access token (~15m) + rotating refresh tokens (reuse detection +
  family revoke) in httpOnly/Secure/SameSite=Lax cookies; RBAC (SUPER_ADMIN/ADMIN/EDITOR).
- **Analytics**: first-party, cookieless. Visitor identity is a salted SHA-256 of
  IP+UA with a daily-rotating salt - no raw IP stored, no cross-day correlation.
- **Reminders**: Vercel Cron → `GET /api/v1/cron/reminders` (Bearer `CRON_SECRET`).
