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

// No placeholder products: real Micro-SaaS entries come from the admin CMS. An empty
// list makes the site show an honest "will be updated soon" note instead of fake products.
export const products: Product[] = [];

export const featuredProducts = products.filter((p) => p.featured);
export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
