/**
 * Build-time content layer.
 *
 * The website is static: these helpers run during `astro build` and fetch
 * published content from the API (the admin CMS). When the API is unreachable
 * or has no content yet, each loader falls back to the curated placeholder data
 * in `src/data/*` — so the site always renders, and switches to real content the
 * moment it exists (rebuild on publish keeps the static output fresh).
 */
import { marked } from "marked";
import { readingTimeMinutes } from "@strophic/utils";
import { type Product, products as fallbackProducts } from "../data/products";
import { type Project, projects as fallbackProjects } from "../data/projects";
import { type Service, services as fallbackServices } from "../data/services";
import { type Testimonial, testimonials as fallbackTestimonials } from "../data/testimonials";

const API_URL = (import.meta.env.PUBLIC_API_URL ?? "http://localhost:8787").replace(/\/+$/, "");

/** Fetch a public list endpoint. Returns null on any failure (caller falls back). */
async function fetchItems<T>(path: string): Promise<T[] | null> {
  try {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; data?: { items?: T[] } } | null;
    if (!json?.ok || !json.data?.items) return null;
    return json.data.items;
  } catch {
    return null;
  }
}

/** True when the API returned a non-empty list; otherwise we fall back. */
function useApi<T>(items: T[] | null): items is T[] {
  return Array.isArray(items) && items.length > 0;
}

const renderMarkdown = (md: string): string => marked.parse(md, { async: false });

// ── Extended views (superset of the placeholder shapes) ──

export type ProjectView = Project & { content?: string | null; coverImage?: string | null };
export type ProductView = Product & { content?: string | null };

export interface FaqView {
  question: string;
  answer: string;
}

export interface TeamMemberView {
  name: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
  links: Record<string, string>;
}

// ── API DTOs (only the fields we read) ──

interface ProjectDTO {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  year: string;
  accentFrom: string;
  accentTo: string;
  results: string[];
  coverImage: string | null;
  content: string | null;
  featured: boolean;
}

interface ProductDTO {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: Product["status"];
  url: string | null;
  pricing: string;
  features: string[];
  accentFrom: string;
  accentTo: string;
  content: string | null;
  featured: boolean;
}

interface ServiceDTO {
  slug: string;
  icon: string;
  title: string;
  summary: string;
  description: string;
  benefits: string[];
  stack: string[];
  workflow: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
  featured: boolean;
}

interface TestimonialDTO {
  quote: string;
  author: string;
  role: string;
  company: string;
  featured: boolean;
}

interface FaqDTO {
  question: string;
  answer: string;
}

interface TeamMemberDTO {
  name: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
  links: Record<string, string>;
}

interface BlogPostDTO {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  coverImage: string | null;
  readingTime: number;
  publishedAt: string | null;
  updatedAt: string;
}

// ── Mappers ──

const mapProject = (d: ProjectDTO): ProjectView => ({
  slug: d.slug,
  title: d.title,
  summary: d.summary,
  category: d.category,
  tags: d.tags,
  year: d.year,
  accent: [d.accentFrom, d.accentTo],
  results: d.results,
  featured: d.featured,
  content: d.content,
  coverImage: d.coverImage,
});

const mapProduct = (d: ProductDTO): ProductView => ({
  slug: d.slug,
  name: d.name,
  tagline: d.tagline,
  description: d.description,
  status: d.status,
  url: d.url ?? undefined,
  pricing: d.pricing,
  features: d.features,
  accent: [d.accentFrom, d.accentTo],
  featured: d.featured,
  content: d.content,
});

const mapService = (d: ServiceDTO): Service => ({
  slug: d.slug,
  icon: d.icon,
  title: d.title,
  summary: d.summary,
  description: d.description,
  benefits: d.benefits,
  stack: d.stack,
  workflow: d.workflow,
  faqs: d.faqs,
  featured: d.featured,
});

const mapTestimonial = (d: TestimonialDTO): Testimonial => ({
  quote: d.quote,
  author: d.author,
  role: d.role,
  company: d.company,
  featured: d.featured,
});

// ── Loaders (content type → published list, with fallback) ──

export async function getServices(): Promise<Service[]> {
  const items = await fetchItems<ServiceDTO>("/api/v1/services");
  return useApi(items) ? items.map(mapService) : fallbackServices;
}

export async function getProjects(): Promise<ProjectView[]> {
  const items = await fetchItems<ProjectDTO>("/api/v1/projects");
  return useApi(items) ? items.map(mapProject) : fallbackProjects;
}

export async function getProducts(): Promise<ProductView[]> {
  const items = await fetchItems<ProductDTO>("/api/v1/products");
  return useApi(items) ? items.map(mapProduct) : fallbackProducts;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const items = await fetchItems<TestimonialDTO>("/api/v1/testimonials");
  return useApi(items) ? items.map(mapTestimonial) : fallbackTestimonials;
}

export async function getFaqs(): Promise<FaqView[]> {
  const items = await fetchItems<FaqDTO>("/api/v1/faqs");
  return useApi(items) ? items : [];
}

export async function getTeam(): Promise<TeamMemberView[]> {
  const items = await fetchItems<TeamMemberDTO>("/api/v1/team");
  return useApi(items) ? items : [];
}

export const getFeaturedProjects = async (): Promise<ProjectView[]> =>
  (await getProjects()).filter((p) => p.featured);

export const getFeaturedProducts = async (): Promise<ProductView[]> =>
  (await getProducts()).filter((p) => p.featured);

export const getFeaturedTestimonials = async (): Promise<Testimonial[]> =>
  (await getTestimonials()).filter((t) => t.featured);

export async function getProject(slug: string): Promise<ProjectView | undefined> {
  return (await getProjects()).find((p) => p.slug === slug);
}

export async function getProduct(slug: string): Promise<ProductView | undefined> {
  return (await getProducts()).find((p) => p.slug === slug);
}

export async function getService(slug: string): Promise<Service | undefined> {
  return (await getServices()).find((s) => s.slug === slug);
}

/** Render optional Markdown (e.g. case-study body) to HTML, or null. */
export function renderBody(content: string | null | undefined): string | null {
  return content && content.trim() ? renderMarkdown(content) : null;
}

// ── Blog ──

export interface BlogPostView {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  publishedAt: Date;
  updatedAt: Date;
  readingTime: number;
  html: string;
}

const mapBlogPost = (d: BlogPostDTO): BlogPostView => {
  const published = d.publishedAt ? new Date(d.publishedAt) : new Date(d.updatedAt);
  return {
    slug: d.slug,
    title: d.title,
    description: d.excerpt,
    category: d.category,
    tags: d.tags,
    publishedAt: published,
    updatedAt: new Date(d.updatedAt),
    readingTime: d.readingTime || readingTimeMinutes(d.content),
    html: renderMarkdown(d.content),
  };
};

/**
 * Published blog posts from the API, or null when none/unreachable — the blog
 * pages then fall back to the local MDX collection (their original behaviour).
 */
export async function getApiBlogPosts(): Promise<BlogPostView[] | null> {
  const items = await fetchItems<BlogPostDTO>("/api/v1/posts");
  if (!useApi(items)) return null;
  return items
    .map(mapBlogPost)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}
