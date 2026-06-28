export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  featured: boolean;
}

// Placeholder testimonials - swap for real, attributed quotes before launch.
export const testimonials: Testimonial[] = [
  {
    quote:
      "Strophic replaced three days of manual reporting with an automation we trust. The difference shows up in every week now.",
    author: "Priya N.",
    role: "Head of Operations",
    company: "A logistics SaaS",
    featured: true,
  },
  {
    quote:
      "They shipped a working AI assistant grounded in our docs in under two weeks - and it actually cites its sources.",
    author: "Marcus L.",
    role: "Founder",
    company: "A B2B platform",
    featured: true,
  },
  {
    quote:
      "What set them apart was the rigour: evals, guardrails, and a clear hand-over. It didn't feel like a demo, it felt like software.",
    author: "Aisha R.",
    role: "CTO",
    company: "A fintech startup",
    featured: true,
  },
];

export const featuredTestimonials = testimonials.filter((t) => t.featured);
