import { createHash } from "node:crypto";
import type { Repositories } from "@strophic/database";
import type { TrackEventInput } from "@strophic/validation";
import type { AppConfig } from "../../env";

const sha256 = (input: string): string => createHash("sha256").update(input).digest("hex");

/** Reduce a referrer URL to its hostname (less noise, no query strings stored). */
function referrerHost(referrer: string | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname || null;
  } catch {
    return referrer.slice(0, 120);
  }
}

export class AnalyticsService {
  constructor(private readonly deps: { repos: Repositories; config: AppConfig }) {}

  /**
   * A daily-rotating salt: the same visitor produces the same hash within a day,
   * but cannot be correlated across days. Derived from a server secret so it is
   * never guessable by a client.
   */
  private dailySalt(now: Date): string {
    const ymd = now.toISOString().slice(0, 10);
    return sha256(`${this.deps.config.jwt.refreshSecret}:analytics:${ymd}`);
  }

  private visitorHash(ip: string | null, userAgent: string | null, now: Date): string | null {
    if (!ip) return null;
    return sha256(`${this.dailySalt(now)}:${ip}:${userAgent ?? ""}`);
  }

  async track(
    input: TrackEventInput,
    ctx: { ip: string | null; userAgent: string | null },
  ): Promise<void> {
    await this.deps.repos.analytics.create({
      type: input.type,
      name: input.name ?? null,
      path: input.path,
      referrer: referrerHost(input.referrer),
      visitorHash: this.visitorHash(ctx.ip, ctx.userAgent, new Date()),
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
    });
  }

  /** Aggregated dashboard data for the last `days` days. */
  async dashboard(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [summary, daily, topPaths, topReferrers] = await Promise.all([
      this.deps.repos.analytics.summary(since),
      this.deps.repos.analytics.dailyPageviews(since),
      this.deps.repos.analytics.topPaths(since, 10),
      this.deps.repos.analytics.topReferrers(since, 8),
    ]);
    return { days, summary, daily, topPaths, topReferrers };
  }
}
