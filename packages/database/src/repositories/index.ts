import type { PrismaClient } from "../generated/prisma/client";
import { LeadRepository } from "./lead.repository";
import { MediaRepository } from "./media.repository";
import { NewsletterRepository } from "./newsletter.repository";
import { PasswordResetTokenRepository } from "./password-reset.repository";
import { RefreshTokenRepository } from "./refresh-token.repository";
import { SettingRepository } from "./setting.repository";
import { UserRepository } from "./user.repository";

export * from "./user.repository";
export * from "./refresh-token.repository";
export * from "./password-reset.repository";
export * from "./setting.repository";
export * from "./media.repository";
export * from "./lead.repository";
export * from "./newsletter.repository";

/** Build the full set of repositories from one client — convenient for DI in the API. */
export function createRepositories(db: PrismaClient) {
  return {
    users: new UserRepository(db),
    refreshTokens: new RefreshTokenRepository(db),
    passwordResets: new PasswordResetTokenRepository(db),
    settings: new SettingRepository(db),
    media: new MediaRepository(db),
    leads: new LeadRepository(db),
    newsletter: new NewsletterRepository(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
