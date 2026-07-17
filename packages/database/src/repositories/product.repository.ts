import type { ProductStatus, PrismaClient } from "../generated/prisma/client";

export interface CreateProductInput {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status?: ProductStatus;
  url?: string | null;
  logoImage?: string | null;
  pricing: string;
  features?: string[];
  accentFrom?: string;
  accentTo?: string;
  content?: string | null;
  featured?: boolean;
  published?: boolean;
  order?: number;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface ListProductsOptions {
  skip?: number;
  take?: number;
  published?: boolean;
  featured?: boolean;
}

export class ProductRepository {
  constructor(private readonly db: PrismaClient) {}

  create(data: CreateProductInput) {
    return this.db.product.create({ data });
  }

  findById(id: string) {
    return this.db.product.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.db.product.findUnique({ where: { slug } });
  }

  slugExists(slug: string, exceptId?: string) {
    return this.db.product.findFirst({
      where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    });
  }

  async list({ skip = 0, take = 100, published, featured }: ListProductsOptions = {}) {
    const where = {
      ...(published !== undefined ? { published } : {}),
      ...(featured !== undefined ? { featured } : {}),
    };
    const [items, total] = await Promise.all([
      this.db.product.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        skip,
        take,
      }),
      this.db.product.count({ where }),
    ]);
    return { items, total };
  }

  update(id: string, data: UpdateProductInput) {
    return this.db.product.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.db.product.delete({ where: { id } });
  }
}
