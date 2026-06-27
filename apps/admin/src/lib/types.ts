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
