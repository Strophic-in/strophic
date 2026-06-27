import type { Prisma, PrismaClient } from "../generated/prisma/client";

export class SettingRepository {
  constructor(private readonly db: PrismaClient) {}

  getGroup(group: string) {
    return this.db.setting.findUnique({ where: { group } });
  }

  getAll() {
    return this.db.setting.findMany({ orderBy: { group: "asc" } });
  }

  upsertGroup(group: string, value: Prisma.InputJsonValue) {
    return this.db.setting.upsert({
      where: { group },
      create: { group, value },
      update: { value },
    });
  }
}
