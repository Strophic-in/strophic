# CLAUDE.md — Strophic Platform

> Source-of-truth guidance for any agent or engineer working in this repository.
> Read this fully before making changes. When you change architecture, update this file in the same change.

---

## 1. What this is

**Strophic** (https://strophic.in) is an AI consulting & product company. This repository is the
company's full web platform: the public marketing/lead-gen website, an admin dashboard that runs the
whole business (CMS, leads/CRM, media, todos, settings, analytics), and the backend API that powers both.

Strophic offers: AI integration, workflow & business-process automation, custom software, AI agents,
chatbots, internal tools, enterprise apps, cloud solutions, API integrations — and ships its own
Micro-SaaS products.

**Primary business goal of the site: convert visitors (from Instagram, X, LinkedIn, Google, referrals)
into qualified leads.** Every architectural and design decision serves that, plus SEO/GEO, speed,
accessibility, and long-term maintainability.

---

## 2. Project status

> **PHASE 0 COMPLETE.** The monorepo, shared config, leaf packages, `ui` skeleton, three booting apps, and
> the CI skeleton are in place with a green, cached pipeline. Application code continues **phase by phase,
> only after the owner approves each phase.** Do not write feature code ahead of an approved phase.
> See **§12 Roadmap** for the current phase.

Update the "Current phase" line in §12 whenever a phase starts or completes.

---

## 3. Architecture at a glance & the decisions behind it

Monorepo, three independently deployable apps, shared packages. **Type-safety flows end-to-end**: Zod
schemas and TypeScript types are defined once in shared packages and reused by the API, admin, and website.

| Concern | Choice | Why |
|---|---|---|
| Monorepo | **npm workspaces + Turborepo** | Cached, affected-only builds; clean per-app deploys; npm keeps tooling simple and its single hoisted `node_modules` helps keep one React copy across Astro/Next. |
| Public website | **Astro + TS + Tailwind + MDX** | Ships zero JS by default → best Lighthouse/SEO. React used only as islands for interactivity. |
| Admin dashboard | **Next.js (App Router) + TS + Tailwind + shadcn/ui + TanStack Query + React Hook Form + Zod** | Rich app behind auth where bundle size matters less than DX. |
| Backend API | **Hono on Cloudflare Workers** | See note below — Fastify cannot run on Workers. Hono is Workers-native, Fastify-like DX, edge-fast, cheap. |
| ORM / DB | **Prisma 7 + Neon Postgres** (`@prisma/adapter-neon`, generator `runtime="workerd"`) | Prisma as requested; the Neon serverless driver + the rust-free `workerd` client is what makes Prisma run on Workers. |
| Storage | **Cloudflare R2** (S3-compatible) | Images/media; served via CDN. |
| Email | **Provider-abstracted** (Resend HTTP first) | SMTP can't run on Workers; Resend is the edge sender. Adapter pattern so SES/SendGrid/Zoho swap with zero business-logic change. |
| Auth | **JWT access + rotating refresh tokens in httpOnly secure cookies, RBAC** | Standard, secure, stateless access + revocable refresh. |

### ⚠️ Key deviation from the original brief — backend runtime
The brief asked for **Fastify on Cloudflare Workers**. **Fastify cannot run on Workers** — it depends on
Node's `http` server, which Workers don't provide. Workers was the stated *preferred* deploy target, so we
keep Workers and use **Hono** (Workers-native, near-identical ergonomics). If the owner prefers to keep
Fastify verbatim, the alternative is **Fastify on a Node host (Railway/Fly.io/Render)** — same clean
architecture, different runtime. The code is structured so the HTTP framework is a thin edge layer over
framework-agnostic services/repositories, making this swap cheap. **Confirm this choice before Phase 3.**

### Other gotchas to remember
- **Astro + Framer Motion**: Framer Motion only runs inside React islands (client-side). Keep marketing
  pages mostly static; prefer CSS / Astro view-transitions for ambient motion, and reserve React islands +
  Framer Motion for genuinely interactive bits. Never ship a heavy JS animation lib on a static page.
- **Prisma on Workers**: Prisma 7 with generator `runtime="workerd"` + `@prisma/adapter-neon`. Migrations run
  from Node/CI against Neon's **direct** URL; the Worker uses the **pooled** URL and instantiates the client
  **per request**. Rust-free client is small, but verify the bundle with `wrangler deploy --dry-run`.
- **shadcn/ui is React**: shared in `packages/ui`, consumed directly by admin (Next) and as islands by the
  website (Astro `@astrojs/react`). Marketing-only static components can be authored as `.astro`.
- **No SMTP on Workers**: send transactional email via an HTTP API (**Resend** at launch). Zoho/SES/SendGrid are
  swappable adapters behind `EmailProvider`; an SMTP adapter only works from a Node context, never the Worker.
- **Astro deploy**: `@astrojs/cloudflare` dropped Cloudflare *Pages* SSR — the website builds **static** and
  deploys to Pages (no adapter), rebuilt on content publish. Upgrade path: Workers Static Assets for on-demand SSR.
- **Crypto on Workers**: bcrypt won't run and Web Crypto PBKDF2 is iteration-capped — hash passwords with
  `@noble/hashes` scrypt; sign/verify JWTs with `jose` (Web Crypto based). Tailwind is v4 (CSS-first `@theme`);
  use `@tailwindcss/vite` in Astro and `@tailwindcss/postcss` in Next — not the old `@astrojs/tailwind`.

---

## 4. Repository layout

```
strophic/
├── apps/
│   ├── website/        # Astro — public marketing site (SEO/GEO, lead capture)
│   ├── admin/          # Next.js — admin dashboard (auth-gated)
│   └── api/            # Hono on Cloudflare Workers — REST API (/api/v1)
├── packages/
│   ├── ui/             # Shared React + Tailwind + shadcn/ui components + design tokens
│   ├── types/          # Shared TS types / DTOs (no runtime code)
│   ├── utils/          # Framework-agnostic helpers (dates, slugify, formatting)
│   ├── validation/     # Zod schemas — single source of truth for API + forms
│   ├── email/          # Email service + provider adapters (zoho-smtp, resend, ses, ...)
│   ├── database/       # Prisma schema, generated client, repositories, seeds
│   ├── auth/           # JWT, password hashing, RBAC, token rotation helpers
│   ├── seo/            # Metadata, Open Graph, Schema.org/JSON-LD, sitemap helpers
│   ├── api-client/     # Typed fetch client (admin & website call the API through this)
│   └── config/         # Shared tsconfig, eslint, prettier, tailwind presets
├── docs/               # architecture.md, api.md, database.md, deployment.md, env.md
├── infrastructure/     # wrangler config, IaC notes, GitHub Actions docs
├── scripts/            # dev bootstrap, db migrate/seed, codegen
├── .github/workflows/  # CI/CD (lint, typecheck, build, test, deploy)
└── .claude/skills/     # Project skills (see §11)
```

**Dependency direction**: `apps/*` depend on `packages/*`; packages may depend on lower-level packages
(`utils`, `types` are leaves). Packages must NOT import from apps. `database`/`auth`/`email` are
server-only and must never be imported into website/admin client bundles.

---

## 5. Commands

> These become available after Phase 0 scaffolds the monorepo. Run from repo root unless noted.

```bash
npm install                       # install all workspaces
npm run dev                       # run all apps in dev (turbo)
npm run dev -w apps/website       # run a single app
npm run dev -w apps/admin
npm run dev -w apps/api           # wrangler dev

npm run build                     # turbo build (affected/cached)
npm run lint                      # eslint across workspaces
npm run typecheck                 # tsc --noEmit across workspaces
npm test                          # unit/integration tests
npm run format                    # prettier

# Database (packages/database)
npm run db:generate               # prisma generate
npm run db:migrate                # prisma migrate dev (uses DIRECT_URL)
npm run db:deploy                 # prisma migrate deploy (prod/CI)
npm run db:seed                   # seed reference/dev data
npm run db:studio                 # prisma studio
```

**Before considering any task done**: `npm run typecheck && npm run lint && npm run build` must pass. Use the
`preflight` skill for the full pre-deploy gate.

---

## 6. Engineering conventions

- **Clean architecture in the API**: `route/controller` (HTTP edge, parse/validate) → `service`
  (business logic, framework-agnostic) → `repository` (data access over Prisma). Controllers never touch
  Prisma directly; services never touch `Request`/`Response`. This is what makes the runtime swappable.
- **Repository pattern**: all DB access goes through repositories in `packages/database`. One repository
  per aggregate (leads, posts, projects, ...). Repositories return domain types, not raw Prisma rows leaking
  everywhere.
- **SOLID**, small modules, dependency injection by passing collaborators (no hidden singletons for
  testability). Pure functions in `utils`.
- **Validation once**: define Zod schemas in `packages/validation`; infer TS types from them; reuse on the
  API (request validation), admin (React Hook Form resolver), and website (contact/newsletter forms).
- **TypeScript strict** everywhere. No `any` (use `unknown` + narrowing). No non-null `!` to silence the
  compiler — model the type correctly.
- **Naming**: files `kebab-case`; React components `PascalCase`; vars/functions `camelCase`; types/enums
  `PascalCase`; constants `SCREAMING_SNAKE`. Route handlers thin; logic in services.
- **Imports**: use workspace package names (`@strophic/ui`, `@strophic/validation`, ...), not deep relative
  paths across packages.
- **Errors**: typed error classes in the API; never leak stack traces or DB errors to clients; map to a
  consistent JSON error shape `{ error: { code, message, details? } }`.
- **No secrets in code**. All config via env (see §9). Commit `.env.example`, never `.env`.
- **Comments** explain *why*, not *what*. Match the density and idiom of surrounding code.

---

## 7. Design & UX principles

Premium, modern, fast — inspiration (not copies) from Vercel, Stripe, Linear, Notion, Supabase, Framer,
OpenAI. **Mobile-first.** Subtle, purposeful motion only (Linear/Stripe restraint) — never gratuitous.

- Design tokens (color, type scale, spacing, radii, shadows, motion durations/easings) live in
  `packages/ui` and Tailwind preset in `packages/config`. Don't hardcode hex/spacing in components.
- Accessibility is non-negotiable: semantic HTML, labelled controls, visible focus states, keyboard paths,
  `prefers-reduced-motion` respected, color contrast AA+. The `web-design-guidelines` and `frontend-design`
  skills (in `.agents/skills/`) are the review references.
- Every page: clear primary CTA toward lead capture; no dead ends.

---

## 8. Quality budgets (enforce, don't aspire)

- Lighthouse (website): **Performance > 95, SEO 100, Accessibility > 95, Best-Practices > 95.**
- Core Web Vitals green. Ship minimal JS on marketing pages. Optimize/responsive images (R2 + correct
  sizes, lazy, `width`/`height` set). Preload fonts, subset them.
- SEO/GEO baseline on every public page: unique title/description, canonical, Open Graph + Twitter cards,
  JSON-LD (Organization, Service, Article, BreadcrumbList, FAQPage as applicable), dynamic sitemap,
  robots.txt, RSS for blog, breadcrumbs, semantic headings. Helpers live in `packages/seo`.

---

## 9. Environment & secrets

- Each app owns a `.env.example`; consolidated reference lives in `docs/env.md`.
- API secrets on Cloudflare Workers via `wrangler secret` / Workers env bindings (DATABASE_URL, JWT
  secrets, RESEND_API_KEY, R2 keys). Admin secrets in Vercel project env. Website needs only public build vars.
- Never log secrets. Never commit real credentials. Rotate the seeded admin password immediately.

Core vars (see `docs/env.md` for the full list): `DATABASE_URL` (pooled), `DIRECT_URL` (migrations),
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM`, `R2_*`,
`PUBLIC_API_URL`, `PUBLIC_SITE_URL`, `ADMIN_URL`, `CONTACT_NOTIFY_EMAIL`.

---

## 10. Deployment

| App | Target |
|---|---|
| website | Cloudflare Pages |
| admin | Vercel |
| api | Cloudflare Workers (Wrangler) |
| database | Neon Postgres |
| storage | Cloudflare R2 |

Each app deploys independently; CI uses Turborepo affected-graph so only changed apps build/deploy.
GitHub Actions: lint → typecheck → build → test → deploy (per-app). See `docs/deployment.md`.

---

## 11. Project skills (`.claude/skills/`)

Use these to keep work consistent with the conventions above. Invoke as `/<name>`.

- **scaffold-package** — create a new shared package under `packages/` with standard config & exports.
- **add-api-resource** — add a full vertical slice (Prisma model → repository → Zod schema → service →
  Hono route → api-client method) following clean architecture + repository pattern.
- **new-content** — author SEO-correct marketing content (blog MDX post / project / service) with proper
  frontmatter, reading time, OG image, and JSON-LD.
- **preflight** — pre-deploy quality gate: typecheck, lint, build, test, and Lighthouse/SEO budget reminders.

Other available skills: `frontend-design`, `web-design-guidelines`, `webapp-testing` (in `.agents/skills/`).

---

## 12. Implementation roadmap

> **Current phase: Phase 0 ✅ COMPLETE — next up: Phase 1 (Data & API core), pending owner approval.**

Build strictly in order; each phase is independently shippable and must pass §5 checks before the next.

- **Phase 0 — Foundations** ✅: monorepo (npm+turbo), shared `config` (tsconfig/eslint/prettier/tailwind
  tokens), `types`, `utils`, `ui` skeleton, three booting apps, CI skeleton. *Green, cached pipeline; API
  `/health` responds.*
- **Phase 1 — Data & API core**: Prisma schema + Neon, `database` repositories, Hono API skeleton, health,
  error model, `auth` (JWT/refresh/RBAC), admin login + password reset, `email` adapter (Zoho).
- **Phase 2 — Public website (static + SEO)**: design system, home, about, services, contact, portfolio,
  micro-saas, blog (MDX), careers, "meet the founder" portfolio-redirect page. SEO/GEO + perf budgets met.
- **Phase 3 — Lead engine**: contact + newsletter forms → API → DB → confirmation + notification emails →
  appear in admin. (Confirm backend runtime before starting — see §3.)
- **Phase 4 — Admin dashboard**: overview, lead/CRM management, blog CMS, portfolio/micro-saas/testimonials/
  FAQ/services/team/homepage-sections management, media library, newsletter, settings, todos + reminders.
- **Phase 5 — Dynamic website**: wire website to API/CMS content (projects, products, blog, testimonials),
  RSS, sitemap automation, structured data completeness.
- **Phase 6 — Analytics, reminders & polish**: analytics dashboards, email reminder/summary jobs (cron),
  accessibility/perf audit pass, full docs, hardening.

When a phase completes, tick it here and bump "Current phase".
