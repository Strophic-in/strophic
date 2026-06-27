import type { LeadSource, LeadStatus, Repositories } from "@strophic/database";
import { type EmailProvider, leadConfirmationEmail, leadNotificationEmail } from "@strophic/email";
import type { ContactInput, UpdateLeadInput } from "@strophic/validation";
import type { AppConfig } from "../../env";
import { NotFoundError } from "../../lib/errors";

const SOURCE_MAP: Record<string, LeadSource> = {
  instagram: "INSTAGRAM",
  x: "X",
  twitter: "X",
  linkedin: "LINKEDIN",
  google: "GOOGLE",
  referral: "REFERRAL",
  direct: "DIRECT",
};

function mapSource(source?: string): LeadSource {
  if (!source) return "DIRECT";
  return SOURCE_MAP[source.toLowerCase()] ?? "OTHER";
}

export interface LeadRequestMeta {
  ip?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
}

export class LeadService {
  constructor(
    private readonly deps: { repos: Repositories; config: AppConfig; email: EmailProvider },
  ) {}

  /** Persist a contact submission and fire confirmation + notification emails (best-effort). */
  async submit(input: ContactInput, meta: LeadRequestMeta): Promise<{ id: string }> {
    const lead = await this.deps.repos.leads.create({
      name: input.name,
      email: input.email,
      company: input.company ?? null,
      message: input.message,
      service: input.service ?? null,
      source: mapSource(input.source),
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      referrer: meta.referrer ?? null,
      ...(input.utm ? { utm: input.utm } : {}),
    });

    await this.sendNotifications(input);
    return { id: lead.id };
  }

  // Email failures must never fail the submission (the lead is already saved).
  private async sendNotifications(input: ContactInput): Promise<void> {
    const brand = { companyName: "Strophic", siteUrl: this.deps.config.siteUrl };

    try {
      await this.deps.email.send({
        to: input.email,
        ...leadConfirmationEmail({ name: input.name, brand }),
      });
    } catch (error) {
      console.error("[leads] confirmation email failed:", error);
    }

    const notify = this.deps.config.email.notifyEmail;
    if (!notify) return;
    try {
      await this.deps.email.send({
        to: notify,
        replyTo: input.email,
        ...leadNotificationEmail({
          lead: {
            name: input.name,
            email: input.email,
            company: input.company,
            message: input.message,
            source: input.source,
          },
          adminUrl: this.deps.config.adminUrl,
          brand,
        }),
      });
    } catch (error) {
      console.error("[leads] notification email failed:", error);
    }
  }

  // ── Admin ──
  list(opts: { skip: number; take: number; status?: LeadStatus }) {
    return this.deps.repos.leads.list(opts);
  }

  async get(id: string) {
    const lead = await this.deps.repos.leads.findById(id);
    if (!lead) throw new NotFoundError("Lead not found");
    return lead;
  }

  async update(id: string, data: UpdateLeadInput) {
    await this.get(id);
    return this.deps.repos.leads.update(id, data);
  }

  async addNote(id: string, authorId: string, body: string) {
    await this.get(id);
    return this.deps.repos.leads.addNote(id, authorId, body);
  }
}
