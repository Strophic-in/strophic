import {
  type EmailAddress,
  type EmailMessage,
  type EmailProvider,
  type SendResult,
  formatAddress,
  toRecipients,
} from "../types";

/**
 * Development provider — logs the message instead of sending it. Lets the whole
 * app run locally with no email credentials. Never select this in production.
 */
export class ConsoleProvider implements EmailProvider {
  readonly name = "console";

  constructor(private readonly from: EmailAddress) {}

  send(message: EmailMessage): Promise<SendResult> {
    // console.warn is allowed by lint and signals "not actually delivered".
    console.warn(
      `[email:console] would send "${message.subject}" from ${formatAddress(
        message.from ?? this.from,
      )} to ${toRecipients(message.to).join(", ")}`,
    );
    return Promise.resolve({ id: `console-${message.subject.length}` });
  }
}
