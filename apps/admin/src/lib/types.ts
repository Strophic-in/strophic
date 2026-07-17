import type { LeadSource, Paginated } from "@strophic/types";

export type { Paginated };

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST";
export type LeadPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  service: string | null;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  tags: string[];
  assignedToId: string | null;
  ip: string | null;
  userAgent: string | null;
  referrer: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  authorId: string | null;
  body: string;
  createdAt: string;
  author?: { id: string; name: string } | null;
}

export interface LeadDetail extends Lead {
  notes: LeadNote[];
  assignedTo?: { id: string; name: string } | null;
}

export interface Subscriber {
  id: string;
  email: string;
  status: "SUBSCRIBED" | "UNSUBSCRIBED";
  source: string | null;
  unsubscribeToken: string;
  createdAt: string;
}

export const LEAD_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];
export const LEAD_PRIORITIES: LeadPriority[] = ["LOW", "MEDIUM", "HIGH"];

export type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  status: PostStatus;
  readingTime: number;
  metaTitle: string | null;
  metaDescription: string | null;
  authorId: string | null;
  publishedAt: string | null;
  notifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string } | null;
}

export const POST_STATUSES: PostStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatarUrl: string | null;
  rating: number | null;
  featured: boolean;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
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
  logoImage: string | null;
  url: string | null;
  content: string | null;
  featured: boolean;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = "LIVE" | "BETA" | "SOON";
export const PRODUCT_STATUSES: ProductStatus[] = ["LIVE", "BETA", "SOON"];

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: ProductStatus;
  url: string | null;
  logoImage: string | null;
  pricing: string;
  features: string[];
  accentFrom: string;
  accentTo: string;
  content: string | null;
  featured: boolean;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceWorkflowStep {
  title: string;
  description: string;
}
export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface Service {
  id: string;
  slug: string;
  icon: string;
  image: string | null;
  title: string;
  summary: string;
  description: string;
  benefits: string[];
  stack: string[];
  workflow: ServiceWorkflowStep[];
  faqs: ServiceFaq[];
  featured: boolean;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
  links: Record<string, string>;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface HomepageSection {
  id: string;
  key: string;
  title: string | null;
  subtitle: string | null;
  enabled: boolean;
  order: number;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type TodoStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TodoPriority = "LOW" | "MEDIUM" | "HIGH";
export const TODO_STATUSES: TodoStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
export const TODO_PRIORITIES: TodoPriority[] = ["LOW", "MEDIUM", "HIGH"];

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate: string | null;
  reminderAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CountByKey {
  key: string;
  count: number;
}

export interface AnalyticsDashboard {
  days: number;
  summary: { pageviews: number; visitors: number };
  daily: { date: string; count: number }[];
  topPaths: CountByKey[];
  topReferrers: CountByKey[];
}
