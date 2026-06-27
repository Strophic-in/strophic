# Environment variables

Copy what each app needs into that app's own environment (Vercel project env, or a
local `.env` at the repo root for dev). Never commit real secrets — `.env.example` is
the committed template.

Local dev loads the repo-root `.env` (via `apps/api/src/server.ts` and
`prisma.config.ts`).

## API (`apps/api`)

| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Neon **pooled** URL (runtime) |
| `DIRECT_URL` | migrations | Neon **direct** URL (Prisma CLI/CI only) |
| `JWT_ACCESS_SECRET` | yes | Signs access JWTs (≥32 chars) |
| `JWT_REFRESH_SECRET` | yes | HMAC pepper for refresh/reset token hashing + analytics salt (≥32 chars) |
| `COOKIE_DOMAIN` | prod | e.g. `.strophic.in` |
| `EMAIL_PROVIDER` | — | `resend` or `console` (default `console`) |
| `RESEND_API_KEY` | if resend | Resend API key |
| `EMAIL_FROM` | — | e.g. `Strophic <hello@strophic.in>` |
| `CONTACT_NOTIFY_EMAIL` | — | Where lead notifications + daily digest are sent |
| `SUPABASE_STORAGE_ENDPOINT` | media | S3 endpoint |
| `SUPABASE_STORAGE_REGION` | — | default `us-east-1` |
| `SUPABASE_STORAGE_ACCESS_KEY_ID` | media | S3 access key |
| `SUPABASE_STORAGE_SECRET_ACCESS_KEY` | media | S3 secret |
| `SUPABASE_STORAGE_BUCKET` | — | default `media` |
| `SUPABASE_STORAGE_PUBLIC_URL` | media | Public base URL for objects |
| `PUBLIC_SITE_URL` | yes | Website origin (CORS + email links) |
| `ADMIN_URL` | yes | Admin origin (CORS + email links) |
| `CRON_SECRET` | prod | Bearer token Vercel Cron sends to `/cron/*` |

## Admin (`apps/admin`)

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | API base URL the admin calls |

## Website (`apps/website`, build-time)

| Var | Purpose |
|---|---|
| `PUBLIC_API_URL` | API base URL for build-time content fetch + the analytics beacon. If unset, the build falls back to placeholder data and the beacon is disabled. |
| `PUBLIC_SITE_URL` | Canonical site URL for SEO/sitemap/RSS |

## Secret hygiene

- Generate long random values for `JWT_*` and `CRON_SECRET` (e.g. `openssl rand -base64 48`).
- Rotate the seeded admin password (`admin@strophic.in`) on first login.
- Storage S3 keys bypass RLS — treat as server-only secrets.
