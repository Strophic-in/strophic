export interface ServiceWorkflowStep {
  title: string;
  description: string;
}

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface Service {
  slug: string;
  icon: string;
  /** Optional uploaded image - replaces the icon tile on cards when set. */
  image?: string | null;
  title: string;
  summary: string;
  description: string;
  benefits: string[];
  stack: string[];
  workflow: ServiceWorkflowStep[];
  faqs: ServiceFaq[];
  featured: boolean;
}

export const services: Service[] = [
  {
    slug: "ai-integration",
    icon: "sparkles",
    title: "AI Integration",
    summary: "Put modern AI where your work actually happens - inside the tools your team already uses.",
    description:
      "We embed large-language-model capability into your products and internal systems: retrieval over your own data, drafting and summarisation, classification, and decision support. Every integration ships with evaluation, guardrails, and cost controls so it stays accurate and affordable in production.",
    benefits: [
      "Answers grounded in your data, not the open internet",
      "Evaluation harness so quality is measured, not assumed",
      "Cost + latency budgets enforced from day one",
      "Human-in-the-loop where the stakes demand it",
    ],
    stack: ["Claude", "OpenAI", "Vector search", "RAG", "TypeScript", "Python"],
    workflow: [
      { title: "Discover", description: "Map the highest-leverage use case and define what 'good' means in numbers." },
      { title: "Prototype", description: "Ship a thin vertical slice against real data and measure it." },
      { title: "Harden", description: "Add guardrails, evals, observability, and cost controls." },
      { title: "Integrate", description: "Embed it into your product or workflow and hand over the playbook." },
    ],
    faqs: [
      {
        question: "Which AI models do you use?",
        answer:
          "We're model-agnostic and pick per task - typically the latest Claude or GPT models - and design so you can switch providers without rewriting your product.",
      },
      {
        question: "How do you keep our data private?",
        answer:
          "Your data stays in your infrastructure or a provider with a zero-retention agreement. We never train third-party models on your data.",
      },
    ],
    featured: true,
  },
  {
    slug: "workflow-automation",
    icon: "workflow",
    title: "Workflow & Process Automation",
    summary: "Remove the repetitive, error-prone steps between your tools and your outcomes.",
    description:
      "We automate the busywork that eats your team's week - data entry, hand-offs, approvals, reporting - by connecting your systems and adding AI judgement where rules alone fall short. The result is faster cycles, fewer mistakes, and people freed for work that needs a human.",
    benefits: [
      "Hours back per person, every week",
      "Fewer manual errors and missed hand-offs",
      "Clear audit trail for every automated action",
      "Automations you can understand and adjust",
    ],
    stack: ["Node.js", "Webhooks", "Queues", "Cron", "Zapier/Make", "Custom APIs"],
    workflow: [
      { title: "Map", description: "Trace the real process, including the exceptions nobody documents." },
      { title: "Design", description: "Decide what to automate, what to assist, and what to leave human." },
      { title: "Build", description: "Wire the systems together with monitoring and safe fallbacks." },
      { title: "Tune", description: "Watch it run, handle edge cases, and measure time saved." },
    ],
    faqs: [
      {
        question: "Will this replace our team?",
        answer:
          "No - it removes the drudgery so your team spends time on judgement and relationships. We automate tasks, not people.",
      },
    ],
    featured: true,
  },
  {
    slug: "custom-software",
    icon: "code",
    title: "Custom Software Development",
    summary: "Production software built to your business, not bent around someone else's template.",
    description:
      "From internal tools to customer-facing platforms, we design and build software that fits your operation exactly. Clean architecture, real tests, and documentation mean what we ship stays maintainable long after launch - by us or by your own team.",
    benefits: [
      "Built for your workflow, not a generic SaaS box",
      "Typed, tested, documented - easy to maintain",
      "Scales with your business without a rewrite",
      "You own the code, fully",
    ],
    stack: ["TypeScript", "React", "Next.js", "Node", "PostgreSQL", "Cloud"],
    workflow: [
      { title: "Scope", description: "Turn goals into a concrete, prioritised build plan." },
      { title: "Design", description: "Shape the data model, architecture, and UX before code." },
      { title: "Build", description: "Ship in vertical slices you can use and react to early." },
      { title: "Support", description: "Harden, document, and hand over - or keep building with you." },
    ],
    faqs: [
      {
        question: "Do we own the code?",
        answer: "Yes. You get full ownership of the source, infrastructure, and documentation.",
      },
    ],
    featured: true,
  },
  {
    slug: "ai-agents-chatbots",
    icon: "bot",
    title: "AI Agents & Chatbots",
    summary: "Assistants that do real work - answering, triaging, and acting across your systems.",
    description:
      "We build agents and chatbots that go beyond canned replies: they retrieve from your knowledge, take actions through your APIs, and know when to escalate to a person. Deployed on your site, in support, or as internal copilots.",
    benefits: [
      "24/7 first-response on support and sales",
      "Grounded answers with sources, not hallucinations",
      "Can take actions, not just chat",
      "Escalates cleanly to humans with context",
    ],
    stack: ["Claude", "Tool use", "RAG", "WebSockets", "Vector DB"],
    workflow: [
      { title: "Define", description: "Pick the jobs the agent should own and its guardrails." },
      { title: "Ground", description: "Connect knowledge and tools; constrain what it can do." },
      { title: "Evaluate", description: "Test against real conversations and tune behaviour." },
      { title: "Deploy", description: "Launch with monitoring and a human escalation path." },
    ],
    faqs: [
      {
        question: "How do you prevent wrong answers?",
        answer:
          "Answers are grounded in your content with citations, constrained by guardrails, and continuously evaluated. Low-confidence cases escalate to a human.",
      },
    ],
    featured: false,
  },
  {
    slug: "cloud-api-integrations",
    icon: "cloud",
    title: "Cloud & API Integrations",
    summary: "Connect your stack - payments, CRM, data, and infrastructure - reliably and securely.",
    description:
      "We integrate the services your business runs on and deploy resilient infrastructure to run it. Secure by default, observable, and cost-aware - so your systems talk to each other without surprises.",
    benefits: [
      "One reliable source of truth across tools",
      "Secure handling of keys, webhooks, and PII",
      "Observability so you see failures before customers do",
      "Right-sized infrastructure that won't surprise your bill",
    ],
    stack: ["REST", "Webhooks", "OAuth", "Cloudflare", "Vercel", "Postgres"],
    workflow: [
      { title: "Audit", description: "Inventory systems, data flows, and failure points." },
      { title: "Architect", description: "Design integrations and infrastructure for resilience." },
      { title: "Implement", description: "Build with retries, idempotency, and monitoring." },
      { title: "Operate", description: "Set up alerts and runbooks so issues are caught early." },
    ],
    faqs: [
      {
        question: "Can you work with our existing cloud?",
        answer: "Yes - we work across major clouds and edge platforms and recommend the most cost-effective fit.",
      },
    ],
    featured: false,
  },
  {
    slug: "micro-saas",
    icon: "package",
    title: "Micro-SaaS Development",
    summary: "Take a product idea from validation to a launched, billing SaaS - fast.",
    description:
      "We help founders and operators turn a sharp idea into a real Micro-SaaS: auth, billing, dashboards, and the core feature, built lean and shipped quickly. It's the same playbook we use for our own products.",
    benefits: [
      "From idea to paying users without a year-long build",
      "Auth, billing, and analytics handled",
      "Lean scope that proves the idea before you scale it",
      "A foundation you can grow on",
    ],
    stack: ["Next.js", "Stripe", "Postgres", "Auth", "Cloud"],
    workflow: [
      { title: "Validate", description: "Sharpen the idea and define the smallest lovable product." },
      { title: "Build", description: "Ship the core loop with auth, billing, and analytics." },
      { title: "Launch", description: "Get it in front of users and instrument everything." },
      { title: "Iterate", description: "Use real usage to decide what to build next." },
    ],
    faqs: [
      {
        question: "Do you take equity or charge a fee?",
        answer: "Either model works - we'll discuss what fits your stage during the first call.",
      },
    ],
    featured: false,
  },
];

export const featuredServices = services.filter((s) => s.featured);
export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
