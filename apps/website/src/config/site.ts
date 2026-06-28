/**
 * Central site configuration. Edit company details, links, and founder info here.
 * In Phase 5 the dynamic parts (projects, posts, products) move to the CMS/API;
 * this file stays the home for static brand/identity values.
 */
export const site = {
  name: "Strophic",
  url: "https://strophic.in",
  tagline: "Composed systems for an AI-native business.",
  description:
    "Strophic is an AI consulting and product studio. We ship AI integration, workflow automation, and custom software - and build our own Micro-SaaS products.",
  email: "hello@strophic.in",
  // OG image used as the default social preview (1200×630). Replace with a designed asset.
  ogImage: "/og/default.png",
  social: {
    // TODO: replace with your real handles.
    instagram: "https://instagram.com/strophic",
    x: "https://x.com/strophic",
    linkedin: "https://www.linkedin.com/company/strophic",
    github: "https://github.com/strophic",
  },
  founder: {
    // TODO: update name + your personal portfolio URL (used by the /founder page).
    name: "Shaik Hafeez",
    role: "Founder & Principal Engineer",
    shortBio:
      "I started Strophic to help teams turn AI from a buzzword into shipped, dependable systems - and to build products I wish existed.",
    portfolioUrl: "https://your-portfolio.example.com",
  },
} as const;

export interface NavItem {
  label: string;
  href: string;
}

export const primaryNav: NavItem[] = [
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "Products", href: "/products" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Founder", href: "/founder" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Work",
    items: [
      { label: "Case studies", href: "/work" },
      { label: "Micro-SaaS", href: "/products" },
      { label: "Services", href: "/services" },
      { label: "Blog", href: "/blog" },
    ],
  },
];
