import type { PostStatus, Repositories } from "@strophic/database";
import { readingTimeMinutes } from "@strophic/utils";
import type { CreatePostInput, UpdatePostInput } from "@strophic/validation";
import { ConflictError, NotFoundError } from "../../lib/errors";

function nextPublishedAt(status: PostStatus, current: Date | null): Date | null {
  if (status === "PUBLISHED") return current ?? new Date();
  if (status === "DRAFT") return null;
  return current; // ARCHIVED keeps its original publish date
}

export class BlogService {
  constructor(private readonly deps: { repos: Repositories }) {}

  async create(input: CreatePostInput, authorId: string) {
    if (await this.deps.repos.blog.slugExists(input.slug)) {
      throw new ConflictError("A post with that slug already exists");
    }
    return this.deps.repos.blog.create({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      coverImage: input.coverImage ?? null,
      category: input.category,
      tags: input.tags,
      status: input.status,
      readingTime: readingTimeMinutes(input.content),
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      authorId,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    });
  }

  async update(id: string, input: UpdatePostInput) {
    const existing = await this.deps.repos.blog.findById(id);
    if (!existing) throw new NotFoundError("Post not found");
    if (input.slug && input.slug !== existing.slug && (await this.deps.repos.blog.slugExists(input.slug, id))) {
      throw new ConflictError("A post with that slug already exists");
    }
    return this.deps.repos.blog.update(id, {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      coverImage: input.coverImage,
      category: input.category,
      tags: input.tags,
      status: input.status,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      ...(input.content !== undefined ? { readingTime: readingTimeMinutes(input.content) } : {}),
      ...(input.status !== undefined
        ? { publishedAt: nextPublishedAt(input.status, existing.publishedAt) }
        : {}),
    });
  }

  async get(id: string) {
    const post = await this.deps.repos.blog.findById(id);
    if (!post) throw new NotFoundError("Post not found");
    return post;
  }

  list(opts: { skip: number; take: number; status?: PostStatus }) {
    return this.deps.repos.blog.list(opts);
  }

  async remove(id: string) {
    await this.get(id);
    await this.deps.repos.blog.delete(id);
  }

  // ── Public ──
  listPublished(opts: { skip: number; take: number }) {
    return this.deps.repos.blog.listPublished(opts);
  }

  async getPublishedBySlug(slug: string) {
    const post = await this.deps.repos.blog.findBySlug(slug);
    if (!post || post.status !== "PUBLISHED") throw new NotFoundError("Post not found");
    return post;
  }
}
