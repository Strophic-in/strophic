import { ConsoleProvider } from "./providers/console";
import { ResendProvider } from "./providers/resend";
import type { EmailAddress, EmailProvider } from "./types";

export type EmailProviderName = "resend" | "console";

export interface EmailFactoryConfig {
  provider: EmailProviderName;
  from: EmailAddress;
  resendApiKey?: string;
}

/**
 * Build the configured provider. The rest of the app depends only on the
 * returned `EmailProvider`, never on a concrete implementation.
 */
export function createEmailProvider(config: EmailFactoryConfig): EmailProvider {
  switch (config.provider) {
    case "resend": {
      if (!config.resendApiKey) {
        throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
      }
      return new ResendProvider({ apiKey: config.resendApiKey, from: config.from });
    }
    case "console":
      return new ConsoleProvider(config.from);
    default: {
      const exhaustive: never = config.provider;
      throw new Error(`Unknown email provider: ${String(exhaustive)}`);
    }
  }
}
