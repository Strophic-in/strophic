import type { Prisma, PrismaClient } from "../generated/prisma/client";

export interface CreateTeamMemberInput {
  name: string;
  role: string;
  bio?: string | null;
  avatarUrl?: string | null;
  links?: Prisma.InputJsonValue;
  published?: boolean;
  order?: number;
}

export type UpdateTeamMemberInput = Partial<CreateTeamMemberInput>;

export interface ListTeamMembersOptions {
  skip?: number;
  take?: number;
  published?: boolean;
}

export class TeamMemberRepository {
  constructor(private readonly db: PrismaClient) {}

  create(data: CreateTeamMemberInput) {
    return this.db.teamMember.create({ data });
  }

  findById(id: string) {
    return this.db.teamMember.findUnique({ where: { id } });
  }

  async list({ skip = 0, take = 100, published }: ListTeamMembersOptions = {}) {
    const where = published !== undefined ? { published } : {};
    const [items, total] = await Promise.all([
      this.db.teamMember.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        skip,
        take,
      }),
      this.db.teamMember.count({ where }),
    ]);
    return { items, total };
  }

  update(id: string, data: UpdateTeamMemberInput) {
    return this.db.teamMember.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.db.teamMember.delete({ where: { id } });
  }
}
