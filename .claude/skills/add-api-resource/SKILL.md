---
name: add-api-resource
description: Add a complete backend resource/endpoint to the Strophic API following clean architecture and the repository pattern. Use whenever you need a new API capability or CRUD resource — e.g. "add a leads endpoint", "create CRUD for testimonials", "expose projects via the API", "add a route to fetch blog posts", "wire up newsletter subscribe". Walks the full vertical slice: Prisma model → repository → Zod schema → service → Hono route → typed api-client method. Use this instead of writing an ad-hoc route so layering and validation stay consistent.
---

# Add an API resource (vertical slice)

Build a new resource end-to-end through every layer so the codebase stays consistent with
`CLAUDE.md` §6 (clean architecture: route → service → repository; validation defined once).

The HTTP framework (Hono on Workers) is a thin edge layer — keep business logic out of routes so the
runtime stays swappable.

## Before you start
- Name the resource (singular domain noun, e.g. `lead`, `project`, `testimonial`).
- Decide the operations needed (often: list, get-by-id/slug, create, update, delete; public vs admin-only).
- Decide auth: which routes are public (e.g. create-lead, list-published-posts) vs admin/RBAC-gated.

## Steps — go layer by layer, verify types compile between layers

1. **Data model — `packages/database`**
   - Add/extend the Prisma model in the schema (fields, enums, relations, indexes for query paths).
   - `npm run db:migrate` to create the migration. Update seeds if the resource needs reference data.

2. **Repository — `packages/database`**
   - Add `repositories/<resource>.repository.ts` with the data-access methods you need. Repositories own
     all Prisma access and return domain types — no Prisma row types leaking upward. Accept the Prisma
     client via constructor/param (DI) for testability.

3. **Validation — `packages/validation`**
   - Define Zod schemas: `create<Resource>Schema`, `update<Resource>Schema`, query/filter schema, and
     params. Infer and export TS types from them. These are the single source of truth, reused by the API
     and the admin/website forms.

4. **Service — `apps/api/src/services` (or `packages` if shared)**
   - Implement business logic: orchestrates repositories, enforces rules, never touches `Request`/
     `Response`. For leads: persist → fire confirmation + notification emails via `@strophic/email` →
     return DTO. Map domain errors to typed error classes.

5. **Route/controller — `apps/api/src/routes/<resource>.ts`**
   - Thin Hono handlers: parse + validate input with the Zod schema, call the service, return the
     consistent JSON shape. Apply auth/RBAC middleware on protected routes. Mount under `/api/v1/<plural>`.
     Set rate limits on public write endpoints (e.g. contact form).

6. **Typed client — `packages/api-client`**
   - Add typed methods so admin/website call the API without re-declaring shapes. Reuse the inferred types
     from `@strophic/validation`/`@strophic/types`.

7. **Verify**: `npm run typecheck && npm run lint`; test the route (happy path + validation failure + auth
   rejection). For public write endpoints, confirm rate limiting and that errors don't leak internals.

## Conventions
- Consistent success and error envelopes; never leak stack traces or DB errors to clients.
- Validate everything crossing the boundary; trust nothing from the client.
- Public list endpoints return only published/non-sensitive fields; admin endpoints can return more.
- Keep controllers free of business logic and services free of HTTP — this is what the architecture buys.
