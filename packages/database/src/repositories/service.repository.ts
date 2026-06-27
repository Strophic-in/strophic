import type { Prisma, PrismaClient } from "../generated/prisma/client";

export interface CreateServiceInput {
  slug: string;
  icon?: string;
  title: string;
  summary: string;
  description: string;
  benefits?: string[];
  stack?: string[];
  workflow?: Prisma.InputJsonValue;
  faqs?: Prisma.InputJsonValue;
  featured?: boolean;
  published?: boolean;
  order?: number;
}

export type UpdateServiceInput = Partial<CreateServiceInput>;

export interface ListServicesOptions {
  skip?: number;
  take?: number;
  published?: boolean;
  featured?: boolean;
}

export class ServiceRepository {
  constructor(private readonly db: PrismaClient) {}

  create(data: CreateServiceInput) {
    return this.db.service.create({ data });
  }

  findById(id: string) {
    return this.db.service.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.db.service.findUnique({ where: { slug } });
  }

  slugExists(slug: string, exceptId?: string) {
    return this.db.service.findFirst({
      where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    });
  }

  async list({ skip = 0, take = 100, published, featured }: ListServicesOptions = {}) {
    const where = {
      ...(published !== undefined ? { published } : {}),
      ...(featured !== undefined ? { featured } : {}),
    };
    const [items, total] = await Promise.all([
      this.db.service.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        skip,
        take,
      }),
      this.db.service.count({ where }),
    ]);
    return { items, total };
  }

  update(id: string, data: UpdateServiceInput) {
    return this.db.service.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.db.service.delete({ where: { id } });
  }
}
