import type { TodoPriority, TodoStatus, PrismaClient } from "../generated/prisma/client";

export interface CreateTodoInput {
  title: string;
  description?: string | null;
  status?: TodoStatus;
  priority?: TodoPriority;
  dueDate?: Date | null;
  reminderAt?: Date | null;
  completedAt?: Date | null;
}

export type UpdateTodoInput = Partial<CreateTodoInput>;

export interface ListTodosOptions {
  skip?: number;
  take?: number;
  status?: TodoStatus;
}

export class TodoRepository {
  constructor(private readonly db: PrismaClient) {}

  create(data: CreateTodoInput) {
    return this.db.todo.create({ data });
  }

  findById(id: string) {
    return this.db.todo.findUnique({ where: { id } });
  }

  async list({ skip = 0, take = 200, status }: ListTodosOptions = {}) {
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.db.todo.findMany({
        where,
        // Open tasks first, then by due date (nulls last), then newest.
        orderBy: [{ status: "asc" }, { dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
        skip,
        take,
      }),
      this.db.todo.count({ where }),
    ]);
    return { items, total };
  }

  /** Open (non-DONE) todos with a due date on/before `end`, soonest first. */
  dueWithin(end: Date) {
    return this.db.todo.findMany({
      where: { status: { not: "DONE" }, dueDate: { not: null, lte: end } },
      orderBy: { dueDate: "asc" },
    });
  }

  update(id: string, data: UpdateTodoInput) {
    return this.db.todo.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.db.todo.delete({ where: { id } });
  }
}
