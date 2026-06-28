export type ProductStatus = "LIVE" | "BETA" | "SOON";

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: ProductStatus;
  url?: string;
  pricing: string;
  features: string[];
  accent: [string, string];
  featured: boolean;
}

// Strophic's own Micro-SaaS products. Placeholders for launch - wire to CMS in Phase 5.
export const products: Product[] = [
  {
    slug: "inboxsift",
    name: "InboxSift",
    tagline: "Turn a chaotic shared inbox into sorted, actionable threads.",
    description:
      "AI triage for support and sales inboxes - categorise, prioritise, and draft replies, with humans in control.",
    status: "BETA",
    pricing: "From $19/mo",
    features: ["AI triage & tagging", "Draft replies with sources", "Shared inbox analytics"],
    accent: ["#7c5cff", "#3d2689"],
    featured: true,
  },
  {
    slug: "briefloop",
    name: "BriefLoop",
    tagline: "Daily, automated standups and summaries your team will actually read.",
    description:
      "Pulls updates from your tools and writes a crisp daily brief - no meeting required.",
    status: "SOON",
    pricing: "From $12/mo",
    features: ["Auto-collected updates", "Crisp daily digest", "Slack & email delivery"],
    accent: ["#22d3ee", "#0e7490"],
    featured: true,
  },
];

export const featuredProducts = products.filter((p) => p.featured);
export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
