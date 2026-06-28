import { type Prisma, type Repositories } from "@strophic/database";
import type { CreateServiceInput, UpdateServiceInput } from "@strophic/validation";
import { ConflictError, NotFoundError } from "../../lib/errors";

/** Service-offering business logic. (Named to avoid collision with the generic
 * "service" layer concept - the entity is a marketing Service.) */
export class ServiceOfferingService {
  constructor(private readonly deps: { repos: Repositories }) {}

  async create(input: CreateServiceInput) {
    if (await this.deps.repos.services.slugExists(input.slug)) {
      throw new ConflictError("A service with that slug already exists");
    }
    return this.deps.repos.services.create({
      ...input,
      workflow: input.workflow as Prisma.InputJsonValue,
      faqs: input.faqs as Prisma.InputJsonValue,
    });
  }

  async update(id: string, input: UpdateServiceInput) {
    const existing = await this.get(id);
    if (input.slug && input.slug !== existing.slug && (await this.deps.repos.services.slugExists(input.slug, id))) {
      throw new ConflictError("A service with that slug already exists");
    }
    return this.deps.repos.services.update(id, {
      ...input,
      ...(input.workflow !== undefined ? { workflow: input.workflow as Prisma.InputJsonValue } : {}),
      ...(input.faqs !== undefined ? { faqs: input.faqs as Prisma.InputJsonValue } : {}),
    });
  }

  async get(id: string) {
    const item = await this.deps.repos.services.findById(id);
    if (!item) throw new NotFoundError("Service not found");
    return item;
  }

  list(opts: { skip: number; take: number }) {
    return this.deps.repos.services.list(opts);
  }

  async remove(id: string) {
    await this.get(id);
    await this.deps.repos.services.delete(id);
  }

  // ── Public ──
  listPublished() {
    return this.deps.repos.services.list({ published: true, take: 100 });
  }

  async getPublishedBySlug(slug: string) {
    const item = await this.deps.repos.services.findBySlug(slug);
    if (!item || !item.published) throw new NotFoundError("Service not found");
    return item;
  }
}
