import type { PrismaClient } from "../generated/prisma/client";

export interface CreateTestimonialInput {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatarUrl?: string | null;
  rating?: number | null;
  featured?: boolean;
  published?: boolean;
  order?: number;
}

export type UpdateTestimonialInput = Partial<CreateTestimonialInput>;

export interface ListTestimonialsOptions {
  skip?: number;
  take?: number;
  published?: boolean;
  featured?: boolean;
}

export class TestimonialRepository {
  constructor(private readonly db: PrismaClient) {}

  create(data: CreateTestimonialInput) {
    return this.db.testimonial.create({ data });
  }

  findById(id: string) {
    return this.db.testimonial.findUnique({ where: { id } });
  }

  async list({ skip = 0, take = 100, published, featured }: ListTestimonialsOptions = {}) {
    const where = {
      ...(published !== undefined ? { published } : {}),
      ...(featured !== undefined ? { featured } : {}),
    };
    const [items, total] = await Promise.all([
      this.db.testimonial.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        skip,
        take,
      }),
      this.db.testimonial.count({ where }),
    ]);
    return { items, total };
  }

  update(id: string, data: UpdateTestimonialInput) {
    return this.db.testimonial.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.db.testimonial.delete({ where: { id } });
  }
}
