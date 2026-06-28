# Deployment

Each app deploys independently. CI uses Turborepo's affected graph so only changed
apps build/deploy. The pre-deploy gate (`preflight` skill) must be green:
`npm run typecheck && npm run lint && npm run build && npm test`.

| App | Target | Notes |
|---|---|---|
| website | Cloudflare Pages (static) | Build `apps/website` → deploy `dist/`. Rebuild on content publish (see below). |
| admin | Vercel | Next.js App Router. Set `NEXT_PUBLIC_API_URL`. |
| api | Vercel (serverless) | `hono/vercel` entry at `apps/api/api/index.ts`; `vercel.json` rewrites all paths to it. |
| database | Neon Postgres | Run `db:deploy` (DIRECT_URL) before deploying the API. |
| storage | Supabase Storage | Set the `media` bucket to public-read; the project pauses after ~7 days idle. |

## Order of operations

1. **Migrate**: `npm run db:deploy -w packages/database` against `DIRECT_URL`.
2. **API**: deploy `apps/api` to Vercel with all API env vars (see `docs/env.md`),
   including `CRON_SECRET`. The `vercel.json` cron triggers `GET /api/v1/cron/reminders`
   daily at 08:00 UTC.
3. **Admin**: deploy `apps/admin` to Vercel with `NEXT_PUBLIC_API_URL`.
4. **Website**: build `apps/website` with `PUBLIC_API_URL` + `PUBLIC_SITE_URL` and
   publish `dist/` to Cloudflare Pages.

## Rebuild-on-publish (website)

The website is static and reads CMS content at build time, so published content goes
live on the next build. This is **automated**:

1. In Cloudflare Pages → project → **Settings → Builds & deployments → Deploy hooks**,
   create a hook and copy its URL.
2. Set it as **`DEPLOY_HOOK_URL`** on the API's Vercel project.

The API then POSTs that hook (best-effort) after any successful content mutation that
affects public pages - blog, projects, products, services, testimonials, FAQs, team,
homepage sections, and settings - so the site rebuilds itself (live in ~1-2 min). The
admin **Settings → "Rebuild site"** button triggers the same hook manually. With no
`DEPLOY_HOOK_URL` set, both are no-ops and you rebuild/redeploy manually.

## DNS / email

- DNS on Cloudflare; `strophic.in` apex → website, `api.` and `admin.` subdomains → Vercel.
- Email sending via Resend (verify the domain + DKIM); receiving via Zoho Mail.

## Pre-launch checklist

- [ ] Rotate the seeded admin password.
- [ ] Set the Supabase `media` bucket to public-read.
- [ ] Add real content (services, projects, products, testimonials, blog, team).
- [ ] Set founder name + portfolio URL + socials in `apps/website/src/config/site.ts`.
- [ ] Lighthouse/a11y audit (targets in `CLAUDE.md` §8).
- [ ] Configure the website rebuild Deploy Hook.
