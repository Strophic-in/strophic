/** A named email address. */
export interface EmailAddress {
  email: string;
  name?: string;
}

/** A transactional message. `from` defaults to the provider's configured sender. */
export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: EmailAddress;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface SendResult {
  id: string;
}

/**
 * The single seam every part of the app depends on. Swapping Resend for SES,
 * SendGrid, or Zoho ZeptoMail is implementing this interface - no business-logic change.
 */
export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<SendResult>;
}

/** Thrown when a provider fails to accept a message. */
export class EmailSendError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "EmailSendError";
  }
}

/** Format an address for an RFC 5322 header. */
export function formatAddress(address: EmailAddress): string {
  return address.name ? `${address.name} <${address.email}>` : address.email;
}

/** Normalize a recipient field to an array. */
export function toRecipients(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}
