export interface Industry {
  name: string;
  description: string;
  icon: string;
}

export const industries: Industry[] = [
  { name: "SaaS & Startups", description: "Ship AI features and internal tools without growing headcount.", icon: "rocket" },
  { name: "E-commerce & Retail", description: "Automate operations, support, and merchandising end to end.", icon: "package" },
  { name: "Professional Services", description: "Turn documents and email into structured, automated workflows.", icon: "building" },
  { name: "Healthcare & Wellness", description: "Reduce admin load with careful, compliant automation.", icon: "shield" },
  { name: "Finance & Operations", description: "Reconcile, report, and route with auditable AI assistance.", icon: "gauge" },
  { name: "Education & Media", description: "Personalise content and scale support with grounded AI.", icon: "sparkles" },
];
