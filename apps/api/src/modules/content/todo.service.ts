import type { Repositories, TodoStatus } from "@strophic/database";
import type { CreateTodoInput, UpdateTodoInput } from "@strophic/validation";
import { NotFoundError } from "../../lib/errors";

/** Derive completedAt from a status change: set when moving to DONE, cleared otherwise. */
function completedAtFor(status: TodoStatus | undefined): Date | null | undefined {
  if (status === undefined) return undefined;
  return status === "DONE" ? new Date() : null;
}

export class TodoService {
  constructor(private readonly deps: { repos: Repositories }) {}

  create(input: CreateTodoInput) {
    return this.deps.repos.todos.create({
      ...input,
      completedAt: input.status === "DONE" ? new Date() : null,
    });
  }

  async update(id: string, input: UpdateTodoInput) {
    const existing = await this.get(id);
    const completedAt =
      input.status !== undefined && input.status !== existing.status
        ? completedAtFor(input.status)
        : undefined;
    return this.deps.repos.todos.update(id, {
      ...input,
      ...(completedAt !== undefined ? { completedAt } : {}),
    });
  }

  async get(id: string) {
    const item = await this.deps.repos.todos.findById(id);
    if (!item) throw new NotFoundError("Todo not found");
    return item;
  }

  list(opts: { skip: number; take: number; status?: TodoStatus }) {
    return this.deps.repos.todos.list(opts);
  }

  async remove(id: string) {
    await this.get(id);
    await this.deps.repos.todos.delete(id);
  }
}
