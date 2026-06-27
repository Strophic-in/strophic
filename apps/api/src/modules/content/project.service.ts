import type { Repositories } from "@strophic/database";
import type { CreateProjectInput, UpdateProjectInput } from "@strophic/validation";
import { ConflictError, NotFoundError } from "../../lib/errors";

export class ProjectService {
  constructor(private readonly deps: { repos: Repositories }) {}

  async create(input: CreateProjectInput) {
    if (await this.deps.repos.projects.slugExists(input.slug)) {
      throw new ConflictError("A project with that slug already exists");
    }
    return this.deps.repos.projects.create(input);
  }

  async update(id: string, input: UpdateProjectInput) {
    const existing = await this.get(id);
    if (input.slug && input.slug !== existing.slug && (await this.deps.repos.projects.slugExists(input.slug, id))) {
      throw new ConflictError("A project with that slug already exists");
    }
    return this.deps.repos.projects.update(id, input);
  }

  async get(id: string) {
    const item = await this.deps.repos.projects.findById(id);
    if (!item) throw new NotFoundError("Project not found");
    return item;
  }

  list(opts: { skip: number; take: number }) {
    return this.deps.repos.projects.list(opts);
  }

  async remove(id: string) {
    await this.get(id);
    await this.deps.repos.projects.delete(id);
  }

  // ── Public ──
  listPublished() {
    return this.deps.repos.projects.list({ published: true, take: 100 });
  }

  async getPublishedBySlug(slug: string) {
    const item = await this.deps.repos.projects.findBySlug(slug);
    if (!item || !item.published) throw new NotFoundError("Project not found");
    return item;
  }
}
