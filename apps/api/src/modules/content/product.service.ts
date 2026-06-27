import type { Repositories } from "@strophic/database";
import type { CreateProductInput, UpdateProductInput } from "@strophic/validation";
import { ConflictError, NotFoundError } from "../../lib/errors";

export class ProductService {
  constructor(private readonly deps: { repos: Repositories }) {}

  async create(input: CreateProductInput) {
    if (await this.deps.repos.products.slugExists(input.slug)) {
      throw new ConflictError("A product with that slug already exists");
    }
    return this.deps.repos.products.create(input);
  }

  async update(id: string, input: UpdateProductInput) {
    const existing = await this.get(id);
    if (input.slug && input.slug !== existing.slug && (await this.deps.repos.products.slugExists(input.slug, id))) {
      throw new ConflictError("A product with that slug already exists");
    }
    return this.deps.repos.products.update(id, input);
  }

  async get(id: string) {
    const item = await this.deps.repos.products.findById(id);
    if (!item) throw new NotFoundError("Product not found");
    return item;
  }

  list(opts: { skip: number; take: number }) {
    return this.deps.repos.products.list(opts);
  }

  async remove(id: string) {
    await this.get(id);
    await this.deps.repos.products.delete(id);
  }

  // ── Public ──
  listPublished() {
    return this.deps.repos.products.list({ published: true, take: 100 });
  }

  async getPublishedBySlug(slug: string) {
    const item = await this.deps.repos.products.findBySlug(slug);
    if (!item || !item.published) throw new NotFoundError("Product not found");
    return item;
  }
}
