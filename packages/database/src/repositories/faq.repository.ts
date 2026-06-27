import type { PrismaClient } from "../generated/prisma/client";

export interface CreateFaqInput {
  question: string;
  answer: string;
  category?: string | null;
  published?: boolean;
  order?: number;
}

export type UpdateFaqInput = Partial<CreateFaqInput>;

export interface ListFaqsOptions {
  skip?: number;
  take?: number;
  published?: boolean;
  category?: string;
}

export class FaqRepository {
  constructor(private readonly db: PrismaClient) {}

  create(data: CreateFaqInput) {
    return this.db.faq.create({ data });
  }

  findById(id: string) {
    return this.db.faq.findUnique({ where: { id } });
  }

  async list({ skip = 0, take = 100, published, category }: ListFaqsOptions = {}) {
    const where = {
      ...(published !== undefined ? { published } : {}),
      ...(category !== undefined ? { category } : {}),
    };
    const [items, total] = await Promise.all([
      this.db.faq.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        skip,
        take,
      }),
      this.db.faq.count({ where }),
    ]);
    return { items, total };
  }

  update(id: string, data: UpdateFaqInput) {
    return this.db.faq.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.db.faq.delete({ where: { id } });
  }
}
