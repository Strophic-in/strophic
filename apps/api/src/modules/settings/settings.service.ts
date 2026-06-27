import { type Prisma, type Repositories } from "@strophic/database";

export class SettingsService {
  constructor(private readonly deps: { repos: Repositories }) {}

  getAll() {
    return this.deps.repos.settings.getAll();
  }

  getGroup(group: string) {
    return this.deps.repos.settings.getGroup(group);
  }

  updateGroup(group: string, value: Record<string, unknown>) {
    return this.deps.repos.settings.upsertGroup(group, value as Prisma.InputJsonValue);
  }
}
