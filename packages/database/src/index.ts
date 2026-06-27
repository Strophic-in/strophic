// Public surface of @strophic/database.
export { getPrisma, type Database } from "./client";

// Repositories + the DI factory.
export * from "./repositories";

// Re-export the generated client value + namespace and the domain types/enums
// so consumers never reach into ./generated directly.
export {
  PrismaClient,
  Prisma,
  Role,
  LeadSource,
  LeadStatus,
  LeadPriority,
  SubscriberStatus,
  PostStatus,
} from "./generated/prisma/client";
export type {
  User,
  RefreshToken,
  PasswordResetToken,
  Setting,
  Media,
  MediaFolder,
  Lead,
  LeadNote,
  NewsletterSubscriber,
  BlogPost,
} from "./generated/prisma/client";
