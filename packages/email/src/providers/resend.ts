import {
  type EmailAddress,
  type EmailMessage,
  EmailSendError,
  type EmailProvider,
  type SendResult,
  formatAddress,
  toRecipients,
} from "../types";

export interface ResendConfig {
  apiKey: string;
  /** Default sender used when a message omits `from`. */
  from: EmailAddress;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Resend provider — pure `fetch`, so it runs unchanged on Cloudflare Workers
 * (no Node-only dependencies). See https://resend.com/docs/api-reference/emails.
 */
export class ResendProvider implements EmailProvider {
  readonly name = "resend";

  constructor(private readonly config: ResendConfig) {}

  async send(message: EmailMessage): Promise<SendResult> {
    const payload = {
      from: formatAddress(message.from ?? this.config.from),
      to: toRecipients(message.to),
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
      cc: message.cc ? toRecipients(message.cc) : undefined,
      bcc: message.bcc ? toRecipients(message.bcc) : undefined,
    };

    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new EmailSendError(
        `Resend rejected the message (HTTP ${response.status})${detail ? `: ${detail}` : ""}`,
        response.status,
      );
    }

    const data = (await response.json()) as { id?: string };
    return { id: data.id ?? "" };
  }
}
