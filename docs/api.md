# API reference

Base URL: `/api/v1`. All responses use a consistent envelope:

```jsonc
// success
{ "ok": true, "data": { /* ... */ }, "meta": { "pagination": { "page", "pageSize", "total", "totalPages" } } }
// error
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [/* optional */] } }
```

List endpoints return `{ items: [...] }` in `data` and pagination in `meta`. Auth uses
httpOnly cookies set by `/auth/login`; admin routes require a valid session and role
(RBAC: `EDITOR` ≤ `ADMIN` ≤ `SUPER_ADMIN`). Mutating requests must send an `Origin`
header matching an allowed front-end (CSRF) — the browsers do this automatically.

## Public — reads

| Method | Path | Notes |
|---|---|---|
| GET | `/posts`, `/posts/:slug` | Published blog posts |
| GET | `/projects`, `/projects/:slug` | Published portfolio projects |
| GET | `/products`, `/products/:slug` | Published Micro-SaaS products |
| GET | `/services`, `/services/:slug` | Published services |
| GET | `/testimonials` | Published testimonials |
| GET | `/faqs` | Published FAQs |
| GET | `/team` | Published team members |
| GET | `/homepage` | Enabled homepage sections |

## Public — writes (rate-limited)

| Method | Path | Notes |
|---|---|---|
| POST | `/contact` | Creates a Lead + sends confirmation/notification emails (honeypot) |
| POST | `/newsletter/subscribe` | Subscribe |
| POST | `/newsletter/unsubscribe` | Unsubscribe (token) |
| POST | `/events` | Analytics page-view/event beacon (cookieless) |

## Auth

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | Sets access + refresh cookies |
| POST | `/auth/refresh` | Rotates the refresh token (reuse → family revoke) |
| POST | `/auth/logout` | Clears the session |
| GET | `/auth/me` | Current user |
| POST | `/auth/forgot-password` | Emails a reset link |
| POST | `/auth/reset-password` | Consumes a reset token |
| POST | `/auth/change-password` | Authenticated; revokes other sessions |

## Admin (auth + RBAC)

CRUD (`GET` list, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id`) under:

- `/blog` · `/admin/testimonials` · `/admin/faqs` · `/admin/projects` ·
  `/admin/products` · `/admin/services` · `/admin/team` · `/admin/todos`
- `/admin/homepage` — list / `PUT` (upsert by key) / `PATCH /:id` / `DELETE /:id`
- `/leads` — list/detail + status/priority/tags + notes
- `/newsletter` — subscriber list
- `/media` — presign upload + persist + delete
- `/settings` — grouped settings get/update
- `/admin/analytics?days=` — dashboard aggregates (page views, visitors, top pages/referrers)

## Scheduled jobs

| Method | Path | Notes |
|---|---|---|
| GET | `/cron/reminders` | Daily digest email. Auth: `Authorization: Bearer <CRON_SECRET>` |
