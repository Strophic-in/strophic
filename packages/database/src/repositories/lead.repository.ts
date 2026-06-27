import type {
  LeadPriority,
  LeadSource,
  LeadStatus,
  Prisma,
  PrismaClient,
} from "../generated/prisma/client";

export interface CreateLeadInput {
  name: string;
  email: string;
  company?: string | null;
  message: string;
  service?: string | null;
  source?: LeadSource;
  ip?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  utm?: Prisma.InputJsonValue;
}

export interface UpdateLeadInput {
  status?: LeadStatus;
  priority?: LeadPriority;
  tags?: string[];
  assignedToId?: string | null;
}

export interface ListLeadsOptions {
  skip?: number;
  take?: number;
  status?: LeadStatus;
}

export class LeadRepository {
  constructor(private readonly db: PrismaClient) {}

  create(data: CreateLeadInput) {
    return this.db.lead.create({ data });
  }

  findById(id: string) {
    return this.db.lead.findUnique({
      where: { id },
      include: {
        notes: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { id: true, name: true } } },
        },
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  async list({ skip = 0, take = 20, status }: ListLeadsOptions = {}) {
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.db.lead.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      this.db.lead.count({ where }),
    ]);
    return { items, total };
  }

  /** Count leads created on/after `since` — used by the reminder digest. */
  countSince(since: Date) {
    return this.db.lead.count({ where: { createdAt: { gte: since } } });
  }

  update(id: string, data: UpdateLeadInput) {
    return this.db.lead.update({ where: { id }, data });
  }

  addNote(leadId: string, authorId: string | null, body: string) {
    return this.db.leadNote.create({ data: { leadId, authorId, body } });
  }
}
