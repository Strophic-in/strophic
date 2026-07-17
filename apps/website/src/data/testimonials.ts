export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  featured: boolean;
}

// No placeholder quotes: real, attributed testimonials come from the admin CMS.
// An empty list hides the testimonials section instead of showing invented praise.
export const testimonials: Testimonial[] = [];

export const featuredTestimonials = testimonials.filter((t) => t.featured);
