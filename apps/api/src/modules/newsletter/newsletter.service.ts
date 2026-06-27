import { generateOpaqueToken } from "@strophic/auth";
import type { Repositories } from "@strophic/database";

export class NewsletterService {
  constructor(private readonly deps: { repos: Repositories }) {}

  /** Idempotent subscribe: re-subscribes a previously unsubscribed email, no-ops if already active. */
  async subscribe(email: string, source?: string): Promise<void> {
    const existing = await this.deps.repos.newsletter.findByEmail(email);
    if (existing) {
      if (existing.status === "UNSUBSCRIBED") {
        await this.deps.repos.newsletter.resubscribe(existing.id);
      }
      return;
    }
    await this.deps.repos.newsletter.create({
      email,
      unsubscribeToken: generateOpaqueToken(),
      source: source ?? null,
    });
  }

  async unsubscribe(token: string): Promise<void> {
    const sub = await this.deps.repos.newsletter.findByToken(token);
    if (sub) await this.deps.repos.newsletter.unsubscribe(sub.id);
  }

  list(opts: { skip: number; take: number }) {
    return this.deps.repos.newsletter.list(opts);
  }
}
