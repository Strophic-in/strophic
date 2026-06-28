import type { PrismaClient } from "../generated/prisma/client";
import { AnalyticsRepository } from "./analytics.repository";
import { BlogRepository } from "./blog.repository";
import { FaqRepository } from "./faq.repository";
import { HomepageSectionRepository } from "./homepage-section.repository";
import { LeadRepository } from "./lead.repository";
import { MediaRepository } from "./media.repository";
import { NewsletterRepository } from "./newsletter.repository";
import { PasswordResetTokenRepository } from "./password-reset.repository";
import { ProductRepository } from "./product.repository";
import { ProjectRepository } from "./project.repository";
import { RefreshTokenRepository } from "./refresh-token.repository";
import { ServiceRepository } from "./service.repository";
import { SettingRepository } from "./setting.repository";
import { TeamMemberRepository } from "./team-member.repository";
import { TestimonialRepository } from "./testimonial.repository";
import { TodoRepository } from "./todo.repository";
import { UserRepository } from "./user.repository";

export * from "./user.repository";
export * from "./refresh-token.repository";
export * from "./password-reset.repository";
export * from "./setting.repository";
export * from "./media.repository";
export * from "./lead.repository";
export * from "./newsletter.repository";
export * from "./blog.repository";
export * from "./testimonial.repository";
export * from "./faq.repository";
export * from "./project.repository";
export * from "./product.repository";
export * from "./service.repository";
export * from "./team-member.repository";
export * from "./homepage-section.repository";
export * from "./todo.repository";
export * from "./analytics.repository";

/** Build the full set of repositories from one client - convenient for DI in the API. */
export function createRepositories(db: PrismaClient) {
  return {
    users: new UserRepository(db),
    refreshTokens: new RefreshTokenRepository(db),
    passwordResets: new PasswordResetTokenRepository(db),
    settings: new SettingRepository(db),
    media: new MediaRepository(db),
    leads: new LeadRepository(db),
    newsletter: new NewsletterRepository(db),
    blog: new BlogRepository(db),
    testimonials: new TestimonialRepository(db),
    faqs: new FaqRepository(db),
    projects: new ProjectRepository(db),
    products: new ProductRepository(db),
    services: new ServiceRepository(db),
    team: new TeamMemberRepository(db),
    homepageSections: new HomepageSectionRepository(db),
    todos: new TodoRepository(db),
    analytics: new AnalyticsRepository(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
