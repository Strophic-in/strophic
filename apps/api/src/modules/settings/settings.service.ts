import { type Prisma, type Repositories } from "@strophic/database";

// Settings groups safe to expose to the public website (no provider/secret-ish
// config). The "email" group is intentionally excluded.
const PUBLIC_GROUPS = new Set(["company", "social", "seo", "theme"]);

export class SettingsService {
  constructor(private readonly deps: { repos: Repositories }) {}

  getAll() {
    return this.deps.repos.settings.getAll();
  }

  /** Public, read-only subset keyed by group, e.g. { social: { x, linkedin } }. */
  async getPublic(): Promise<Record<string, Record<string, unknown>>> {
    const rows = await this.deps.repos.settings.getAll();
    const out: Record<string, Record<string, unknown>> = {};
    for (const row of rows) {
      if (PUBLIC_GROUPS.has(row.group)) {
        out[row.group] = (row.value ?? {}) as Record<string, unknown>;
      }
    }
    return out;
  }

  getGroup(group: string) {
    return this.deps.repos.settings.getGroup(group);
  }

  updateGroup(group: string, value: Record<string, unknown>) {
    return this.deps.repos.settings.upsertGroup(group, value as Prisma.InputJsonValue);
  }
}
