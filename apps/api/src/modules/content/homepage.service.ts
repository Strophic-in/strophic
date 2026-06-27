import { type Prisma, type Repositories } from "@strophic/database";
import type {
  UpdateHomepageSectionInput,
  UpsertHomepageSectionInput,
} from "@strophic/validation";
import { NotFoundError } from "../../lib/errors";

export class HomepageService {
  constructor(private readonly deps: { repos: Repositories }) {}

  list() {
    return this.deps.repos.homepageSections.list();
  }

  /** Create-or-update by stable `key`. */
  upsert(input: UpsertHomepageSectionInput) {
    return this.deps.repos.homepageSections.upsert({
      ...input,
      config: input.config as Prisma.InputJsonValue,
    });
  }

  async update(id: string, input: UpdateHomepageSectionInput) {
    await this.get(id);
    const { config, ...rest } = input;
    return this.deps.repos.homepageSections.update(id, {
      ...rest,
      ...(config !== undefined ? { config: config as Prisma.InputJsonValue } : {}),
    });
  }

  async get(id: string) {
    const item = await this.deps.repos.homepageSections.findById(id);
    if (!item) throw new NotFoundError("Homepage section not found");
    return item;
  }

  async remove(id: string) {
    await this.get(id);
    await this.deps.repos.homepageSections.delete(id);
  }

  // ── Public ──
  listEnabled() {
    return this.deps.repos.homepageSections.listEnabled();
  }
}
