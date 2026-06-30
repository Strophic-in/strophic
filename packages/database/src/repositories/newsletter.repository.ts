import type { PrismaClient } from "../generated/prisma/client";

export interface CreateSubscriberInput {
  email: string;
  unsubscribeToken: string;
  source?: string | null;
}

export class NewsletterRepository {
  constructor(private readonly db: PrismaClient) {}

  findByEmail(email: string) {
    return this.db.newsletterSubscriber.findUnique({ where: { email } });
  }

  findByToken(unsubscribeToken: string) {
    return this.db.newsletterSubscriber.findUnique({ where: { unsubscribeToken } });
  }

  create(data: CreateSubscriberInput) {
    return this.db.newsletterSubscriber.create({
      data: {
        email: data.email,
        unsubscribeToken: data.unsubscribeToken,
        source: data.source ?? null,
        status: "SUBSCRIBED",
        confirmedAt: new Date(),
      },
    });
  }

  resubscribe(id: string) {
    return this.db.newsletterSubscriber.update({
      where: { id },
      data: { status: "SUBSCRIBED", confirmedAt: new Date() },
    });
  }

  unsubscribe(id: string) {
    return this.db.newsletterSubscriber.update({
      where: { id },
      data: { status: "UNSUBSCRIBED" },
    });
  }

  /** Every currently-subscribed recipient (email + unsubscribe token), for broadcasts. */
  listSubscribed() {
    return this.db.newsletterSubscriber.findMany({
      where: { status: "SUBSCRIBED" },
      select: { id: true, email: true, unsubscribeToken: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async list({ skip = 0, take = 50 }: { skip?: number; take?: number } = {}) {
    const [items, total] = await Promise.all([
      this.db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, skip, take }),
      this.db.newsletterSubscriber.count(),
    ]);
    return { items, total };
  }
}
