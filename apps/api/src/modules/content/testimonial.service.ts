import type { Repositories } from "@strophic/database";
import type { CreateTestimonialInput, UpdateTestimonialInput } from "@strophic/validation";
import { NotFoundError } from "../../lib/errors";

export class TestimonialService {
  constructor(private readonly deps: { repos: Repositories }) {}

  create(input: CreateTestimonialInput) {
    return this.deps.repos.testimonials.create({
      quote: input.quote,
      author: input.author,
      role: input.role,
      company: input.company,
      avatarUrl: input.avatarUrl ?? null,
      rating: input.rating ?? null,
      featured: input.featured,
      published: input.published,
      order: input.order,
    });
  }

  async update(id: string, input: UpdateTestimonialInput) {
    await this.get(id);
    return this.deps.repos.testimonials.update(id, input);
  }

  async get(id: string) {
    const item = await this.deps.repos.testimonials.findById(id);
    if (!item) throw new NotFoundError("Testimonial not found");
    return item;
  }

  list(opts: { skip: number; take: number }) {
    return this.deps.repos.testimonials.list(opts);
  }

  async remove(id: string) {
    await this.get(id);
    await this.deps.repos.testimonials.delete(id);
  }

  // ── Public ──
  listPublished() {
    return this.deps.repos.testimonials.list({ published: true, take: 100 });
  }
}
