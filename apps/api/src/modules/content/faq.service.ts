import type { Repositories } from "@strophic/database";
import type { CreateFaqInput, UpdateFaqInput } from "@strophic/validation";
import { NotFoundError } from "../../lib/errors";

export class FaqService {
  constructor(private readonly deps: { repos: Repositories }) {}

  create(input: CreateFaqInput) {
    return this.deps.repos.faqs.create({
      question: input.question,
      answer: input.answer,
      category: input.category ?? null,
      published: input.published,
      order: input.order,
    });
  }

  async update(id: string, input: UpdateFaqInput) {
    await this.get(id);
    return this.deps.repos.faqs.update(id, input);
  }

  async get(id: string) {
    const item = await this.deps.repos.faqs.findById(id);
    if (!item) throw new NotFoundError("FAQ not found");
    return item;
  }

  list(opts: { skip: number; take: number }) {
    return this.deps.repos.faqs.list(opts);
  }

  async remove(id: string) {
    await this.get(id);
    await this.deps.repos.faqs.delete(id);
  }

  // ── Public ──
  listPublished() {
    return this.deps.repos.faqs.list({ published: true, take: 100 });
  }
}
