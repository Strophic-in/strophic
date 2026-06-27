import type { Prisma, PrismaClient } from "../generated/prisma/client";

export interface UpsertHomepageSectionInput {
  key: string;
  title?: string | null;
  subtitle?: string | null;
  enabled?: boolean;
  order?: number;
  config?: Prisma.InputJsonValue;
}

export type UpdateHomepageSectionInput = Partial<Omit<UpsertHomepageSectionInput, "key">>;

export class HomepageSectionRepository {
  constructor(private readonly db: PrismaClient) {}

  list() {
    return this.db.homepageSection.findMany({ orderBy: { order: "asc" } });
  }

  listEnabled() {
    return this.db.homepageSection.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
    });
  }

  findById(id: string) {
    return this.db.homepageSection.findUnique({ where: { id } });
  }

  findByKey(key: string) {
    return this.db.homepageSection.findUnique({ where: { key } });
  }

  /** Create the section if its key is new, otherwise update it. */
  upsert({ key, ...rest }: UpsertHomepageSectionInput) {
    return this.db.homepageSection.upsert({
      where: { key },
      create: { key, ...rest },
      update: rest,
    });
  }

  update(id: string, data: UpdateHomepageSectionInput) {
    return this.db.homepageSection.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.db.homepageSection.delete({ where: { id } });
  }
}
