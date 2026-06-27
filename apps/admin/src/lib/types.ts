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
