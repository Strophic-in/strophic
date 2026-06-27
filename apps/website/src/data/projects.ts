export interface Project {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  year: string;
  /** Two hex stops for the generated cover gradient (no image asset needed yet). */
  accent: [string, string];
  results: string[];
  featured: boolean;
}

// Placeholder case studies for launch — replace with real client work (becomes CMS-driven in Phase 5).
export const projects: Project[] = [
  {
    slug: "support-copilot",
    title: "Support Copilot for a B2B SaaS",
    summary:
      "An AI assistant grounded in the client's documentation that drafts replies, cites sources, and escalates the hard cases.",
    category: "AI Agents",
    tags: ["RAG", "Claude", "Support"],
    year: "2026",
    accent: ["#7c5cff", "#3d2689"],
    results: ["62% faster first response", "Source-cited answers", "Clean human hand-off"],
    featured: true,
  },
  {
    slug: "ops-automation",
    title: "Order-to-Invoice Automation",
    summary:
      "Connected storefront, fulfilment, and accounting with idempotent automations and a full audit trail.",
    category: "Automation",
    tags: ["Node", "Webhooks", "Finance"],
    year: "2026",
    accent: ["#22d3ee", "#0e7490"],
    results: ["3 days/week of manual work removed", "Zero duplicate invoices", "Every action audited"],
    featured: true,
  },
  {
    slug: "internal-platform",
    title: "Internal Operations Platform",
    summary:
      "A custom dashboard unifying five tools into one source of truth, with role-based access and live metrics.",
    category: "Custom Software",
    tags: ["Next.js", "Postgres", "RBAC"],
    year: "2025",
    accent: ["#f0b429", "#b45309"],
    results: ["5 tools unified", "Role-based access", "Live operational metrics"],
    featured: true,
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
