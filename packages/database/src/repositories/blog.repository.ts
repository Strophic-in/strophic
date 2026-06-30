import type { PostStatus, PrismaClient } from "../generated/prisma/client";

const authorSelect = { author: { select: { id: true, name: true } } } as const;

export interface CreatePostInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  category: string;
  tags: string[];
  status: PostStatus;
  readingTime: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  authorId?: string | null;
  publishedAt?: Date | null;
}

export type UpdatePostInput = Partial<CreatePostInput>;

export interface ListPostsOptions {
  skip?: number;
  take?: number;
  status?: PostStatus;
}

export class BlogRepository {
  constructor(private readonly db: PrismaClient) {}

  create(data: CreatePostInput) {
    return this.db.blogPost.create({ data });
  }

  findById(id: string) {
    return this.db.blogPost.findUnique({ where: { id }, include: authorSelect });
  }

  findBySlug(slug: string) {
    return this.db.blogPost.findUnique({ where: { slug }, include: authorSelect });
  }

  slugExists(slug: string, exceptId?: string) {
    return this.db.blogPost.findFirst({
      where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    });
  }

  async list({ skip = 0, take = 20, status }: ListPostsOptions = {}) {
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.db.blogPost.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, include: authorSelect }),
      this.db.blogPost.count({ where }),
    ]);
    return { items, total };
  }

  async listPublished({ skip = 0, take = 50 }: { skip?: number; take?: number } = {}) {
    const where = { status: "PUBLISHED" as PostStatus };
    const [items, total] = await Promise.all([
      this.db.blogPost.findMany({ where, orderBy: { publishedAt: "desc" }, skip, take }),
      this.db.blogPost.count({ where }),
    ]);
    return { items, total };
  }

  update(id: string, data: UpdatePostInput) {
    return this.db.blogPost.update({ where: { id }, data });
  }

  /** Stamp the moment subscribers were notified about this post. */
  markNotified(id: string, at: Date = new Date()) {
    return this.db.blogPost.update({ where: { id }, data: { notifiedAt: at } });
  }

  delete(id: string) {
    return this.db.blogPost.delete({ where: { id } });
  }
}
