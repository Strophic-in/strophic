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

The website is static and reads CMS content at build time. To make published content
go live, trigger a website rebuild when content changes — wire a Cloudflare Pages
**Deploy Hook** and call it from the admin on publish (or rebuild on a schedule). Until
then, the site shows whatever was current at its last build (falling back to placeholder
data when the CMS is empty).

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
