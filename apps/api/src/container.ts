import { type Repositories, createRepositories, getPrisma } from "@strophic/database";
import { createEmailProvider } from "@strophic/email";
import type { AppConfig } from "./env";
import { AuthService } from "./modules/auth/auth.service";
import { AnalyticsService } from "./modules/analytics/analytics.service";
import { BlogService } from "./modules/blog/blog.service";
import { FaqService } from "./modules/content/faq.service";
import { HomepageService } from "./modules/content/homepage.service";
import { ProductService } from "./modules/content/product.service";
import { ProjectService } from "./modules/content/project.service";
import { ServiceOfferingService } from "./modules/content/service-offering.service";
import { TeamService } from "./modules/content/team.service";
import { TestimonialService } from "./modules/content/testimonial.service";
import { TodoService } from "./modules/content/todo.service";
import { LeadService } from "./modules/leads/lead.service";
import { MediaService } from "./modules/media/media.service";
import { NewsletterService } from "./modules/newsletter/newsletter.service";
import { ReminderService } from "./modules/reminders/reminder.service";
import { SettingsService } from "./modules/settings/settings.service";
import { DeployService } from "./services/deploy.service";
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
  blog: BlogService;
  testimonials: TestimonialService;
  faqs: FaqService;
  projects: ProjectService;
  products: ProductService;
  serviceOfferings: ServiceOfferingService;
  team: TeamService;
  homepage: HomepageService;
  todos: TodoService;
  analytics: AnalyticsService;
  reminders: ReminderService;
  deploy: DeployService;
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
    blog: new BlogService({ repos, config, email }),
    testimonials: new TestimonialService({ repos }),
    faqs: new FaqService({ repos }),
    projects: new ProjectService({ repos }),
    products: new ProductService({ repos }),
    serviceOfferings: new ServiceOfferingService({ repos }),
    team: new TeamService({ repos }),
    homepage: new HomepageService({ repos }),
    todos: new TodoService({ repos }),
    analytics: new AnalyticsService({ repos, config }),
    reminders: new ReminderService({ repos, config, email }),
    deploy: new DeployService({ config }),
  };
}
