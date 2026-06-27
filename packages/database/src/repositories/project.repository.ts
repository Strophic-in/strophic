import type { PrismaClient } from "../generated/prisma/client";

export interface CreateProjectInput {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags?: string[];
  year: string;
  accentFrom?: string;
  accentTo?: string;
  results?: string[];
  coverImage?: string | null;
  content?: string | null;
  featured?: boolean;
  published?: boolean;
  order?: number;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export interface ListProjectsOptions {
  skip?: number;
  take?: number;
  published?: boolean;
  featured?: boolean;
}

export class ProjectRepository {
  constructor(private readonly db: PrismaClient) {}

  create(data: CreateProjectInput) {
    return this.db.project.create({ data });
  }

  findById(id: string) {
    return this.db.project.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.db.project.findUnique({ where: { slug } });
  }

  slugExists(slug: string, exceptId?: string) {
    return this.db.project.findFirst({
      where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    });
  }

  async list({ skip = 0, take = 100, published, featured }: ListProjectsOptions = {}) {
    const where = {
      ...(published !== undefined ? { published } : {}),
      ...(featured !== undefined ? { featured } : {}),
    };
    const [items, total] = await Promise.all([
      this.db.project.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        skip,
        take,
      }),
      this.db.project.count({ where }),
    ]);
    return { items, total };
  }

  update(id: string, data: UpdateProjectInput) {
    return this.db.project.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.db.project.delete({ where: { id } });
  }
}
