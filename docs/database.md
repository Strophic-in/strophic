# Database

Prisma 7 + Neon Postgres. The client uses the `prisma-client` generator (output
`packages/database/src/generated`, gitignored) with the `@prisma/adapter-pg` driver
adapter over `pg`.

## Connection URLs (Prisma 7)

URLs are **not** in `schema.prisma`. They live in:

- `packages/database/prisma.config.ts` → migrations use **`DIRECT_URL`** (direct,
  non-pooled — PgBouncer can't run DDL).
- Runtime adapter → **`DATABASE_URL`** (Neon **pooled** endpoint).

`getPrisma(url)` is a memoized singleton; migrations run from Node/CI only.

## Models

- **Identity/Auth**: `User` (role enum), `RefreshToken` (hashed, family, rotation),
  `PasswordResetToken`.
- **CRM**: `Lead`, `LeadNote`, `NewsletterSubscriber`.
- **CMS**: `BlogPost`, `Project`, `Product`, `Service`, `Testimonial`, `Faq`,
  `TeamMember`, `HomepageSection`.
- **Media**: `Media`, `MediaFolder`.
- **Productivity**: `Todo`, `Setting`.
- **Analytics**: `AnalyticsEvent` (salted, daily-rotating visitor hash — no raw IP).

Each aggregate has one repository in `packages/database/src/repositories`; repositories
return domain types and are assembled by `createRepositories(db)`.

## Commands (from repo root)

```bash
npm run db:generate -w packages/database     # prisma generate
npm run db:migrate  -w packages/database -- --name <name>   # create + apply (dev, DIRECT_URL)
npm run db:deploy   -w packages/database     # prisma migrate deploy (prod/CI)
npm run db:seed     -w packages/database     # seed reference/dev data
npm run db:studio   -w packages/database     # Prisma Studio
```

Migrations live in `packages/database/prisma/migrations` and are committed. CI runs
`db:deploy` against `DIRECT_URL` before deploying the API.

> Note: in this sandbox, DB-touching commands need outbound TCP (port 5432), so run
> them with the sandbox disabled.
