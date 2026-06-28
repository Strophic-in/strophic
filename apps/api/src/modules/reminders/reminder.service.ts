import type { Repositories } from "@strophic/database";
import { dailyDigestEmail, type EmailProvider } from "@strophic/email";
import type { AppConfig } from "../../env";

const ymd = (d: Date): string => d.toISOString().slice(0, 10);

export interface DigestResult {
  sent: boolean;
  overdue: number;
  dueToday: number;
  upcoming: number;
  newLeads: number;
}

/** Scheduled reminders - invoked by the cron route (Vercel Cron). */
export class ReminderService {
  constructor(
    private readonly deps: { repos: Repositories; config: AppConfig; email: EmailProvider },
  ) {}

  /**
   * Build and (best-effort) send the owner's daily digest: overdue / due-today /
   * upcoming tasks plus new leads in the last 24h. Skips sending when there is
   * genuinely nothing to report.
   */
  async runDailyDigest(now = new Date()): Promise<DigestResult> {
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const horizon = new Date(startOfToday.getTime() + 4 * 24 * 60 * 60 * 1000); // through the next 3 days
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [dueTodos, newLeads] = await Promise.all([
      this.deps.repos.todos.dueWithin(horizon),
      this.deps.repos.leads.countSince(since24h),
    ]);

    const fmt = (t: { title: string; dueDate: Date | null }) => ({
      title: t.title,
      dueDate: t.dueDate ? ymd(t.dueDate) : "",
    });
    const overdue = dueTodos.filter((t) => t.dueDate && t.dueDate < startOfToday).map(fmt);
    const dueToday = dueTodos
      .filter((t) => t.dueDate && t.dueDate >= startOfToday && t.dueDate < endOfToday)
      .map(fmt);
    const upcoming = dueTodos.filter((t) => t.dueDate && t.dueDate >= endOfToday).map(fmt);

    const result: DigestResult = {
      sent: false,
      overdue: overdue.length,
      dueToday: dueToday.length,
      upcoming: upcoming.length,
      newLeads,
    };

    const notify = this.deps.config.email.notifyEmail;
    if (!notify) return result;
    if (!overdue.length && !dueToday.length && !upcoming.length && newLeads === 0) return result;

    try {
      await this.deps.email.send({
        to: notify,
        ...dailyDigestEmail({
          overdue,
          dueToday,
          upcoming,
          newLeads,
          adminUrl: this.deps.config.adminUrl,
          brand: { companyName: "Strophic", siteUrl: this.deps.config.siteUrl },
        }),
      });
      result.sent = true;
    } catch (error) {
      console.error("[reminders] digest email failed:", error);
    }
    return result;
  }
}
