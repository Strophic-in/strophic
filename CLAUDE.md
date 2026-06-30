# CLAUDE.md - Strophic Platform

> Source-of-truth guidance for any agent or engineer working in this repository.
> Read this fully before making changes. When you change architecture, update this file in the same change.

---

## 1. What this is

**Strophic** (https://strophic.in) is an AI consulting & product company. This repository is the
company's full web platform: the public marketing/lead-gen website, an admin dashboard that runs the
whole business (CMS, leads/CRM, media, todos, settings, analytics), and the backend API that powers both.

Strophic offers: AI integration, workflow & business-process automation, custom software, AI agents,
chatbots, internal tools, enterprise apps, cloud solutions, API integrations - and ships its own
Micro-SaaS products.

**Primary business goal of the site: convert visitors (from Instagram, X, LinkedIn, Google, referrals)
into qualified leads.** Every architectural and design decision serves that, plus SEO/GEO, speed,
accessibility, and long-term maintainability.

---

## 2. Project status

> **PHASES 0-6 BUILT - platform feature-complete.** Foundations (0) + data & API core (1) + public website
> (2) + lead engine (3) + admin dashboard (4) + dynamic website (5) + analytics/reminders/hardening (6) are in
> place and green (29/29 lint·typecheck·build·test). Verified end-to-end against real Neon + Supabase + Resend:
> auth (login, refresh rotation + reuse detection), media presign, contact→Lead + confirmation/notification
> emails, newsletter, admin lead lifecycle, the **full admin CMS/CRM** (Blog, Testimonials, FAQ, Portfolio,
> Micro-SaaS, Services, Team, Homepage sections, Todos), the **public site rendering from the CMS** at build
> time (with fallback), **first-party cookieless analytics** (ingest + dashboard), a **daily reminder digest**
> (Vercel Cron), **security headers**, and **auto-rebuild on content publish** (deploy-hook trigger + admin
> "Rebuild" button). Remaining before launch (owner/ops tasks, not code): real content, a Lighthouse/a11y audit,
> rotate the seeded admin password, set the Supabase `media` bucket to public-read, set `DEPLOY_HOOK_URL` to a
> Cloudflare Pages deploy hook (auto-rebuild is built, just needs the URL), and the Phase-6 backlog (shared-store
> rate limiter, media HEAD verify).
> The build phases are done. Continue **phase by phase, only after the owner approves
> each phase.** See **§12 Roadmap**.

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
| Backend API | **Hono on Node (deploys to Vercel)** | Hono is runtime-portable; runs on Node with full CPU. Free Cloudflare Workers caps CPU at 10ms/request - too little for secure password hashing - so the API is Node/Vercel (free, no card). See note below. |
| ORM / DB | **Prisma 7 + Neon Postgres** (`@prisma/adapter-pg` + `pg`) | Prisma 7's `prisma-client` generator + a driver adapter; `pg` over Neon's **pooled** URL at runtime, **direct** URL for migrations. |
| Storage | **Supabase Storage** (S3-compatible) | Images/media via the S3 API + `aws4fetch` presigned uploads. No credit card on the free tier; behind a storage service so R2/S3 can swap in later. |
| Email | **Provider-abstracted** (Resend HTTP first) | Resend over HTTP (deliverability + free tier); Zoho Mail handles receiving. Adapter pattern so SES/SendGrid/ZeptoMail swap with zero business-logic change. |
| Auth | **JWT access + rotating refresh tokens in httpOnly secure cookies, RBAC** | Standard, secure, stateless access + revocable refresh. |

### ⚠️ Key deviations from the original brief - backend runtime (decided)
1. **Framework**: the brief asked for **Fastify**, which doesn't run cleanly on edge/serverless. We use **Hono**
   (runtime-portable, Fastify-like DX). Business logic lives in framework-agnostic services/repositories, so the
   HTTP layer is a thin, swappable edge.
2. **Host**: the brief preferred **Cloudflare Workers**, but the **free** Workers tier caps CPU at **10 ms/request**
   - far too little for secure password hashing (scrypt ≈ 50-80 ms). So the API runs as **Hono on Node, deployed
   to Vercel** (free Hobby, no credit card, full CPU). Same Hono code; only the entry/host differ:
   `apps/api/src/server.ts` (local Node via `@hono/node-server`) and `apps/api/api/index.ts` (Vercel via `hono/vercel`).

### Other gotchas to remember
- **Astro + Framer Motion**: Framer Motion only runs inside React islands (client-side). Keep marketing
  pages mostly static; prefer CSS / Astro view-transitions for ambient motion, and reserve React islands +
  Framer Motion for genuinely interactive bits. Never ship a heavy JS animation lib on a static page.
- **Prisma 7 on Node/Vercel**: `prisma-client` generator (output `packages/database/src/generated`, gitignored) +
  `@prisma/adapter-pg` (`pg`). Connection URLs are NOT in the schema (Prisma 7) - they live in
  `prisma.config.ts` (migrations → **direct** URL) and the runtime adapter (**pooled** `DATABASE_URL`). The client
  is a memoized singleton (`getPrisma`). Migrations run from Node/CI, never serverless.
- **shadcn/ui is React**: shared in `packages/ui`, consumed directly by admin (Next) and as islands by the
  website (Astro `@astrojs/react`). Marketing-only static components can be authored as `.astro`.
- **Email**: transactional send via an HTTP API (**Resend** at launch) - `@strophic/email` `EmailProvider` adapter;
  a `console` provider logs instead of sending for local dev. Zoho Mail handles *receiving* at `@strophic.in`.
- **Astro deploy**: `@astrojs/cloudflare` dropped Cloudflare *Pages* SSR - the website builds **static** and
  deploys to Pages (no adapter), rebuilt on content publish. Upgrade path: Workers Static Assets for on-demand SSR.
- **Storage = Supabase Storage** (S3-compatible): accessed from the API via the **S3 API + `aws4fetch`** with
  server-side S3 access keys (`StorageService`). Free tier = 1 GB storage + 5 GB egress/mo, and the project
  **pauses after ~7 days idle** (site traffic or a cron ping keeps it awake). Swappable for R2/S3 later.
- **Auth crypto**: passwords hashed with **`@noble/hashes` scrypt** (Web-Crypto salt, constant-time compare);
  JWTs signed/verified with **`jose`** (HS256); refresh/reset tokens are opaque random, stored as SHA-256 hashes.
  Full CPU on Node makes scrypt viable (the reason we left free Workers).
- **Tailwind v4** (CSS-first `@theme`): use `@tailwindcss/vite` in Astro and `@tailwindcss/postcss` in Next - not
  the old `@astrojs/tailwind`.

---

## 4. Repository layout

```
strophic/
├── apps/
│   ├── website/        # Astro - public marketing site (SEO/GEO, lead capture)
│   ├── admin/          # Next.js - admin dashboard (auth-gated)
│   └── api/            # Hono on Node (Vercel) - REST API (/api/v1)
├── packages/
│   ├── ui/             # Shared React + Tailwind + shadcn/ui components + design tokens
│   ├── types/          # Shared TS types / DTOs (no runtime code)
│   ├── utils/          # Framework-agnostic helpers (dates, slugify, formatting)
│   ├── validation/     # Zod schemas - single source of truth for API + forms
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
  compiler - model the type correctly.
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

Premium, modern, fast - inspiration (not copies) from Vercel, Stripe, Linear, Notion, Supabase, Framer,
OpenAI. **Mobile-first.** Subtle, purposeful motion only (Linear/Stripe restraint) - never gratuitous.

- Design tokens (color, type scale, spacing, radii, shadows, motion durations/easings) live in
  `packages/ui` and Tailwind preset in `packages/config`. Don't hardcode hex/spacing in components.
- Accessibility is non-negotiable: semantic HTML, labelled controls, visible focus states, keyboard paths,
  `prefers-reduced-motion` respected, color contrast AA+. The `web-design-guidelines` and `frontend-design`
  skills (in `.agents/skills/`) are the review references.
- Every page: clear primary CTA toward lead capture; no dead ends.
- **Theming (Light / Dark / System)**: both apps support all three, defaulting to System. Admin uses
  `next-themes` (`.dark` class) over shadcn's semantic tokens. The website (static) resolves the theme before
  paint via an inline no-FOUC script and a header toggle that cycles System→Light→Dark; light mode is the `ink`
  ramp **reversed** under `html.light` (so components that use `ink-950` surfaces / `ink-50` text just work) -
  `prose-invert` is gated behind the `dark:` variant.

---

## 8. Quality budgets (enforce, don't aspire)

- Lighthouse (website): **Performance > 95, SEO 100, Accessibility > 95, Best-Practices > 95.**
- Core Web Vitals green. Ship minimal JS on marketing pages. Optimize/responsive images (Supabase Storage + correct
  sizes, lazy, `width`/`height` set). Preload fonts, subset them.
- SEO/GEO baseline on every public page: unique title/description, canonical, Open Graph + Twitter cards,
  JSON-LD (Organization, Service, Article, BreadcrumbList, FAQPage as applicable), dynamic sitemap,
  robots.txt, RSS for blog, breadcrumbs, semantic headings. Helpers live in `packages/seo`.

---

## 9. Environment & secrets

- Each app owns a `.env.example`; consolidated reference lives in `docs/env.md`.
- API secrets in the Vercel project env (DATABASE_URL, DIRECT_URL, JWT secrets, RESEND_API_KEY, Supabase
  Storage S3 keys). Admin secrets in its own Vercel project env. Website needs only public build vars.
- Local dev reads the repo-root `.env` (loaded by `apps/api/src/server.ts` and `prisma.config.ts`).
- Never log secrets. Never commit real credentials. Rotate the seeded admin password immediately.

Core vars (see `docs/env.md` for the full list): `DATABASE_URL` (pooled), `DIRECT_URL` (migrations),
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM`, `SUPABASE_STORAGE_*`,
`PUBLIC_API_URL`, `PUBLIC_SITE_URL`, `ADMIN_URL`, `CONTACT_NOTIFY_EMAIL`.

---

## 10. Deployment

| App | Target |
|---|---|
| website | Cloudflare Pages (static) |
| admin | Vercel |
| api | Vercel (Node serverless; `hono/vercel`) |
| database | Neon Postgres |
| storage | Supabase Storage |

Each app deploys independently; CI uses Turborepo affected-graph so only changed apps build/deploy.
GitHub Actions: lint → typecheck → build → test → deploy (per-app). See `docs/deployment.md`.

---

## 11. Project skills (`.claude/skills/`)

Use these to keep work consistent with the conventions above. Invoke as `/<name>`.

- **scaffold-package** - create a new shared package under `packages/` with standard config & exports.
- **add-api-resource** - add a full vertical slice (Prisma model → repository → Zod schema → service →
  Hono route → api-client method) following clean architecture + repository pattern.
- **new-content** - author SEO-correct marketing content (blog MDX post / project / service) with proper
  frontmatter, reading time, OG image, and JSON-LD.
- **preflight** - pre-deploy quality gate: typecheck, lint, build, test, and Lighthouse/SEO budget reminders.

Other available skills: `frontend-design`, `web-design-guidelines`, `webapp-testing` (in `.agents/skills/`).

---

## 12. Implementation roadmap

> **Current phase: all build phases (0-6) COMPLETE - platform feature-complete; pre-launch hardening &
> content remain.** Phase 6 (analytics, reminders & hardening) is done & live-verified: first-party cookieless
> analytics (ingest + admin dashboard), a daily reminder digest over Vercel Cron, security headers, and full
> `docs/`. Pre-launch follow-ups (owner/ops, not code): real website content, Lighthouse/a11y audit, rotate the
> seeded admin password, set the Supabase `media` bucket to public-read, wire the website rebuild deploy hook,
> and the remaining Phase-6 security backlog (shared-store rate limiter, media HEAD verify) below.

Build strictly in order; each phase is independently shippable and must pass §5 checks before the next.

- **Phase 0 - Foundations** ✅: monorepo (npm+turbo), shared `config` (tsconfig/eslint/prettier/tailwind
  tokens), `types`, `utils`, `ui` skeleton, three booting apps, CI skeleton. *Green, cached pipeline; API
  `/health` responds.*
- **Phase 1 - Data & API core** ✅: Prisma 7 schema + Neon (migrated), `database` repositories, `auth`
  (jose JWT + scrypt + rotating/reuse-detecting refresh + RBAC), `validation`, `email` (Resend + console),
  `api-client`, and the Hono API (cors/csrf/auth/rate-limit/error middleware; auth + media-presign + settings
  modules). *Verified against real Neon + Supabase Storage; adversarial security review run + findings fixed.*
- **Phase 2 - Public website (static + SEO)** ✅: design system + `@strophic/seo`, home, about, services
  (list + 6 detail), work (list + case studies), micro-saas (list + detail), blog (MDX collection + RSS),
  contact, careers, "meet the founder" redirect, 404. Per-page metadata/OG/JSON-LD, sitemap, robots, no-JS-safe
  reveal, generated OG image. *Build/typecheck/lint green; screenshot-QA'd. Pending: real content, Lighthouse/a11y audit.*
- **Phase 3 - Lead engine** ✅: `Lead`/`LeadNote`/`NewsletterSubscriber` models, public `POST /contact`
  (persist + Resend confirmation + owner notification, honeypot + rate-limited) and newsletter subscribe/
  unsubscribe, plus admin lead lifecycle (list/filter, status/priority/tags, notes) + subscriber list. Website
  contact + newsletter forms wired. *Verified end-to-end against real Neon + Resend.* **Post-launch addition:**
  a manual **"Notify subscribers"** broadcast - the admin blog editor (on a PUBLISHED post) calls
  `POST /api/v1/blog/:id/notify`, which emails every SUBSCRIBED recipient a `newPostEmail` with a one-click
  unsubscribe link (`GET /api/v1/newsletter/unsubscribe?token=`). A `BlogPost.notifiedAt` column (migration
  `20260630120000_blog_post_notified_at` - run `db:deploy`) guards against accidental double-sends (re-send needs
  `force: true`). Unsubscribe links are absolute via the new `PUBLIC_API_URL` env. Sends are sequential +
  best-effort (fine for a small list; revisit batching/queueing if the subscriber count grows large).
- **Phase 4 - Admin dashboard** ✅: foundation (shadcn/ui Base UI + iris theme, TanStack Query, cookie auth
  with login + `/me` guard, grouped sidebar), dashboard overview, **Leads CRM** (list/filter + detail with
  status/priority/notes), subscribers list, **Settings** (company/social), **Media library** (presign upload +
  grid + delete), **Account** (change password - `POST /auth/change-password`), and the full CMS: **Blog**
  (BlogPost + live Markdown editor), **Testimonials**, **FAQ**, **Portfolio** (Project + case-study body),
  **Micro-SaaS** (Product), **Services** (workflow + FAQ repeaters), **Team** (links), **Homepage sections**
  (upsert-by-key, reorderable, JSON config), and **Todos** (status→completedAt, due dates, reserved `reminderAt`).
  Each entity = model → repository → Zod schema → service → admin CRUD route (`/admin/*`, RBAC EDITOR) + public
  read route (published/enabled only) → admin UI (list + dialog/editor). *Verified end-to-end against real Neon -
  create defaults, partial-update field preservation, JSON round-trips, slug/key uniqueness, publish/enable
  filters, and 401 auth guards. Fixed a partial-update data-loss bug (Zod `.partial()` re-injected `.default()`s,
  silently resetting omitted fields); all update schemas now build from bare fields. Media thumbnails still need
  the `media` bucket set to public-read in Supabase.* Content-model fields superset the website's current data
  shapes for clean Phase 5 wiring. (Email reminder *jobs* for todos land in Phase 6.)
- **Phase 5 - Dynamic website** ✅: build-time content layer (`apps/website/src/lib/content.ts`) fetches
  published CMS content from the API and **falls back to `src/data/*` placeholders** when the API is empty or
  unreachable (so the static build never breaks). Wired: services (list+detail), portfolio/projects (list+detail
  + Markdown case-study body), micro-saas/products (list+detail), testimonials, homepage featured sections, and
  blog (list+detail+RSS - CMS Markdown via `marked`, MDX collection as fallback). `@astrojs/sitemap` reflects the
  generated routes; per-page JSON-LD/OG carry over to CMS-driven pages. *Verified end-to-end against real Neon:
  seeded content renders CMS-driven pages (and replaces placeholders); empty/down API rebuilds the prior static
  site byte-for-byte.* Rebuild-on-publish is automated in Phase 6 (see below) - set `DEPLOY_HOOK_URL` to enable.
- **Phase 6 - Analytics, reminders & hardening** ✅: **first-party, cookieless analytics** - `AnalyticsEvent`
  model, public `POST /events` ingest (salted daily-rotating visitor hash, no raw IP), website page-view beacon
  (honors Do Not Track), and an admin Analytics dashboard (page views, unique visitors, daily chart, top
  pages/referrers, 7/30/90-day range). **Reminders** - `GET /cron/reminders` (Bearer `CRON_SECRET`, Vercel Cron
  daily 08:00 UTC) emails the owner a daily digest of overdue/due-today/upcoming todos + new leads. **Hardening**
  - Hono `secureHeaders` (deny-all CSP for the JSON API, HSTS in prod), and a package-level `turbo.json` that
  serializes the database typecheck after its build (fixes the `prisma generate` ENOTEMPTY race). **Auto-rebuild**
  - a `DeployService` POSTs `DEPLOY_HOOK_URL` (Cloudflare Pages deploy hook) after any successful public-content
  mutation (blog/projects/products/services/testimonials/faqs/team/homepage/settings; not todos/leads/media/
  analytics), plus a manual `POST /admin/deploy` + admin Settings "Rebuild" button. Full `docs/`
  (architecture, api, database, env, deployment). *Verified against real Neon: analytics ingest dedupes visitors,
  dashboard aggregates correct; digest counts correct; security headers present, CORS/CSRF intact.* The
  accessibility/perf (Lighthouse) audit is a manual pre-launch step against the deployed site (targets in §8).

When a phase completes, tick it here and bump "Current phase".

### Security hardening backlog (from the Phase 1 review)
Security **headers** (CSP/HSTS/etc.) were added in Phase 6. These remain as pre-launch hardening:
- **Rate limiter**: in-memory + fixed-window is per-instance; move to a shared store (Upstash Redis / Durable
  Object) for multi-instance correctness, and add a **per-account (email)** limit on login/forgot/reset in
  addition to the per-IP one. (Trusted-IP derivation already fixed.)
- **Media persist**: also verify the object exists in storage (HEAD) and derive size/mime from it rather than
  trusting client metadata (key shape is already validated).
- **Media delete / settings**: add object-ownership checks and per-group settings schemas.
