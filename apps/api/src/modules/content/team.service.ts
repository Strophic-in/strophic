import { type Prisma, type Repositories } from "@strophic/database";
import type { CreateTeamMemberInput, UpdateTeamMemberInput } from "@strophic/validation";
import { NotFoundError } from "../../lib/errors";

export class TeamService {
  constructor(private readonly deps: { repos: Repositories }) {}

  create(input: CreateTeamMemberInput) {
    return this.deps.repos.team.create({
      ...input,
      links: input.links as Prisma.InputJsonValue,
    });
  }

  async update(id: string, input: UpdateTeamMemberInput) {
    await this.get(id);
    return this.deps.repos.team.update(id, {
      ...input,
      ...(input.links !== undefined ? { links: input.links as Prisma.InputJsonValue } : {}),
    });
  }

  async get(id: string) {
    const item = await this.deps.repos.team.findById(id);
    if (!item) throw new NotFoundError("Team member not found");
    return item;
  }

  list(opts: { skip: number; take: number }) {
    return this.deps.repos.team.list(opts);
  }

  async remove(id: string) {
    await this.get(id);
    await this.deps.repos.team.delete(id);
  }

  // ── Public ──
  listPublished() {
    return this.deps.repos.team.list({ published: true, take: 100 });
  }
}
