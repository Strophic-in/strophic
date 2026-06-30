import type { PostStatus, Repositories } from "@strophic/database";
import { type EmailProvider, newPostEmail } from "@strophic/email";
import { readingTimeMinutes } from "@strophic/utils";
import type { CreatePostInput, UpdatePostInput } from "@strophic/validation";
import type { AppConfig } from "../../env";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/errors";

function nextPublishedAt(status: PostStatus, current: Date | null): Date | null {
  if (status === "PUBLISHED") return current ?? new Date();
  if (status === "DRAFT") return null;
  return current; // ARCHIVED keeps its original publish date
}

export class BlogService {
  constructor(
    private readonly deps: { repos: Repositories; config: AppConfig; email: EmailProvider },
  ) {}

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

  /**
   * Email every current subscriber a "new post" notification for a published post.
   * Sends are best-effort and counted; a few provider failures don't fail the batch.
   * Refuses to re-send an already-notified post unless `force` is set. Marks the post
   * as notified on completion so the admin can see (and the next click can guard against
   * an accidental re-blast).
   */
  async notify(id: string, opts: { force?: boolean } = {}) {
    const post = await this.deps.repos.blog.findById(id);
    if (!post) throw new NotFoundError("Post not found");
    if (post.status !== "PUBLISHED") {
      throw new BadRequestError("Only published posts can be sent to subscribers");
    }
    if (post.notifiedAt && !opts.force) {
      throw new ConflictError("Subscribers were already notified for this post");
    }

    const subscribers = await this.deps.repos.newsletter.listSubscribed();
    const brand = { companyName: "Strophic", siteUrl: this.deps.config.siteUrl };
    const postUrl = `${this.deps.config.siteUrl}/blog/${post.slug}`;

    let sent = 0;
    let failed = 0;
    for (const sub of subscribers) {
      const unsubscribeUrl = `${this.deps.config.apiUrl}/api/v1/newsletter/unsubscribe?token=${sub.unsubscribeToken}`;
      try {
        await this.deps.email.send({
          to: sub.email,
          ...newPostEmail({
            post: { title: post.title, excerpt: post.excerpt, url: postUrl, coverImage: post.coverImage },
            unsubscribeUrl,
            brand,
          }),
        });
        sent += 1;
      } catch (error) {
        failed += 1;
        console.error(`[blog] notify email failed for ${sub.email}:`, error);
      }
    }

    await this.deps.repos.blog.markNotified(id);
    return { total: subscribers.length, sent, failed };
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
