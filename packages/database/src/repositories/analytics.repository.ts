import type { Prisma, PrismaClient } from "../generated/prisma/client";

export interface CreateAnalyticsEventInput {
  type?: string;
  name?: string | null;
  path: string;
  referrer?: string | null;
  visitorHash?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export interface AnalyticsSummary {
  pageviews: number;
  visitors: number;
}

export interface CountByKey {
  key: string;
  count: number;
}

export interface DailyCount {
  date: string; // YYYY-MM-DD (UTC)
  count: number;
}

export class AnalyticsRepository {
  constructor(private readonly db: PrismaClient) {}

  create(data: CreateAnalyticsEventInput) {
    return this.db.analyticsEvent.create({ data });
  }

  /** Total pageviews + distinct visitors since `since`. */
  async summary(since: Date): Promise<AnalyticsSummary> {
    const where = { type: "pageview", createdAt: { gte: since } } as const;
    const [pageviews, distinct] = await Promise.all([
      this.db.analyticsEvent.count({ where }),
      this.db.analyticsEvent.findMany({
        where: { ...where, visitorHash: { not: null } },
        distinct: ["visitorHash"],
        select: { visitorHash: true },
      }),
    ]);
    return { pageviews, visitors: distinct.length };
  }

  /** Pageviews grouped by UTC day since `since`, ascending. */
  async dailyPageviews(since: Date): Promise<DailyCount[]> {
    const rows = await this.db.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
      FROM analytics_events
      WHERE type = 'pageview' AND "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `;
    return rows.map((r) => ({
      date: r.day.toISOString().slice(0, 10),
      count: Number(r.count),
    }));
  }

  /** Top values of a groupable column (path or referrer) since `since`. */
  private async topBy(
    field: "path" | "referrer",
    since: Date,
    limit: number,
  ): Promise<CountByKey[]> {
    const where: Prisma.AnalyticsEventWhereInput = {
      type: "pageview",
      createdAt: { gte: since },
      ...(field === "referrer" ? { referrer: { not: null } } : {}),
    };
    const grouped = await this.db.analyticsEvent.groupBy({
      by: [field],
      where,
      _count: { _all: true },
      orderBy: { _count: { [field]: "desc" } },
      take: limit,
    });
    return grouped.map((g) => ({
      key: (g[field] as string | null) ?? "(direct)",
      count: g._count._all,
    }));
  }

  topPaths(since: Date, limit = 10): Promise<CountByKey[]> {
    return this.topBy("path", since, limit);
  }

  topReferrers(since: Date, limit = 10): Promise<CountByKey[]> {
    return this.topBy("referrer", since, limit);
  }
}
