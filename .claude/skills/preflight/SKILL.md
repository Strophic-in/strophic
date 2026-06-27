---
name: preflight
description: Run the Strophic pre-deploy / pre-merge quality gate. Use whenever asked to "check before deploy", "is this ready to ship", "run the checks", "preflight", "verify the build", or before merging/deploying any app, to confirm typecheck, lint, build, and tests pass and the SEO/performance/accessibility budgets are respected. Use this instead of guessing whether a change is shippable.
---

# Preflight — quality gate before merge/deploy

Confirm a change is genuinely shippable per `CLAUDE.md` §5 and §8. Report results honestly: if something
fails or was skipped, say so with the output — do not declare green on a partial run.

## 1. Static checks (must pass — fix, don't skip)
Run from repo root (or scope with `-w <workspace>` / `turbo --filter <app>` for a single app):
```bash
npm run typecheck   # tsc --noEmit, all workspaces — no errors, no new suppressions
npm run lint        # eslint — no errors; warnings triaged
npm run build       # turbo build — all affected apps build clean
npm test            # unit/integration — all green
```
If any fail, stop and fix the root cause. Don't silence with `any`, `// @ts-ignore`, or eslint-disable
unless genuinely justified and commented.

## 2. Website budgets (when `apps/website` changed)
- Lighthouse: **Performance > 95, SEO 100, Accessibility > 95, Best-Practices > 95** (mobile profile).
- No unnecessary client JS shipped on static pages; images responsive/sized/lazy; fonts subset+preloaded.
- Metadata present and unique (title, description, canonical, OG/Twitter); JSON-LD validates; sitemap and
  robots.txt correct. Run the `web-design-guidelines` skill for an accessibility/UX pass.

## 3. API / admin changes
- New endpoints validate input (Zod) and gate auth/RBAC correctly; errors return the standard envelope and
  leak no internals. Public write endpoints are rate-limited.
- DB migrations are committed and apply cleanly; no destructive migration without an explicit, intended plan.
- No secrets added to code or logs; new env vars added to the app's `.env.example` and `docs/env.md`.

## 4. Report
Summarize: what passed, what failed (with output), what was intentionally out of scope. Only call a change
ready to deploy when 1–3 are satisfied for the affected apps.
