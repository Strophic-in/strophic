import { type Repositories, createRepositories, getPrisma } from "@strophic/database";
import { createEmailProvider } from "@strophic/email";
import type { AppConfig } from "./env";
import { AuthService } from "./modules/auth/auth.service";
import { LeadService } from "./modules/leads/lead.service";
import { MediaService } from "./modules/media/media.service";
import { NewsletterService } from "./modules/newsletter/newsletter.service";
import { SettingsService } from "./modules/settings/settings.service";
import { StorageService } from "./services/storage.service";

/** Wired application dependencies, built once per process from config. */
export interface Container {
  config: AppConfig;
  repos: Repositories;
  auth: AuthService;
  media: MediaService;
  settings: SettingsService;
  leads: LeadService;
  newsletter: NewsletterService;
}

export function createContainer(config: AppConfig): Container {
  const repos = createRepositories(getPrisma(config.databaseUrl));
  const email = createEmailProvider({
    provider: config.email.provider,
    from: config.email.from,
    resendApiKey: config.email.resendApiKey,
  });
  const storage = new StorageService(config.storage);

  return {
    config,
    repos,
    auth: new AuthService({ repos, config, email }),
    media: new MediaService({ repos, storage, config }),
    settings: new SettingsService({ repos }),
    leads: new LeadService({ repos, config, email }),
    newsletter: new NewsletterService({ repos }),
  };
}
