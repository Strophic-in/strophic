---
name: new-content
description: Create SEO- and GEO-correct marketing content for the Strophic website — a blog post (MDX), a portfolio project, a service page, or a micro-SaaS entry. Use whenever asked to "write a blog post", "add a case study", "add a new service page", "create a portfolio entry", "draft an article", or add any public-facing content, so frontmatter, metadata, reading time, OG image, JSON-LD, and internal linking follow the project's SEO conventions. Use this instead of free-handing a content file.
---

# Create marketing content (SEO/GEO-correct)

Produce public content that meets the budgets in `CLAUDE.md` §8 (unique metadata, JSON-LD, fast, accessible)
and is optimized both for classic SEO and for generative engines (GEO) — clear, factual, well-structured
prose that an LLM can cite.

Pick the content type and follow its checklist. Content lives in the website app (`apps/website`); dynamic
content (projects, products, posts managed in admin) instead goes through the admin CMS + API once Phase 4/5
land — confirm which path applies before writing files.

## Shared requirements (all types)
- **Unique, specific title** (~50–60 chars) and **meta description** (~150–160 chars). No duplication
  across pages.
- **Slug**: kebab-case, stable, human-readable. Never change a published slug without a 301 redirect.
- **Open Graph + Twitter card** fields; a real OG image (1200×630) — set its dimensions and `alt`.
- **Canonical URL**.
- **JSON-LD** via `@strophic/seo` helpers: `Article`/`BlogPosting` for posts, `Service` for services,
  `SoftwareApplication`/`Product` for micro-SaaS, plus `BreadcrumbList`.
- **One clear CTA** toward lead capture. Internal-link to relevant services/projects/posts.
- Semantic headings (single `h1`, ordered `h2/h3`). Images have `alt`, dimensions, lazy loading.
- **GEO**: lead with a direct, self-contained answer/summary; use clear sections, definitions, and
  factual, attributable statements; include an FAQ block (and `FAQPage` JSON-LD) where natural.

## Blog post (MDX)
Frontmatter: `title`, `slug`, `excerpt`, `author`, `publishedAt`, `updatedAt`, `category`, `tags[]`,
`coverImage`, `ogImage`, `metaTitle`, `metaDescription`, `draft`. Compute and surface **reading time**.
Body: MDX — use code blocks with language hints, images, and components as needed. End with a CTA and
suggest **related posts** (same category/tags). Keep paragraphs tight and skimmable.

## Service page
Each service includes: description, **benefits**, **technology stack**, **workflow/process**, **FAQ**, and
a **CTA**. Structure for both a human deciding to hire Strophic and an LLM summarizing the offering.

## Portfolio project / case study
Include: title, slug, summary, detailed explanation, screenshots/gallery (with alt), tech stack, category,
project URL, optional GitHub URL, and the case-study arc — **features, challenges, results** — plus status.
Results should be concrete (metrics where possible).

## Micro-SaaS entry
Include: logo, description, live URL, pricing, features, screenshots, status, category.

## Verify
- Run the `web-design-guidelines` skill on the rendered page for accessibility/UX.
- Check metadata renders (view source / social preview), JSON-LD validates, links resolve, images sized.
- Confirm Lighthouse SEO 100 and the page doesn't ship unnecessary JS.
