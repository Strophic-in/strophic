// src/vercel.ts
import { getRequestListener } from "@hono/node-server";

// src/app.ts
import { Hono as Hono20 } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";

// ../../packages/database/src/client.ts
import { PrismaPg } from "@prisma/adapter-pg";

// ../../packages/database/src/generated/prisma/client.ts
import "node:process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import "@prisma/client/runtime/client";

// ../../packages/database/src/generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.8.0",
  "engineVersion": "3c6e192761c0362d496ed980de936e2f3cebcd3a",
  "activeProvider": "postgresql",
  "inlineSchema": '// Strophic database schema - Phase 1 (identity, auth, settings, media).\n// CMS/CRM models (Lead, BlogPost, Project, ...) arrive in later phases.\n\ngenerator client {\n  provider     = "prisma-client"\n  output       = "../src/generated/prisma"\n  moduleFormat = "esm"\n}\n\ndatasource db {\n  // Prisma 7: connection URLs live in prisma.config.ts (migrations) and the\n  // PrismaClient adapter (runtime). They are no longer set in the schema.\n  provider = "postgresql"\n}\n\nenum Role {\n  SUPER_ADMIN\n  ADMIN\n  EDITOR\n}\n\nmodel User {\n  id           String    @id @default(cuid())\n  email        String    @unique\n  passwordHash String\n  name         String\n  role         Role      @default(EDITOR)\n  isActive     Boolean   @default(true)\n  lastLoginAt  DateTime?\n  createdAt    DateTime  @default(now())\n  updatedAt    DateTime  @updatedAt\n\n  refreshTokens       RefreshToken[]\n  passwordResetTokens PasswordResetToken[]\n  uploadedMedia       Media[]\n  assignedLeads       Lead[]\n  leadNotes           LeadNote[]\n  posts               BlogPost[]\n\n  @@map("users")\n}\n\n/// Rotating refresh tokens. Only a hash is stored; `family` groups a rotation\n/// chain so reuse of an old token can revoke the whole family.\nmodel RefreshToken {\n  id           String    @id @default(cuid())\n  userId       String\n  tokenHash    String    @unique\n  family       String\n  expiresAt    DateTime\n  revokedAt    DateTime?\n  replacedById String?\n  userAgent    String?\n  ip           String?\n  createdAt    DateTime  @default(now())\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([family])\n  @@map("refresh_tokens")\n}\n\n/// Single-use, expiring password reset tokens (hash stored, never the raw token).\nmodel PasswordResetToken {\n  id        String    @id @default(cuid())\n  userId    String\n  tokenHash String    @unique\n  expiresAt DateTime\n  usedAt    DateTime?\n  createdAt DateTime  @default(now())\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map("password_reset_tokens")\n}\n\n/// Grouped site settings (company, social, email, seo, theme), one row per group.\nmodel Setting {\n  id        String   @id @default(cuid())\n  group     String   @unique\n  value     Json\n  updatedAt DateTime @updatedAt\n\n  @@map("settings")\n}\n\nmodel MediaFolder {\n  id        String   @id @default(cuid())\n  name      String\n  parentId  String?\n  createdAt DateTime @default(now())\n\n  parent   MediaFolder?  @relation("FolderTree", fields: [parentId], references: [id], onDelete: SetNull)\n  children MediaFolder[] @relation("FolderTree")\n  media    Media[]\n\n  @@index([parentId])\n  @@map("media_folders")\n}\n\nmodel Media {\n  id           String   @id @default(cuid())\n  key          String   @unique\n  url          String\n  mimeType     String\n  size         Int\n  width        Int?\n  height       Int?\n  alt          String?\n  folderId     String?\n  uploadedById String?\n  createdAt    DateTime @default(now())\n\n  folder     MediaFolder? @relation(fields: [folderId], references: [id], onDelete: SetNull)\n  uploadedBy User?        @relation(fields: [uploadedById], references: [id], onDelete: SetNull)\n\n  @@index([folderId])\n  @@index([uploadedById])\n  @@map("media")\n}\n\n// \u2500\u2500 CRM / Leads (Phase 3) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\nenum LeadSource {\n  INSTAGRAM\n  X\n  LINKEDIN\n  GOOGLE\n  REFERRAL\n  DIRECT\n  OTHER\n}\n\nenum LeadStatus {\n  NEW\n  CONTACTED\n  QUALIFIED\n  WON\n  LOST\n}\n\nenum LeadPriority {\n  LOW\n  MEDIUM\n  HIGH\n}\n\n/// A contact-form submission / sales lead.\nmodel Lead {\n  id           String       @id @default(cuid())\n  name         String\n  email        String\n  company      String?\n  message      String\n  service      String?\n  source       LeadSource   @default(DIRECT)\n  status       LeadStatus   @default(NEW)\n  priority     LeadPriority @default(MEDIUM)\n  tags         String[]     @default([])\n  assignedToId String?\n  ip           String?\n  userAgent    String?\n  referrer     String?\n  utm          Json?\n  createdAt    DateTime     @default(now())\n  updatedAt    DateTime     @updatedAt\n\n  assignedTo User?      @relation(fields: [assignedToId], references: [id], onDelete: SetNull)\n  notes      LeadNote[]\n\n  @@index([status])\n  @@index([createdAt])\n  @@index([email])\n  @@map("leads")\n}\n\n/// A follow-up note on a lead, authored by an admin user.\nmodel LeadNote {\n  id        String   @id @default(cuid())\n  leadId    String\n  authorId  String?\n  body      String\n  createdAt DateTime @default(now())\n\n  lead   Lead  @relation(fields: [leadId], references: [id], onDelete: Cascade)\n  author User? @relation(fields: [authorId], references: [id], onDelete: SetNull)\n\n  @@index([leadId])\n  @@map("lead_notes")\n}\n\nenum SubscriberStatus {\n  SUBSCRIBED\n  UNSUBSCRIBED\n}\n\n/// Newsletter subscriber. `unsubscribeToken` lets a subscriber opt out without auth.\nmodel NewsletterSubscriber {\n  id               String           @id @default(cuid())\n  email            String           @unique\n  status           SubscriberStatus @default(SUBSCRIBED)\n  source           String?\n  unsubscribeToken String           @unique\n  confirmedAt      DateTime?\n  createdAt        DateTime         @default(now())\n  updatedAt        DateTime         @updatedAt\n\n  @@index([status])\n  @@map("newsletter_subscribers")\n}\n\n// \u2500\u2500 Blog / CMS (Phase 4) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\nenum PostStatus {\n  DRAFT\n  PUBLISHED\n  ARCHIVED\n}\n\n/// A blog post. `content` is MDX/markdown source; category + tags are denormalized\n/// strings (kept simple for v1; can be normalized to join tables later).\nmodel BlogPost {\n  id              String     @id @default(cuid())\n  title           String\n  slug            String     @unique\n  excerpt         String\n  content         String\n  coverImage      String?\n  category        String     @default("Engineering")\n  tags            String[]   @default([])\n  status          PostStatus @default(DRAFT)\n  readingTime     Int        @default(1)\n  metaTitle       String?\n  metaDescription String?\n  authorId        String?\n  publishedAt     DateTime?\n  // When a "new post" email was last sent to newsletter subscribers (null = never).\n  // Guards the admin "Notify subscribers" action against accidental double-sends.\n  notifiedAt      DateTime?\n  createdAt       DateTime   @default(now())\n  updatedAt       DateTime   @updatedAt\n\n  author User? @relation(fields: [authorId], references: [id], onDelete: SetNull)\n\n  @@index([status])\n  @@index([publishedAt])\n  @@map("blog_posts")\n}\n\n// \u2500\u2500 Site content / CMS (Phase 4) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n/// A customer testimonial / social proof quote. `order` controls display order\n/// (lower first); `featured` surfaces it on the homepage.\nmodel Testimonial {\n  id        String   @id @default(cuid())\n  quote     String\n  author    String\n  role      String\n  company   String\n  avatarUrl String?\n  rating    Int?\n  featured  Boolean  @default(false)\n  published Boolean  @default(true)\n  order     Int      @default(0)\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([published])\n  @@index([featured])\n  @@map("testimonials")\n}\n\n/// A frequently-asked question. `category` groups questions on a page; `order`\n/// controls display order within a group.\nmodel Faq {\n  id        String   @id @default(cuid())\n  question  String\n  answer    String\n  category  String?\n  published Boolean  @default(true)\n  order     Int      @default(0)\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([published])\n  @@index([category])\n  @@map("faqs")\n}\n\n/// A portfolio project / case study. `accentFrom`/`accentTo` are the cover\n/// gradient stops; `content` is the optional long-form case-study body (MDX).\nmodel Project {\n  id         String   @id @default(cuid())\n  slug       String   @unique\n  title      String\n  summary    String\n  category   String\n  tags       String[] @default([])\n  year       String\n  accentFrom String   @default("#7c5cff")\n  accentTo   String   @default("#3d2689")\n  results    String[] @default([])\n  coverImage String?\n  logoImage  String?\n  url        String?\n  content    String?\n  featured   Boolean  @default(false)\n  published  Boolean  @default(true)\n  order      Int      @default(0)\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([published])\n  @@index([featured])\n  @@map("projects")\n}\n\nenum ProductStatus {\n  LIVE\n  BETA\n  SOON\n}\n\n/// A Strophic-owned Micro-SaaS product. `content` is the optional detail body.\nmodel Product {\n  id          String        @id @default(cuid())\n  slug        String        @unique\n  name        String\n  tagline     String\n  description String\n  status      ProductStatus @default(BETA)\n  url         String?\n  pricing     String\n  features    String[]      @default([])\n  accentFrom  String        @default("#7c5cff")\n  accentTo    String        @default("#3d2689")\n  content     String?\n  featured    Boolean       @default(false)\n  published   Boolean       @default(true)\n  order       Int           @default(0)\n  createdAt   DateTime      @default(now())\n  updatedAt   DateTime      @updatedAt\n\n  @@index([published])\n  @@index([featured])\n  @@map("products")\n}\n\n/// A service offering. `workflow` is a JSON array of {title,description} steps;\n/// `faqs` is a JSON array of {question,answer}.\nmodel Service {\n  id          String   @id @default(cuid())\n  slug        String   @unique\n  icon        String   @default("sparkles")\n  title       String\n  summary     String\n  description String\n  benefits    String[] @default([])\n  stack       String[] @default([])\n  workflow    Json     @default("[]")\n  faqs        Json     @default("[]")\n  featured    Boolean  @default(false)\n  published   Boolean  @default(true)\n  order       Int      @default(0)\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  @@index([published])\n  @@index([featured])\n  @@map("services")\n}\n\n/// A team member. `links` is a JSON object of social/profile URLs.\nmodel TeamMember {\n  id        String   @id @default(cuid())\n  name      String\n  role      String\n  bio       String?\n  avatarUrl String?\n  links     Json     @default("{}")\n  published Boolean  @default(true)\n  order     Int      @default(0)\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([published])\n  @@map("team_members")\n}\n\n/// An editable, reorderable homepage section. `key` is a stable identifier\n/// (e.g. "hero", "services"); `config` holds section-specific content.\nmodel HomepageSection {\n  id        String   @id @default(cuid())\n  key       String   @unique\n  title     String?\n  subtitle  String?\n  enabled   Boolean  @default(true)\n  order     Int      @default(0)\n  config    Json     @default("{}")\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@map("homepage_sections")\n}\n\nenum TodoStatus {\n  TODO\n  IN_PROGRESS\n  DONE\n}\n\nenum TodoPriority {\n  LOW\n  MEDIUM\n  HIGH\n}\n\n/// An internal todo / task. `reminderAt` is reserved for the Phase 6 reminder jobs.\nmodel Todo {\n  id          String       @id @default(cuid())\n  title       String\n  description String?\n  status      TodoStatus   @default(TODO)\n  priority    TodoPriority @default(MEDIUM)\n  dueDate     DateTime?\n  reminderAt  DateTime?\n  completedAt DateTime?\n  createdAt   DateTime     @default(now())\n  updatedAt   DateTime     @updatedAt\n\n  @@index([status])\n  @@index([dueDate])\n  @@map("todos")\n}\n\n// \u2500\u2500 Analytics (Phase 6) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n/// A first-party analytics event (page view or custom event). Privacy-preserving:\n/// `visitorHash` is a salted SHA-256 of IP+UA with a salt that rotates daily, so a\n/// visitor cannot be tracked across days and no raw IP is ever stored.\nmodel AnalyticsEvent {\n  id          String   @id @default(cuid())\n  type        String   @default("pageview")\n  name        String?\n  path        String\n  referrer    String?\n  visitorHash String?\n  utmSource   String?\n  utmMedium   String?\n  utmCampaign String?\n  createdAt   DateTime @default(now())\n\n  @@index([createdAt])\n  @@index([type, createdAt])\n  @@index([path])\n  @@map("analytics_events")\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"passwordHash","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"Role"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"lastLoginAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokens","kind":"object","type":"RefreshToken","relationName":"RefreshTokenToUser"},{"name":"passwordResetTokens","kind":"object","type":"PasswordResetToken","relationName":"PasswordResetTokenToUser"},{"name":"uploadedMedia","kind":"object","type":"Media","relationName":"MediaToUser"},{"name":"assignedLeads","kind":"object","type":"Lead","relationName":"LeadToUser"},{"name":"leadNotes","kind":"object","type":"LeadNote","relationName":"LeadNoteToUser"},{"name":"posts","kind":"object","type":"BlogPost","relationName":"BlogPostToUser"}],"dbName":"users"},"RefreshToken":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"tokenHash","kind":"scalar","type":"String"},{"name":"family","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"revokedAt","kind":"scalar","type":"DateTime"},{"name":"replacedById","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"ip","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"RefreshTokenToUser"}],"dbName":"refresh_tokens"},"PasswordResetToken":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"tokenHash","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"usedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"PasswordResetTokenToUser"}],"dbName":"password_reset_tokens"},"Setting":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"group","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"Json"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"settings"},"MediaFolder":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"parentId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"parent","kind":"object","type":"MediaFolder","relationName":"FolderTree"},{"name":"children","kind":"object","type":"MediaFolder","relationName":"FolderTree"},{"name":"media","kind":"object","type":"Media","relationName":"MediaToMediaFolder"}],"dbName":"media_folders"},"Media":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"key","kind":"scalar","type":"String"},{"name":"url","kind":"scalar","type":"String"},{"name":"mimeType","kind":"scalar","type":"String"},{"name":"size","kind":"scalar","type":"Int"},{"name":"width","kind":"scalar","type":"Int"},{"name":"height","kind":"scalar","type":"Int"},{"name":"alt","kind":"scalar","type":"String"},{"name":"folderId","kind":"scalar","type":"String"},{"name":"uploadedById","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"folder","kind":"object","type":"MediaFolder","relationName":"MediaToMediaFolder"},{"name":"uploadedBy","kind":"object","type":"User","relationName":"MediaToUser"}],"dbName":"media"},"Lead":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"company","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"service","kind":"scalar","type":"String"},{"name":"source","kind":"enum","type":"LeadSource"},{"name":"status","kind":"enum","type":"LeadStatus"},{"name":"priority","kind":"enum","type":"LeadPriority"},{"name":"tags","kind":"scalar","type":"String"},{"name":"assignedToId","kind":"scalar","type":"String"},{"name":"ip","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"referrer","kind":"scalar","type":"String"},{"name":"utm","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"assignedTo","kind":"object","type":"User","relationName":"LeadToUser"},{"name":"notes","kind":"object","type":"LeadNote","relationName":"LeadToLeadNote"}],"dbName":"leads"},"LeadNote":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"leadId","kind":"scalar","type":"String"},{"name":"authorId","kind":"scalar","type":"String"},{"name":"body","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"lead","kind":"object","type":"Lead","relationName":"LeadToLeadNote"},{"name":"author","kind":"object","type":"User","relationName":"LeadNoteToUser"}],"dbName":"lead_notes"},"NewsletterSubscriber":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"SubscriberStatus"},{"name":"source","kind":"scalar","type":"String"},{"name":"unsubscribeToken","kind":"scalar","type":"String"},{"name":"confirmedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"newsletter_subscribers"},"BlogPost":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"excerpt","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"coverImage","kind":"scalar","type":"String"},{"name":"category","kind":"scalar","type":"String"},{"name":"tags","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"PostStatus"},{"name":"readingTime","kind":"scalar","type":"Int"},{"name":"metaTitle","kind":"scalar","type":"String"},{"name":"metaDescription","kind":"scalar","type":"String"},{"name":"authorId","kind":"scalar","type":"String"},{"name":"publishedAt","kind":"scalar","type":"DateTime"},{"name":"notifiedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"author","kind":"object","type":"User","relationName":"BlogPostToUser"}],"dbName":"blog_posts"},"Testimonial":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"quote","kind":"scalar","type":"String"},{"name":"author","kind":"scalar","type":"String"},{"name":"role","kind":"scalar","type":"String"},{"name":"company","kind":"scalar","type":"String"},{"name":"avatarUrl","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"featured","kind":"scalar","type":"Boolean"},{"name":"published","kind":"scalar","type":"Boolean"},{"name":"order","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"testimonials"},"Faq":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"question","kind":"scalar","type":"String"},{"name":"answer","kind":"scalar","type":"String"},{"name":"category","kind":"scalar","type":"String"},{"name":"published","kind":"scalar","type":"Boolean"},{"name":"order","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"faqs"},"Project":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"summary","kind":"scalar","type":"String"},{"name":"category","kind":"scalar","type":"String"},{"name":"tags","kind":"scalar","type":"String"},{"name":"year","kind":"scalar","type":"String"},{"name":"accentFrom","kind":"scalar","type":"String"},{"name":"accentTo","kind":"scalar","type":"String"},{"name":"results","kind":"scalar","type":"String"},{"name":"coverImage","kind":"scalar","type":"String"},{"name":"logoImage","kind":"scalar","type":"String"},{"name":"url","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"featured","kind":"scalar","type":"Boolean"},{"name":"published","kind":"scalar","type":"Boolean"},{"name":"order","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"projects"},"Product":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"tagline","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ProductStatus"},{"name":"url","kind":"scalar","type":"String"},{"name":"pricing","kind":"scalar","type":"String"},{"name":"features","kind":"scalar","type":"String"},{"name":"accentFrom","kind":"scalar","type":"String"},{"name":"accentTo","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"featured","kind":"scalar","type":"Boolean"},{"name":"published","kind":"scalar","type":"Boolean"},{"name":"order","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"products"},"Service":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"icon","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"summary","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"benefits","kind":"scalar","type":"String"},{"name":"stack","kind":"scalar","type":"String"},{"name":"workflow","kind":"scalar","type":"Json"},{"name":"faqs","kind":"scalar","type":"Json"},{"name":"featured","kind":"scalar","type":"Boolean"},{"name":"published","kind":"scalar","type":"Boolean"},{"name":"order","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"services"},"TeamMember":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"role","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"avatarUrl","kind":"scalar","type":"String"},{"name":"links","kind":"scalar","type":"Json"},{"name":"published","kind":"scalar","type":"Boolean"},{"name":"order","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"team_members"},"HomepageSection":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"key","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"subtitle","kind":"scalar","type":"String"},{"name":"enabled","kind":"scalar","type":"Boolean"},{"name":"order","kind":"scalar","type":"Int"},{"name":"config","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"homepage_sections"},"Todo":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"TodoStatus"},{"name":"priority","kind":"enum","type":"TodoPriority"},{"name":"dueDate","kind":"scalar","type":"DateTime"},{"name":"reminderAt","kind":"scalar","type":"DateTime"},{"name":"completedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"todos"},"AnalyticsEvent":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"type","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"path","kind":"scalar","type":"String"},{"name":"referrer","kind":"scalar","type":"String"},{"name":"visitorHash","kind":"scalar","type":"String"},{"name":"utmSource","kind":"scalar","type":"String"},{"name":"utmMedium","kind":"scalar","type":"String"},{"name":"utmCampaign","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":"analytics_events"}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","refreshTokens","passwordResetTokens","parent","children","media","_count","folder","uploadedBy","uploadedMedia","assignedTo","lead","author","notes","assignedLeads","leadNotes","posts","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","data","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","create","update","User.upsertOne","User.deleteOne","User.deleteMany","having","_min","_max","User.groupBy","User.aggregate","RefreshToken.findUnique","RefreshToken.findUniqueOrThrow","RefreshToken.findFirst","RefreshToken.findFirstOrThrow","RefreshToken.findMany","RefreshToken.createOne","RefreshToken.createMany","RefreshToken.createManyAndReturn","RefreshToken.updateOne","RefreshToken.updateMany","RefreshToken.updateManyAndReturn","RefreshToken.upsertOne","RefreshToken.deleteOne","RefreshToken.deleteMany","RefreshToken.groupBy","RefreshToken.aggregate","PasswordResetToken.findUnique","PasswordResetToken.findUniqueOrThrow","PasswordResetToken.findFirst","PasswordResetToken.findFirstOrThrow","PasswordResetToken.findMany","PasswordResetToken.createOne","PasswordResetToken.createMany","PasswordResetToken.createManyAndReturn","PasswordResetToken.updateOne","PasswordResetToken.updateMany","PasswordResetToken.updateManyAndReturn","PasswordResetToken.upsertOne","PasswordResetToken.deleteOne","PasswordResetToken.deleteMany","PasswordResetToken.groupBy","PasswordResetToken.aggregate","Setting.findUnique","Setting.findUniqueOrThrow","Setting.findFirst","Setting.findFirstOrThrow","Setting.findMany","Setting.createOne","Setting.createMany","Setting.createManyAndReturn","Setting.updateOne","Setting.updateMany","Setting.updateManyAndReturn","Setting.upsertOne","Setting.deleteOne","Setting.deleteMany","Setting.groupBy","Setting.aggregate","MediaFolder.findUnique","MediaFolder.findUniqueOrThrow","MediaFolder.findFirst","MediaFolder.findFirstOrThrow","MediaFolder.findMany","MediaFolder.createOne","MediaFolder.createMany","MediaFolder.createManyAndReturn","MediaFolder.updateOne","MediaFolder.updateMany","MediaFolder.updateManyAndReturn","MediaFolder.upsertOne","MediaFolder.deleteOne","MediaFolder.deleteMany","MediaFolder.groupBy","MediaFolder.aggregate","Media.findUnique","Media.findUniqueOrThrow","Media.findFirst","Media.findFirstOrThrow","Media.findMany","Media.createOne","Media.createMany","Media.createManyAndReturn","Media.updateOne","Media.updateMany","Media.updateManyAndReturn","Media.upsertOne","Media.deleteOne","Media.deleteMany","_avg","_sum","Media.groupBy","Media.aggregate","Lead.findUnique","Lead.findUniqueOrThrow","Lead.findFirst","Lead.findFirstOrThrow","Lead.findMany","Lead.createOne","Lead.createMany","Lead.createManyAndReturn","Lead.updateOne","Lead.updateMany","Lead.updateManyAndReturn","Lead.upsertOne","Lead.deleteOne","Lead.deleteMany","Lead.groupBy","Lead.aggregate","LeadNote.findUnique","LeadNote.findUniqueOrThrow","LeadNote.findFirst","LeadNote.findFirstOrThrow","LeadNote.findMany","LeadNote.createOne","LeadNote.createMany","LeadNote.createManyAndReturn","LeadNote.updateOne","LeadNote.updateMany","LeadNote.updateManyAndReturn","LeadNote.upsertOne","LeadNote.deleteOne","LeadNote.deleteMany","LeadNote.groupBy","LeadNote.aggregate","NewsletterSubscriber.findUnique","NewsletterSubscriber.findUniqueOrThrow","NewsletterSubscriber.findFirst","NewsletterSubscriber.findFirstOrThrow","NewsletterSubscriber.findMany","NewsletterSubscriber.createOne","NewsletterSubscriber.createMany","NewsletterSubscriber.createManyAndReturn","NewsletterSubscriber.updateOne","NewsletterSubscriber.updateMany","NewsletterSubscriber.updateManyAndReturn","NewsletterSubscriber.upsertOne","NewsletterSubscriber.deleteOne","NewsletterSubscriber.deleteMany","NewsletterSubscriber.groupBy","NewsletterSubscriber.aggregate","BlogPost.findUnique","BlogPost.findUniqueOrThrow","BlogPost.findFirst","BlogPost.findFirstOrThrow","BlogPost.findMany","BlogPost.createOne","BlogPost.createMany","BlogPost.createManyAndReturn","BlogPost.updateOne","BlogPost.updateMany","BlogPost.updateManyAndReturn","BlogPost.upsertOne","BlogPost.deleteOne","BlogPost.deleteMany","BlogPost.groupBy","BlogPost.aggregate","Testimonial.findUnique","Testimonial.findUniqueOrThrow","Testimonial.findFirst","Testimonial.findFirstOrThrow","Testimonial.findMany","Testimonial.createOne","Testimonial.createMany","Testimonial.createManyAndReturn","Testimonial.updateOne","Testimonial.updateMany","Testimonial.updateManyAndReturn","Testimonial.upsertOne","Testimonial.deleteOne","Testimonial.deleteMany","Testimonial.groupBy","Testimonial.aggregate","Faq.findUnique","Faq.findUniqueOrThrow","Faq.findFirst","Faq.findFirstOrThrow","Faq.findMany","Faq.createOne","Faq.createMany","Faq.createManyAndReturn","Faq.updateOne","Faq.updateMany","Faq.updateManyAndReturn","Faq.upsertOne","Faq.deleteOne","Faq.deleteMany","Faq.groupBy","Faq.aggregate","Project.findUnique","Project.findUniqueOrThrow","Project.findFirst","Project.findFirstOrThrow","Project.findMany","Project.createOne","Project.createMany","Project.createManyAndReturn","Project.updateOne","Project.updateMany","Project.updateManyAndReturn","Project.upsertOne","Project.deleteOne","Project.deleteMany","Project.groupBy","Project.aggregate","Product.findUnique","Product.findUniqueOrThrow","Product.findFirst","Product.findFirstOrThrow","Product.findMany","Product.createOne","Product.createMany","Product.createManyAndReturn","Product.updateOne","Product.updateMany","Product.updateManyAndReturn","Product.upsertOne","Product.deleteOne","Product.deleteMany","Product.groupBy","Product.aggregate","Service.findUnique","Service.findUniqueOrThrow","Service.findFirst","Service.findFirstOrThrow","Service.findMany","Service.createOne","Service.createMany","Service.createManyAndReturn","Service.updateOne","Service.updateMany","Service.updateManyAndReturn","Service.upsertOne","Service.deleteOne","Service.deleteMany","Service.groupBy","Service.aggregate","TeamMember.findUnique","TeamMember.findUniqueOrThrow","TeamMember.findFirst","TeamMember.findFirstOrThrow","TeamMember.findMany","TeamMember.createOne","TeamMember.createMany","TeamMember.createManyAndReturn","TeamMember.updateOne","TeamMember.updateMany","TeamMember.updateManyAndReturn","TeamMember.upsertOne","TeamMember.deleteOne","TeamMember.deleteMany","TeamMember.groupBy","TeamMember.aggregate","HomepageSection.findUnique","HomepageSection.findUniqueOrThrow","HomepageSection.findFirst","HomepageSection.findFirstOrThrow","HomepageSection.findMany","HomepageSection.createOne","HomepageSection.createMany","HomepageSection.createManyAndReturn","HomepageSection.updateOne","HomepageSection.updateMany","HomepageSection.updateManyAndReturn","HomepageSection.upsertOne","HomepageSection.deleteOne","HomepageSection.deleteMany","HomepageSection.groupBy","HomepageSection.aggregate","Todo.findUnique","Todo.findUniqueOrThrow","Todo.findFirst","Todo.findFirstOrThrow","Todo.findMany","Todo.createOne","Todo.createMany","Todo.createManyAndReturn","Todo.updateOne","Todo.updateMany","Todo.updateManyAndReturn","Todo.upsertOne","Todo.deleteOne","Todo.deleteMany","Todo.groupBy","Todo.aggregate","AnalyticsEvent.findUnique","AnalyticsEvent.findUniqueOrThrow","AnalyticsEvent.findFirst","AnalyticsEvent.findFirstOrThrow","AnalyticsEvent.findMany","AnalyticsEvent.createOne","AnalyticsEvent.createMany","AnalyticsEvent.createManyAndReturn","AnalyticsEvent.updateOne","AnalyticsEvent.updateMany","AnalyticsEvent.updateManyAndReturn","AnalyticsEvent.upsertOne","AnalyticsEvent.deleteOne","AnalyticsEvent.deleteMany","AnalyticsEvent.groupBy","AnalyticsEvent.aggregate","AND","OR","NOT","id","type","name","path","referrer","visitorHash","utmSource","utmMedium","utmCampaign","createdAt","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","title","description","TodoStatus","status","TodoPriority","priority","dueDate","reminderAt","completedAt","updatedAt","key","subtitle","enabled","order","config","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","role","bio","avatarUrl","links","published","slug","icon","summary","benefits","stack","workflow","faqs","featured","has","hasEvery","hasSome","tagline","ProductStatus","url","pricing","features","accentFrom","accentTo","content","category","tags","year","results","coverImage","logoImage","question","answer","quote","company","rating","excerpt","PostStatus","readingTime","metaTitle","metaDescription","authorId","publishedAt","notifiedAt","email","SubscriberStatus","source","unsubscribeToken","confirmedAt","leadId","body","message","service","LeadSource","LeadStatus","LeadPriority","assignedToId","ip","userAgent","utm","mimeType","size","width","height","alt","folderId","uploadedById","parentId","group","value","userId","tokenHash","expiresAt","usedAt","family","revokedAt","replacedById","passwordHash","Role","isActive","lastLoginAt","every","some","none","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","push","increment","decrement","multiply","divide"]'),
  graph: "rQeuAbACEgQAAO4EACAFAADvBAAgDAAA8AQAIBEAAPEEACASAADrBAAgEwAA8gQAIMwCAADsBAAwzQIAABgAEM4CAADsBAAwzwIBAAAAAdECAQCNBAAh2AJAAI8EACHtAkAAjwQAIfkCAADtBMcDIqQDAQAAAAHFAwEAjQQAIccDIACoBAAhyANAAJ0EACEBAAAAAQAgDgMAAPgEACDMAgAA-QQAMM0CAAADABDOAgAA-QQAMM8CAQCNBAAh2AJAAI8EACGxAwEAjgQAIbIDAQCOBAAhvgMBAI0EACG_AwEAjQQAIcADQACPBAAhwgMBAI0EACHDA0AAnQQAIcQDAQCOBAAhBQMAAPQGACCxAwAA-gQAILIDAAD6BAAgwwMAAPoEACDEAwAA-gQAIA4DAAD4BAAgzAIAAPkEADDNAgAAAwAQzgIAAPkEADDPAgEAAAAB2AJAAI8EACGxAwEAjgQAIbIDAQCOBAAhvgMBAI0EACG_AwEAAAABwANAAI8EACHCAwEAjQQAIcMDQACdBAAhxAMBAI4EACEDAAAAAwAgAQAABAAwAgAABQAgCgMAAPgEACDMAgAA9wQAMM0CAAAHABDOAgAA9wQAMM8CAQCNBAAh2AJAAI8EACG-AwEAjQQAIb8DAQCNBAAhwANAAI8EACHBA0AAnQQAIQIDAAD0BgAgwQMAAPoEACAKAwAA-AQAIMwCAAD3BAAwzQIAAAcAEM4CAAD3BAAwzwIBAAAAAdgCQACPBAAhvgMBAI0EACG_AwEAAAABwANAAI8EACHBA0AAnQQAIQMAAAAHACABAAAIADACAAAJACAQCgAA9AQAIAsAAOMEACDMAgAA9gQAMM0CAAALABDOAgAA9gQAMM8CAQCNBAAh2AJAAI8EACHuAgEAjQQAIYsDAQCNBAAhtAMBAI0EACG1AwIAqQQAIbYDAgC_BAAhtwMCAL8EACG4AwEAjgQAIbkDAQCOBAAhugMBAI4EACEHCgAA9gYAIAsAAPQGACC2AwAA-gQAILcDAAD6BAAguAMAAPoEACC5AwAA-gQAILoDAAD6BAAgEAoAAPQEACALAADjBAAgzAIAAPYEADDNAgAACwAQzgIAAPYEADDPAgEAAAAB2AJAAI8EACHuAgEAAAABiwMBAI0EACG0AwEAjQQAIbUDAgCpBAAhtgMCAL8EACG3AwIAvwQAIbgDAQCOBAAhuQMBAI4EACG6AwEAjgQAIQMAAAALACABAAAMADACAAANACAKBgAA9AQAIAcAAPUEACAIAADwBAAgzAIAAPMEADDNAgAADwAQzgIAAPMEADDPAgEAjQQAIdECAQCNBAAh2AJAAI8EACG7AwEAjgQAIQEAAAAPACABAAAADwAgBAYAAPYGACAHAAD3BgAgCAAA8AYAILsDAAD6BAAgCgYAAPQEACAHAAD1BAAgCAAA8AQAIMwCAADzBAAwzQIAAA8AEM4CAADzBAAwzwIBAAAAAdECAQCNBAAh2AJAAI8EACG7AwEAjgQAIQMAAAAPACABAAASADACAAATACADAAAACwAgAQAADAAwAgAADQAgAQAAAA8AIAEAAAALACASBAAA7gQAIAUAAO8EACAMAADwBAAgEQAA8QQAIBIAAOsEACATAADyBAAgzAIAAOwEADDNAgAAGAAQzgIAAOwEADDPAgEAjQQAIdECAQCNBAAh2AJAAI8EACHtAkAAjwQAIfkCAADtBMcDIqQDAQCNBAAhxQMBAI0EACHHAyAAqAQAIcgDQACdBAAhAQAAABgAIBYNAADjBAAgEAAA6wQAIMwCAADmBAAwzQIAABoAEM4CAADmBAAwzwIBAI0EACHRAgEAjQQAIdMCAQCOBAAh2AJAAI8EACHnAgAA6ASvAyLpAgAA6QSwAyLtAkAAjwQAIZIDAACuBAAgmgMBAI4EACGkAwEAjQQAIaYDAADnBK4DIqsDAQCNBAAhrAMBAI4EACGwAwEAjgQAIbEDAQCOBAAhsgMBAI4EACGzAwAA6gQAIAkNAAD0BgAgEAAA8gYAINMCAAD6BAAgmgMAAPoEACCsAwAA-gQAILADAAD6BAAgsQMAAPoEACCyAwAA-gQAILMDAAD6BAAgFg0AAOMEACAQAADrBAAgzAIAAOYEADDNAgAAGgAQzgIAAOYEADDPAgEAAAAB0QIBAI0EACHTAgEAjgQAIdgCQACPBAAh5wIAAOgErwMi6QIAAOkEsAMi7QJAAI8EACGSAwAArgQAIJoDAQCOBAAhpAMBAI0EACGmAwAA5wSuAyKrAwEAjQQAIawDAQCOBAAhsAMBAI4EACGxAwEAjgQAIbIDAQCOBAAhswMAAOoEACADAAAAGgAgAQAAGwAwAgAAHAAgAQAAABgAIAoOAADlBAAgDwAA4wQAIMwCAADkBAAwzQIAAB8AEM4CAADkBAAwzwIBAI0EACHYAkAAjwQAIaEDAQCOBAAhqQMBAI0EACGqAwEAjQQAIQMOAAD1BgAgDwAA9AYAIKEDAAD6BAAgCg4AAOUEACAPAADjBAAgzAIAAOQEADDNAgAAHwAQzgIAAOQEADDPAgEAAAAB2AJAAI8EACGhAwEAjgQAIakDAQCNBAAhqgMBAI0EACEDAAAAHwAgAQAAIAAwAgAAIQAgAQAAABgAIAEAAAAfACADAAAAHwAgAQAAIAAwAgAAIQAgFQ8AAOMEACDMAgAA4QQAMM0CAAAmABDOAgAA4QQAMM8CAQCNBAAh2AJAAI8EACHkAgEAjQQAIecCAADiBJ4DIu0CQACPBAAh_gIBAI0EACGQAwEAjQQAIZEDAQCNBAAhkgMAAK4EACCVAwEAjgQAIZwDAQCNBAAhngMCAKkEACGfAwEAjgQAIaADAQCOBAAhoQMBAI4EACGiA0AAnQQAIaMDQACdBAAhBw8AAPQGACCVAwAA-gQAIJ8DAAD6BAAgoAMAAPoEACChAwAA-gQAIKIDAAD6BAAgowMAAPoEACAVDwAA4wQAIMwCAADhBAAwzQIAACYAEM4CAADhBAAwzwIBAAAAAdgCQACPBAAh5AIBAI0EACHnAgAA4gSeAyLtAkAAjwQAIf4CAQAAAAGQAwEAjQQAIZEDAQCNBAAhkgMAAK4EACCVAwEAjgQAIZwDAQCNBAAhngMCAKkEACGfAwEAjgQAIaADAQCOBAAhoQMBAI4EACGiA0AAnQQAIaMDQACdBAAhAwAAACYAIAEAACcAMAIAACgAIAEAAAAYACABAAAAAwAgAQAAAAcAIAEAAAALACABAAAAGgAgAQAAAB8AIAEAAAAmACABAAAAAQAgBwQAAO4GACAFAADvBgAgDAAA8AYAIBEAAPEGACASAADyBgAgEwAA8wYAIMgDAAD6BAAgAwAAABgAIAEAADIAMAIAAAEAIAMAAAAYACABAAAyADACAAABACADAAAAGAAgAQAAMgAwAgAAAQAgDwQAAOgGACAFAADpBgAgDAAA6gYAIBEAAOsGACASAADsBgAgEwAA7QYAIM8CAQAAAAHRAgEAAAAB2AJAAAAAAe0CQAAAAAH5AgAAAMcDAqQDAQAAAAHFAwEAAAABxwMgAAAAAcgDQAAAAAEBGQAANgAgCc8CAQAAAAHRAgEAAAAB2AJAAAAAAe0CQAAAAAH5AgAAAMcDAqQDAQAAAAHFAwEAAAABxwMgAAAAAcgDQAAAAAEBGQAAOAAwARkAADgAMA8EAACgBgAgBQAAoQYAIAwAAKIGACARAACjBgAgEgAApAYAIBMAAKUGACDPAgEA_gQAIdECAQD-BAAh2AJAAIAFACHtAkAAgAUAIfkCAACfBscDIqQDAQD-BAAhxQMBAP4EACHHAyAAjAUAIcgDQACGBQAhAgAAAAEAIBkAADsAIAnPAgEA_gQAIdECAQD-BAAh2AJAAIAFACHtAkAAgAUAIfkCAACfBscDIqQDAQD-BAAhxQMBAP4EACHHAyAAjAUAIcgDQACGBQAhAgAAABgAIBkAAD0AIAIAAAAYACAZAAA9ACADAAAAAQAgIAAANgAgIQAAOwAgAQAAAAEAIAEAAAAYACAECQAAnAYAICYAAJ4GACAnAACdBgAgyAMAAPoEACAMzAIAAN0EADDNAgAARAAQzgIAAN0EADDPAgEAgQQAIdECAQCBBAAh2AJAAIMEACHtAkAAgwQAIfkCAADeBMcDIqQDAQCBBAAhxQMBAIEEACHHAyAAnwQAIcgDQACTBAAhAwAAABgAIAEAAEMAMCUAAEQAIAMAAAAYACABAAAyADACAAABACABAAAABQAgAQAAAAUAIAMAAAADACABAAAEADACAAAFACADAAAAAwAgAQAABAAwAgAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAsDAACbBgAgzwIBAAAAAdgCQAAAAAGxAwEAAAABsgMBAAAAAb4DAQAAAAG_AwEAAAABwANAAAAAAcIDAQAAAAHDA0AAAAABxAMBAAAAAQEZAABMACAKzwIBAAAAAdgCQAAAAAGxAwEAAAABsgMBAAAAAb4DAQAAAAG_AwEAAAABwANAAAAAAcIDAQAAAAHDA0AAAAABxAMBAAAAAQEZAABOADABGQAATgAwCwMAAJoGACDPAgEA_gQAIdgCQACABQAhsQMBAP8EACGyAwEA_wQAIb4DAQD-BAAhvwMBAP4EACHAA0AAgAUAIcIDAQD-BAAhwwNAAIYFACHEAwEA_wQAIQIAAAAFACAZAABRACAKzwIBAP4EACHYAkAAgAUAIbEDAQD_BAAhsgMBAP8EACG-AwEA_gQAIb8DAQD-BAAhwANAAIAFACHCAwEA_gQAIcMDQACGBQAhxAMBAP8EACECAAAAAwAgGQAAUwAgAgAAAAMAIBkAAFMAIAMAAAAFACAgAABMACAhAABRACABAAAABQAgAQAAAAMAIAcJAACXBgAgJgAAmQYAICcAAJgGACCxAwAA-gQAILIDAAD6BAAgwwMAAPoEACDEAwAA-gQAIA3MAgAA3AQAMM0CAABaABDOAgAA3AQAMM8CAQCBBAAh2AJAAIMEACGxAwEAggQAIbIDAQCCBAAhvgMBAIEEACG_AwEAgQQAIcADQACDBAAhwgMBAIEEACHDA0AAkwQAIcQDAQCCBAAhAwAAAAMAIAEAAFkAMCUAAFoAIAMAAAADACABAAAEADACAAAFACABAAAACQAgAQAAAAkAIAMAAAAHACABAAAIADACAAAJACADAAAABwAgAQAACAAwAgAACQAgAwAAAAcAIAEAAAgAMAIAAAkAIAcDAACWBgAgzwIBAAAAAdgCQAAAAAG-AwEAAAABvwMBAAAAAcADQAAAAAHBA0AAAAABARkAAGIAIAbPAgEAAAAB2AJAAAAAAb4DAQAAAAG_AwEAAAABwANAAAAAAcEDQAAAAAEBGQAAZAAwARkAAGQAMAcDAACVBgAgzwIBAP4EACHYAkAAgAUAIb4DAQD-BAAhvwMBAP4EACHAA0AAgAUAIcEDQACGBQAhAgAAAAkAIBkAAGcAIAbPAgEA_gQAIdgCQACABQAhvgMBAP4EACG_AwEA_gQAIcADQACABQAhwQNAAIYFACECAAAABwAgGQAAaQAgAgAAAAcAIBkAAGkAIAMAAAAJACAgAABiACAhAABnACABAAAACQAgAQAAAAcAIAQJAACSBgAgJgAAlAYAICcAAJMGACDBAwAA-gQAIAnMAgAA2wQAMM0CAABwABDOAgAA2wQAMM8CAQCBBAAh2AJAAIMEACG-AwEAgQQAIb8DAQCBBAAhwANAAIMEACHBA0AAkwQAIQMAAAAHACABAABvADAlAABwACADAAAABwAgAQAACAAwAgAACQAgB8wCAADaBAAwzQIAAHYAEM4CAADaBAAwzwIBAAAAAe0CQACPBAAhvAMBAAAAAb0DAACqBAAgAQAAAHMAIAEAAABzACAHzAIAANoEADDNAgAAdgAQzgIAANoEADDPAgEAjQQAIe0CQACPBAAhvAMBAI0EACG9AwAAqgQAIAADAAAAdgAgAQAAdwAwAgAAcwAgAwAAAHYAIAEAAHcAMAIAAHMAIAMAAAB2ACABAAB3ADACAABzACAEzwIBAAAAAe0CQAAAAAG8AwEAAAABvQOAAAAAAQEZAAB7ACAEzwIBAAAAAe0CQAAAAAG8AwEAAAABvQOAAAAAAQEZAAB9ADABGQAAfQAwBM8CAQD-BAAh7QJAAIAFACG8AwEA_gQAIb0DgAAAAAECAAAAcwAgGQAAgAEAIATPAgEA_gQAIe0CQACABQAhvAMBAP4EACG9A4AAAAABAgAAAHYAIBkAAIIBACACAAAAdgAgGQAAggEAIAMAAABzACAgAAB7ACAhAACAAQAgAQAAAHMAIAEAAAB2ACADCQAAjwYAICYAAJEGACAnAACQBgAgB8wCAADZBAAwzQIAAIkBABDOAgAA2QQAMM8CAQCBBAAh7QJAAIMEACG8AwEAgQQAIb0DAAChBAAgAwAAAHYAIAEAAIgBADAlAACJAQAgAwAAAHYAIAEAAHcAMAIAAHMAIAEAAAATACABAAAAEwAgAwAAAA8AIAEAABIAMAIAABMAIAMAAAAPACABAAASADACAAATACADAAAADwAgAQAAEgAwAgAAEwAgBwYAAI4GACAHAACMBgAgCAAAjQYAIM8CAQAAAAHRAgEAAAAB2AJAAAAAAbsDAQAAAAEBGQAAkQEAIATPAgEAAAAB0QIBAAAAAdgCQAAAAAG7AwEAAAABARkAAJMBADABGQAAkwEAMAEAAAAPACAHBgAA8QUAIAcAAPIFACAIAADzBQAgzwIBAP4EACHRAgEA_gQAIdgCQACABQAhuwMBAP8EACECAAAAEwAgGQAAlwEAIATPAgEA_gQAIdECAQD-BAAh2AJAAIAFACG7AwEA_wQAIQIAAAAPACAZAACZAQAgAgAAAA8AIBkAAJkBACABAAAADwAgAwAAABMAICAAAJEBACAhAACXAQAgAQAAABMAIAEAAAAPACAECQAA7gUAICYAAPAFACAnAADvBQAguwMAAPoEACAHzAIAANgEADDNAgAAoQEAEM4CAADYBAAwzwIBAIEEACHRAgEAgQQAIdgCQACDBAAhuwMBAIIEACEDAAAADwAgAQAAoAEAMCUAAKEBACADAAAADwAgAQAAEgAwAgAAEwAgAQAAAA0AIAEAAAANACADAAAACwAgAQAADAAwAgAADQAgAwAAAAsAIAEAAAwAMAIAAA0AIAMAAAALACABAAAMADACAAANACANCgAA7AUAIAsAAO0FACDPAgEAAAAB2AJAAAAAAe4CAQAAAAGLAwEAAAABtAMBAAAAAbUDAgAAAAG2AwIAAAABtwMCAAAAAbgDAQAAAAG5AwEAAAABugMBAAAAAQEZAACpAQAgC88CAQAAAAHYAkAAAAAB7gIBAAAAAYsDAQAAAAG0AwEAAAABtQMCAAAAAbYDAgAAAAG3AwIAAAABuAMBAAAAAbkDAQAAAAG6AwEAAAABARkAAKsBADABGQAAqwEAMAEAAAAPACABAAAAGAAgDQoAAOoFACALAADrBQAgzwIBAP4EACHYAkAAgAUAIe4CAQD-BAAhiwMBAP4EACG0AwEA_gQAIbUDAgCNBQAhtgMCALcFACG3AwIAtwUAIbgDAQD_BAAhuQMBAP8EACG6AwEA_wQAIQIAAAANACAZAACwAQAgC88CAQD-BAAh2AJAAIAFACHuAgEA_gQAIYsDAQD-BAAhtAMBAP4EACG1AwIAjQUAIbYDAgC3BQAhtwMCALcFACG4AwEA_wQAIbkDAQD_BAAhugMBAP8EACECAAAACwAgGQAAsgEAIAIAAAALACAZAACyAQAgAQAAAA8AIAEAAAAYACADAAAADQAgIAAAqQEAICEAALABACABAAAADQAgAQAAAAsAIAoJAADlBQAgJgAA6AUAICcAAOcFACB4AADmBQAgeQAA6QUAILYDAAD6BAAgtwMAAPoEACC4AwAA-gQAILkDAAD6BAAgugMAAPoEACAOzAIAANcEADDNAgAAuwEAEM4CAADXBAAwzwIBAIEEACHYAkAAgwQAIe4CAQCBBAAhiwMBAIEEACG0AwEAgQQAIbUDAgCgBAAhtgMCALsEACG3AwIAuwQAIbgDAQCCBAAhuQMBAIIEACG6AwEAggQAIQMAAAALACABAAC6AQAwJQAAuwEAIAMAAAALACABAAAMADACAAANACABAAAAHAAgAQAAABwAIAMAAAAaACABAAAbADACAAAcACADAAAAGgAgAQAAGwAwAgAAHAAgAwAAABoAIAEAABsAMAIAABwAIBMNAADjBQAgEAAA5AUAIM8CAQAAAAHRAgEAAAAB0wIBAAAAAdgCQAAAAAHnAgAAAK8DAukCAAAAsAMC7QJAAAAAAZIDAADiBQAgmgMBAAAAAaQDAQAAAAGmAwAAAK4DAqsDAQAAAAGsAwEAAAABsAMBAAAAAbEDAQAAAAGyAwEAAAABswOAAAAAAQEZAADDAQAgEc8CAQAAAAHRAgEAAAAB0wIBAAAAAdgCQAAAAAHnAgAAAK8DAukCAAAAsAMC7QJAAAAAAZIDAADiBQAgmgMBAAAAAaQDAQAAAAGmAwAAAK4DAqsDAQAAAAGsAwEAAAABsAMBAAAAAbEDAQAAAAGyAwEAAAABswOAAAAAAQEZAADFAQAwARkAAMUBADABAAAAGAAgEw0AANQFACAQAADVBQAgzwIBAP4EACHRAgEA_gQAIdMCAQD_BAAh2AJAAIAFACHnAgAA0QWvAyLpAgAA0gWwAyLtAkAAgAUAIZIDAADTBQAgmgMBAP8EACGkAwEA_gQAIaYDAADQBa4DIqsDAQD-BAAhrAMBAP8EACGwAwEA_wQAIbEDAQD_BAAhsgMBAP8EACGzA4AAAAABAgAAABwAIBkAAMkBACARzwIBAP4EACHRAgEA_gQAIdMCAQD_BAAh2AJAAIAFACHnAgAA0QWvAyLpAgAA0gWwAyLtAkAAgAUAIZIDAADTBQAgmgMBAP8EACGkAwEA_gQAIaYDAADQBa4DIqsDAQD-BAAhrAMBAP8EACGwAwEA_wQAIbEDAQD_BAAhsgMBAP8EACGzA4AAAAABAgAAABoAIBkAAMsBACACAAAAGgAgGQAAywEAIAEAAAAYACADAAAAHAAgIAAAwwEAICEAAMkBACABAAAAHAAgAQAAABoAIAoJAADNBQAgJgAAzwUAICcAAM4FACDTAgAA-gQAIJoDAAD6BAAgrAMAAPoEACCwAwAA-gQAILEDAAD6BAAgsgMAAPoEACCzAwAA-gQAIBTMAgAAywQAMM0CAADTAQAQzgIAAMsEADDPAgEAgQQAIdECAQCBBAAh0wIBAIIEACHYAkAAgwQAIecCAADNBK8DIukCAADOBLADIu0CQACDBAAhkgMAAK4EACCaAwEAggQAIaQDAQCBBAAhpgMAAMwErgMiqwMBAIEEACGsAwEAggQAIbADAQCCBAAhsQMBAIIEACGyAwEAggQAIbMDAADPBAAgAwAAABoAIAEAANIBADAlAADTAQAgAwAAABoAIAEAABsAMAIAABwAIAEAAAAhACABAAAAIQAgAwAAAB8AIAEAACAAMAIAACEAIAMAAAAfACABAAAgADACAAAhACADAAAAHwAgAQAAIAAwAgAAIQAgBw4AAMsFACAPAADMBQAgzwIBAAAAAdgCQAAAAAGhAwEAAAABqQMBAAAAAaoDAQAAAAEBGQAA2wEAIAXPAgEAAAAB2AJAAAAAAaEDAQAAAAGpAwEAAAABqgMBAAAAAQEZAADdAQAwARkAAN0BADABAAAAGAAgBw4AAMkFACAPAADKBQAgzwIBAP4EACHYAkAAgAUAIaEDAQD_BAAhqQMBAP4EACGqAwEA_gQAIQIAAAAhACAZAADhAQAgBc8CAQD-BAAh2AJAAIAFACGhAwEA_wQAIakDAQD-BAAhqgMBAP4EACECAAAAHwAgGQAA4wEAIAIAAAAfACAZAADjAQAgAQAAABgAIAMAAAAhACAgAADbAQAgIQAA4QEAIAEAAAAhACABAAAAHwAgBAkAAMYFACAmAADIBQAgJwAAxwUAIKEDAAD6BAAgCMwCAADKBAAwzQIAAOsBABDOAgAAygQAMM8CAQCBBAAh2AJAAIMEACGhAwEAggQAIakDAQCBBAAhqgMBAIEEACEDAAAAHwAgAQAA6gEAMCUAAOsBACADAAAAHwAgAQAAIAAwAgAAIQAgC8wCAADIBAAwzQIAAPEBABDOAgAAyAQAMM8CAQAAAAHYAkAAjwQAIecCAADJBKYDIu0CQACPBAAhpAMBAAAAAaYDAQCOBAAhpwMBAAAAAagDQACdBAAhAQAAAO4BACABAAAA7gEAIAvMAgAAyAQAMM0CAADxAQAQzgIAAMgEADDPAgEAjQQAIdgCQACPBAAh5wIAAMkEpgMi7QJAAI8EACGkAwEAjQQAIaYDAQCOBAAhpwMBAI0EACGoA0AAnQQAIQKmAwAA-gQAIKgDAAD6BAAgAwAAAPEBACABAADyAQAwAgAA7gEAIAMAAADxAQAgAQAA8gEAMAIAAO4BACADAAAA8QEAIAEAAPIBADACAADuAQAgCM8CAQAAAAHYAkAAAAAB5wIAAACmAwLtAkAAAAABpAMBAAAAAaYDAQAAAAGnAwEAAAABqANAAAAAAQEZAAD2AQAgCM8CAQAAAAHYAkAAAAAB5wIAAACmAwLtAkAAAAABpAMBAAAAAaYDAQAAAAGnAwEAAAABqANAAAAAAQEZAAD4AQAwARkAAPgBADAIzwIBAP4EACHYAkAAgAUAIecCAADFBaYDIu0CQACABQAhpAMBAP4EACGmAwEA_wQAIacDAQD-BAAhqANAAIYFACECAAAA7gEAIBkAAPsBACAIzwIBAP4EACHYAkAAgAUAIecCAADFBaYDIu0CQACABQAhpAMBAP4EACGmAwEA_wQAIacDAQD-BAAhqANAAIYFACECAAAA8QEAIBkAAP0BACACAAAA8QEAIBkAAP0BACADAAAA7gEAICAAAPYBACAhAAD7AQAgAQAAAO4BACABAAAA8QEAIAUJAADCBQAgJgAAxAUAICcAAMMFACCmAwAA-gQAIKgDAAD6BAAgC8wCAADEBAAwzQIAAIQCABDOAgAAxAQAMM8CAQCBBAAh2AJAAIMEACHnAgAAxQSmAyLtAkAAgwQAIaQDAQCBBAAhpgMBAIIEACGnAwEAgQQAIagDQACTBAAhAwAAAPEBACABAACDAgAwJQAAhAIAIAMAAADxAQAgAQAA8gEAMAIAAO4BACABAAAAKAAgAQAAACgAIAMAAAAmACABAAAnADACAAAoACADAAAAJgAgAQAAJwAwAgAAKAAgAwAAACYAIAEAACcAMAIAACgAIBIPAADBBQAgzwIBAAAAAdgCQAAAAAHkAgEAAAAB5wIAAACeAwLtAkAAAAAB_gIBAAAAAZADAQAAAAGRAwEAAAABkgMAAMAFACCVAwEAAAABnAMBAAAAAZ4DAgAAAAGfAwEAAAABoAMBAAAAAaEDAQAAAAGiA0AAAAABowNAAAAAAQEZAACMAgAgEc8CAQAAAAHYAkAAAAAB5AIBAAAAAecCAAAAngMC7QJAAAAAAf4CAQAAAAGQAwEAAAABkQMBAAAAAZIDAADABQAglQMBAAAAAZwDAQAAAAGeAwIAAAABnwMBAAAAAaADAQAAAAGhAwEAAAABogNAAAAAAaMDQAAAAAEBGQAAjgIAMAEZAACOAgAwAQAAABgAIBIPAAC_BQAgzwIBAP4EACHYAkAAgAUAIeQCAQD-BAAh5wIAAL4FngMi7QJAAIAFACH-AgEA_gQAIZADAQD-BAAhkQMBAP4EACGSAwAAvQUAIJUDAQD_BAAhnAMBAP4EACGeAwIAjQUAIZ8DAQD_BAAhoAMBAP8EACGhAwEA_wQAIaIDQACGBQAhowNAAIYFACECAAAAKAAgGQAAkgIAIBHPAgEA_gQAIdgCQACABQAh5AIBAP4EACHnAgAAvgWeAyLtAkAAgAUAIf4CAQD-BAAhkAMBAP4EACGRAwEA_gQAIZIDAAC9BQAglQMBAP8EACGcAwEA_gQAIZ4DAgCNBQAhnwMBAP8EACGgAwEA_wQAIaEDAQD_BAAhogNAAIYFACGjA0AAhgUAIQIAAAAmACAZAACUAgAgAgAAACYAIBkAAJQCACABAAAAGAAgAwAAACgAICAAAIwCACAhAACSAgAgAQAAACgAIAEAAAAmACALCQAAuAUAICYAALsFACAnAAC6BQAgeAAAuQUAIHkAALwFACCVAwAA-gQAIJ8DAAD6BAAgoAMAAPoEACChAwAA-gQAIKIDAAD6BAAgowMAAPoEACAUzAIAAMAEADDNAgAAnAIAEM4CAADABAAwzwIBAIEEACHYAkAAgwQAIeQCAQCBBAAh5wIAAMEEngMi7QJAAIMEACH-AgEAgQQAIZADAQCBBAAhkQMBAIEEACGSAwAArgQAIJUDAQCCBAAhnAMBAIEEACGeAwIAoAQAIZ8DAQCCBAAhoAMBAIIEACGhAwEAggQAIaIDQACTBAAhowNAAJMEACEDAAAAJgAgAQAAmwIAMCUAAJwCACADAAAAJgAgAQAAJwAwAgAAKAAgDw8BAI0EACHMAgAAvgQAMM0CAACiAgAQzgIAAL4EADDPAgEAAAAB2AJAAI8EACHtAkAAjwQAIfECAgCpBAAh-QIBAI0EACH7AgEAjgQAIf0CIACoBAAhhQMgAKgEACGZAwEAjQQAIZoDAQCNBAAhmwMCAL8EACEBAAAAnwIAIAEAAACfAgAgDw8BAI0EACHMAgAAvgQAMM0CAACiAgAQzgIAAL4EADDPAgEAjQQAIdgCQACPBAAh7QJAAI8EACHxAgIAqQQAIfkCAQCNBAAh-wIBAI4EACH9AiAAqAQAIYUDIACoBAAhmQMBAI0EACGaAwEAjQQAIZsDAgC_BAAhAvsCAAD6BAAgmwMAAPoEACADAAAAogIAIAEAAKMCADACAACfAgAgAwAAAKICACABAACjAgAwAgAAnwIAIAMAAACiAgAgAQAAowIAMAIAAJ8CACAMDwEAAAABzwIBAAAAAdgCQAAAAAHtAkAAAAAB8QICAAAAAfkCAQAAAAH7AgEAAAAB_QIgAAAAAYUDIAAAAAGZAwEAAAABmgMBAAAAAZsDAgAAAAEBGQAApwIAIAwPAQAAAAHPAgEAAAAB2AJAAAAAAe0CQAAAAAHxAgIAAAAB-QIBAAAAAfsCAQAAAAH9AiAAAAABhQMgAAAAAZkDAQAAAAGaAwEAAAABmwMCAAAAAQEZAACpAgAwARkAAKkCADAMDwEA_gQAIc8CAQD-BAAh2AJAAIAFACHtAkAAgAUAIfECAgCNBQAh-QIBAP4EACH7AgEA_wQAIf0CIACMBQAhhQMgAIwFACGZAwEA_gQAIZoDAQD-BAAhmwMCALcFACECAAAAnwIAIBkAAKwCACAMDwEA_gQAIc8CAQD-BAAh2AJAAIAFACHtAkAAgAUAIfECAgCNBQAh-QIBAP4EACH7AgEA_wQAIf0CIACMBQAhhQMgAIwFACGZAwEA_gQAIZoDAQD-BAAhmwMCALcFACECAAAAogIAIBkAAK4CACACAAAAogIAIBkAAK4CACADAAAAnwIAICAAAKcCACAhAACsAgAgAQAAAJ8CACABAAAAogIAIAcJAACyBQAgJgAAtQUAICcAALQFACB4AACzBQAgeQAAtgUAIPsCAAD6BAAgmwMAAPoEACAPDwEAgQQAIcwCAAC6BAAwzQIAALUCABDOAgAAugQAMM8CAQCBBAAh2AJAAIMEACHtAkAAgwQAIfECAgCgBAAh-QIBAIEEACH7AgEAggQAIf0CIACfBAAhhQMgAJ8EACGZAwEAgQQAIZoDAQCBBAAhmwMCALsEACEDAAAAogIAIAEAALQCADAlAAC1AgAgAwAAAKICACABAACjAgAwAgAAnwIAIAvMAgAAuQQAMM0CAAC7AgAQzgIAALkEADDPAgEAAAAB2AJAAI8EACHtAkAAjwQAIfECAgCpBAAh_QIgAKgEACGRAwEAjgQAIZcDAQCNBAAhmAMBAI0EACEBAAAAuAIAIAEAAAC4AgAgC8wCAAC5BAAwzQIAALsCABDOAgAAuQQAMM8CAQCNBAAh2AJAAI8EACHtAkAAjwQAIfECAgCpBAAh_QIgAKgEACGRAwEAjgQAIZcDAQCNBAAhmAMBAI0EACEBkQMAAPoEACADAAAAuwIAIAEAALwCADACAAC4AgAgAwAAALsCACABAAC8AgAwAgAAuAIAIAMAAAC7AgAgAQAAvAIAMAIAALgCACAIzwIBAAAAAdgCQAAAAAHtAkAAAAAB8QICAAAAAf0CIAAAAAGRAwEAAAABlwMBAAAAAZgDAQAAAAEBGQAAwAIAIAjPAgEAAAAB2AJAAAAAAe0CQAAAAAHxAgIAAAAB_QIgAAAAAZEDAQAAAAGXAwEAAAABmAMBAAAAAQEZAADCAgAwARkAAMICADAIzwIBAP4EACHYAkAAgAUAIe0CQACABQAh8QICAI0FACH9AiAAjAUAIZEDAQD_BAAhlwMBAP4EACGYAwEA_gQAIQIAAAC4AgAgGQAAxQIAIAjPAgEA_gQAIdgCQACABQAh7QJAAIAFACHxAgIAjQUAIf0CIACMBQAhkQMBAP8EACGXAwEA_gQAIZgDAQD-BAAhAgAAALsCACAZAADHAgAgAgAAALsCACAZAADHAgAgAwAAALgCACAgAADAAgAgIQAAxQIAIAEAAAC4AgAgAQAAALsCACAGCQAArQUAICYAALAFACAnAACvBQAgeAAArgUAIHkAALEFACCRAwAA-gQAIAvMAgAAuAQAMM0CAADOAgAQzgIAALgEADDPAgEAgQQAIdgCQACDBAAh7QJAAIMEACHxAgIAoAQAIf0CIACfBAAhkQMBAIIEACGXAwEAgQQAIZgDAQCBBAAhAwAAALsCACABAADNAgAwJQAAzgIAIAMAAAC7AgAgAQAAvAIAMAIAALgCACAWzAIAALcEADDNAgAA1AIAEM4CAAC3BAAwzwIBAAAAAdgCQACPBAAh5AIBAI0EACHtAkAAjwQAIfECAgCpBAAh_QIgAKgEACH-AgEAAAABgAMBAI0EACGFAyAAqAQAIYsDAQCOBAAhjgMBAI0EACGPAwEAjQQAIZADAQCOBAAhkQMBAI0EACGSAwAArgQAIJMDAQCNBAAhlAMAAK4EACCVAwEAjgQAIZYDAQCOBAAhAQAAANECACABAAAA0QIAIBbMAgAAtwQAMM0CAADUAgAQzgIAALcEADDPAgEAjQQAIdgCQACPBAAh5AIBAI0EACHtAkAAjwQAIfECAgCpBAAh_QIgAKgEACH-AgEAjQQAIYADAQCNBAAhhQMgAKgEACGLAwEAjgQAIY4DAQCNBAAhjwMBAI0EACGQAwEAjgQAIZEDAQCNBAAhkgMAAK4EACCTAwEAjQQAIZQDAACuBAAglQMBAI4EACGWAwEAjgQAIQSLAwAA-gQAIJADAAD6BAAglQMAAPoEACCWAwAA-gQAIAMAAADUAgAgAQAA1QIAMAIAANECACADAAAA1AIAIAEAANUCADACAADRAgAgAwAAANQCACABAADVAgAwAgAA0QIAIBPPAgEAAAAB2AJAAAAAAeQCAQAAAAHtAkAAAAAB8QICAAAAAf0CIAAAAAH-AgEAAAABgAMBAAAAAYUDIAAAAAGLAwEAAAABjgMBAAAAAY8DAQAAAAGQAwEAAAABkQMBAAAAAZIDAACrBQAgkwMBAAAAAZQDAACsBQAglQMBAAAAAZYDAQAAAAEBGQAA2QIAIBPPAgEAAAAB2AJAAAAAAeQCAQAAAAHtAkAAAAAB8QICAAAAAf0CIAAAAAH-AgEAAAABgAMBAAAAAYUDIAAAAAGLAwEAAAABjgMBAAAAAY8DAQAAAAGQAwEAAAABkQMBAAAAAZIDAACrBQAgkwMBAAAAAZQDAACsBQAglQMBAAAAAZYDAQAAAAEBGQAA2wIAMAEZAADbAgAwE88CAQD-BAAh2AJAAIAFACHkAgEA_gQAIe0CQACABQAh8QICAI0FACH9AiAAjAUAIf4CAQD-BAAhgAMBAP4EACGFAyAAjAUAIYsDAQD_BAAhjgMBAP4EACGPAwEA_gQAIZADAQD_BAAhkQMBAP4EACGSAwAAqQUAIJMDAQD-BAAhlAMAAKoFACCVAwEA_wQAIZYDAQD_BAAhAgAAANECACAZAADeAgAgE88CAQD-BAAh2AJAAIAFACHkAgEA_gQAIe0CQACABQAh8QICAI0FACH9AiAAjAUAIf4CAQD-BAAhgAMBAP4EACGFAyAAjAUAIYsDAQD_BAAhjgMBAP4EACGPAwEA_gQAIZADAQD_BAAhkQMBAP4EACGSAwAAqQUAIJMDAQD-BAAhlAMAAKoFACCVAwEA_wQAIZYDAQD_BAAhAgAAANQCACAZAADgAgAgAgAAANQCACAZAADgAgAgAwAAANECACAgAADZAgAgIQAA3gIAIAEAAADRAgAgAQAAANQCACAJCQAApAUAICYAAKcFACAnAACmBQAgeAAApQUAIHkAAKgFACCLAwAA-gQAIJADAAD6BAAglQMAAPoEACCWAwAA-gQAIBbMAgAAtgQAMM0CAADnAgAQzgIAALYEADDPAgEAgQQAIdgCQACDBAAh5AIBAIEEACHtAkAAgwQAIfECAgCgBAAh_QIgAJ8EACH-AgEAgQQAIYADAQCBBAAhhQMgAJ8EACGLAwEAggQAIY4DAQCBBAAhjwMBAIEEACGQAwEAggQAIZEDAQCBBAAhkgMAAK4EACCTAwEAgQQAIZQDAACuBAAglQMBAIIEACGWAwEAggQAIQMAAADUAgAgAQAA5gIAMCUAAOcCACADAAAA1AIAIAEAANUCADACAADRAgAgFMwCAAC0BAAwzQIAAO0CABDOAgAAtAQAMM8CAQAAAAHRAgEAjQQAIdgCQACPBAAh5QIBAI0EACHnAgAAtQSLAyLtAkAAjwQAIfECAgCpBAAh_QIgAKgEACH-AgEAAAABhQMgAKgEACGJAwEAjQQAIYsDAQCOBAAhjAMBAI0EACGNAwAArgQAII4DAQCNBAAhjwMBAI0EACGQAwEAjgQAIQEAAADqAgAgAQAAAOoCACAUzAIAALQEADDNAgAA7QIAEM4CAAC0BAAwzwIBAI0EACHRAgEAjQQAIdgCQACPBAAh5QIBAI0EACHnAgAAtQSLAyLtAkAAjwQAIfECAgCpBAAh_QIgAKgEACH-AgEAjQQAIYUDIACoBAAhiQMBAI0EACGLAwEAjgQAIYwDAQCNBAAhjQMAAK4EACCOAwEAjQQAIY8DAQCNBAAhkAMBAI4EACECiwMAAPoEACCQAwAA-gQAIAMAAADtAgAgAQAA7gIAMAIAAOoCACADAAAA7QIAIAEAAO4CADACAADqAgAgAwAAAO0CACABAADuAgAwAgAA6gIAIBHPAgEAAAAB0QIBAAAAAdgCQAAAAAHlAgEAAAAB5wIAAACLAwLtAkAAAAAB8QICAAAAAf0CIAAAAAH-AgEAAAABhQMgAAAAAYkDAQAAAAGLAwEAAAABjAMBAAAAAY0DAACjBQAgjgMBAAAAAY8DAQAAAAGQAwEAAAABARkAAPICACARzwIBAAAAAdECAQAAAAHYAkAAAAAB5QIBAAAAAecCAAAAiwMC7QJAAAAAAfECAgAAAAH9AiAAAAAB_gIBAAAAAYUDIAAAAAGJAwEAAAABiwMBAAAAAYwDAQAAAAGNAwAAowUAII4DAQAAAAGPAwEAAAABkAMBAAAAAQEZAAD0AgAwARkAAPQCADARzwIBAP4EACHRAgEA_gQAIdgCQACABQAh5QIBAP4EACHnAgAAoQWLAyLtAkAAgAUAIfECAgCNBQAh_QIgAIwFACH-AgEA_gQAIYUDIACMBQAhiQMBAP4EACGLAwEA_wQAIYwDAQD-BAAhjQMAAKIFACCOAwEA_gQAIY8DAQD-BAAhkAMBAP8EACECAAAA6gIAIBkAAPcCACARzwIBAP4EACHRAgEA_gQAIdgCQACABQAh5QIBAP4EACHnAgAAoQWLAyLtAkAAgAUAIfECAgCNBQAh_QIgAIwFACH-AgEA_gQAIYUDIACMBQAhiQMBAP4EACGLAwEA_wQAIYwDAQD-BAAhjQMAAKIFACCOAwEA_gQAIY8DAQD-BAAhkAMBAP8EACECAAAA7QIAIBkAAPkCACACAAAA7QIAIBkAAPkCACADAAAA6gIAICAAAPICACAhAAD3AgAgAQAAAOoCACABAAAA7QIAIAcJAACcBQAgJgAAnwUAICcAAJ4FACB4AACdBQAgeQAAoAUAIIsDAAD6BAAgkAMAAPoEACAUzAIAALAEADDNAgAAgAMAEM4CAACwBAAwzwIBAIEEACHRAgEAgQQAIdgCQACDBAAh5QIBAIEEACHnAgAAsQSLAyLtAkAAgwQAIfECAgCgBAAh_QIgAJ8EACH-AgEAgQQAIYUDIACfBAAhiQMBAIEEACGLAwEAggQAIYwDAQCBBAAhjQMAAK4EACCOAwEAgQQAIY8DAQCBBAAhkAMBAIIEACEDAAAA7QIAIAEAAP8CADAlAACAAwAgAwAAAO0CACABAADuAgAwAgAA6gIAIBLMAgAArwQAMM0CAACGAwAQzgIAAK8EADDPAgEAAAAB2AJAAI8EACHkAgEAjQQAIeUCAQCNBAAh7QJAAI8EACHxAgIAqQQAIf0CIACoBAAh_gIBAAAAAf8CAQCNBAAhgAMBAI0EACGBAwAArgQAIIIDAACuBAAggwMAAKoEACCEAwAAqgQAIIUDIACoBAAhAQAAAIMDACABAAAAgwMAIBLMAgAArwQAMM0CAACGAwAQzgIAAK8EADDPAgEAjQQAIdgCQACPBAAh5AIBAI0EACHlAgEAjQQAIe0CQACPBAAh8QICAKkEACH9AiAAqAQAIf4CAQCNBAAh_wIBAI0EACGAAwEAjQQAIYEDAACuBAAgggMAAK4EACCDAwAAqgQAIIQDAACqBAAghQMgAKgEACEAAwAAAIYDACABAACHAwAwAgAAgwMAIAMAAACGAwAgAQAAhwMAMAIAAIMDACADAAAAhgMAIAEAAIcDADACAACDAwAgD88CAQAAAAHYAkAAAAAB5AIBAAAAAeUCAQAAAAHtAkAAAAAB8QICAAAAAf0CIAAAAAH-AgEAAAAB_wIBAAAAAYADAQAAAAGBAwAAmgUAIIIDAACbBQAggwOAAAAAAYQDgAAAAAGFAyAAAAABARkAAIsDACAPzwIBAAAAAdgCQAAAAAHkAgEAAAAB5QIBAAAAAe0CQAAAAAHxAgIAAAAB_QIgAAAAAf4CAQAAAAH_AgEAAAABgAMBAAAAAYEDAACaBQAgggMAAJsFACCDA4AAAAABhAOAAAAAAYUDIAAAAAEBGQAAjQMAMAEZAACNAwAwD88CAQD-BAAh2AJAAIAFACHkAgEA_gQAIeUCAQD-BAAh7QJAAIAFACHxAgIAjQUAIf0CIACMBQAh_gIBAP4EACH_AgEA_gQAIYADAQD-BAAhgQMAAJgFACCCAwAAmQUAIIMDgAAAAAGEA4AAAAABhQMgAIwFACECAAAAgwMAIBkAAJADACAPzwIBAP4EACHYAkAAgAUAIeQCAQD-BAAh5QIBAP4EACHtAkAAgAUAIfECAgCNBQAh_QIgAIwFACH-AgEA_gQAIf8CAQD-BAAhgAMBAP4EACGBAwAAmAUAIIIDAACZBQAggwOAAAAAAYQDgAAAAAGFAyAAjAUAIQIAAACGAwAgGQAAkgMAIAIAAACGAwAgGQAAkgMAIAMAAACDAwAgIAAAiwMAICEAAJADACABAAAAgwMAIAEAAACGAwAgBQkAAJMFACAmAACWBQAgJwAAlQUAIHgAAJQFACB5AACXBQAgEswCAACtBAAwzQIAAJkDABDOAgAArQQAMM8CAQCBBAAh2AJAAIMEACHkAgEAgQQAIeUCAQCBBAAh7QJAAIMEACHxAgIAoAQAIf0CIACfBAAh_gIBAIEEACH_AgEAgQQAIYADAQCBBAAhgQMAAK4EACCCAwAArgQAIIMDAAChBAAghAMAAKEEACCFAyAAnwQAIQMAAACGAwAgAQAAmAMAMCUAAJkDACADAAAAhgMAIAEAAIcDADACAACDAwAgDcwCAACsBAAwzQIAAJ8DABDOAgAArAQAMM8CAQAAAAHRAgEAjQQAIdgCQACPBAAh7QJAAI8EACHxAgIAqQQAIfkCAQCNBAAh-gIBAI4EACH7AgEAjgQAIfwCAACqBAAg_QIgAKgEACEBAAAAnAMAIAEAAACcAwAgDcwCAACsBAAwzQIAAJ8DABDOAgAArAQAMM8CAQCNBAAh0QIBAI0EACHYAkAAjwQAIe0CQACPBAAh8QICAKkEACH5AgEAjQQAIfoCAQCOBAAh-wIBAI4EACH8AgAAqgQAIP0CIACoBAAhAvoCAAD6BAAg-wIAAPoEACADAAAAnwMAIAEAAKADADACAACcAwAgAwAAAJ8DACABAACgAwAwAgAAnAMAIAMAAACfAwAgAQAAoAMAMAIAAJwDACAKzwIBAAAAAdECAQAAAAHYAkAAAAAB7QJAAAAAAfECAgAAAAH5AgEAAAAB-gIBAAAAAfsCAQAAAAH8AoAAAAAB_QIgAAAAAQEZAACkAwAgCs8CAQAAAAHRAgEAAAAB2AJAAAAAAe0CQAAAAAHxAgIAAAAB-QIBAAAAAfoCAQAAAAH7AgEAAAAB_AKAAAAAAf0CIAAAAAEBGQAApgMAMAEZAACmAwAwCs8CAQD-BAAh0QIBAP4EACHYAkAAgAUAIe0CQACABQAh8QICAI0FACH5AgEA_gQAIfoCAQD_BAAh-wIBAP8EACH8AoAAAAAB_QIgAIwFACECAAAAnAMAIBkAAKkDACAKzwIBAP4EACHRAgEA_gQAIdgCQACABQAh7QJAAIAFACHxAgIAjQUAIfkCAQD-BAAh-gIBAP8EACH7AgEA_wQAIfwCgAAAAAH9AiAAjAUAIQIAAACfAwAgGQAAqwMAIAIAAACfAwAgGQAAqwMAIAMAAACcAwAgIAAApAMAICEAAKkDACABAAAAnAMAIAEAAACfAwAgBwkAAI4FACAmAACRBQAgJwAAkAUAIHgAAI8FACB5AACSBQAg-gIAAPoEACD7AgAA-gQAIA3MAgAAqwQAMM0CAACyAwAQzgIAAKsEADDPAgEAgQQAIdECAQCBBAAh2AJAAIMEACHtAkAAgwQAIfECAgCgBAAh-QIBAIEEACH6AgEAggQAIfsCAQCCBAAh_AIAAKEEACD9AiAAnwQAIQMAAACfAwAgAQAAsQMAMCUAALIDACADAAAAnwMAIAEAAKADADACAACcAwAgDMwCAACnBAAwzQIAALgDABDOAgAApwQAMM8CAQAAAAHYAkAAjwQAIeQCAQCOBAAh7QJAAI8EACHuAgEAAAAB7wIBAI4EACHwAiAAqAQAIfECAgCpBAAh8gIAAKoEACABAAAAtQMAIAEAAAC1AwAgDMwCAACnBAAwzQIAALgDABDOAgAApwQAMM8CAQCNBAAh2AJAAI8EACHkAgEAjgQAIe0CQACPBAAh7gIBAI0EACHvAgEAjgQAIfACIACoBAAh8QICAKkEACHyAgAAqgQAIALkAgAA-gQAIO8CAAD6BAAgAwAAALgDACABAAC5AwAwAgAAtQMAIAMAAAC4AwAgAQAAuQMAMAIAALUDACADAAAAuAMAIAEAALkDADACAAC1AwAgCc8CAQAAAAHYAkAAAAAB5AIBAAAAAe0CQAAAAAHuAgEAAAAB7wIBAAAAAfACIAAAAAHxAgIAAAAB8gKAAAAAAQEZAAC9AwAgCc8CAQAAAAHYAkAAAAAB5AIBAAAAAe0CQAAAAAHuAgEAAAAB7wIBAAAAAfACIAAAAAHxAgIAAAAB8gKAAAAAAQEZAAC_AwAwARkAAL8DADAJzwIBAP4EACHYAkAAgAUAIeQCAQD_BAAh7QJAAIAFACHuAgEA_gQAIe8CAQD_BAAh8AIgAIwFACHxAgIAjQUAIfICgAAAAAECAAAAtQMAIBkAAMIDACAJzwIBAP4EACHYAkAAgAUAIeQCAQD_BAAh7QJAAIAFACHuAgEA_gQAIe8CAQD_BAAh8AIgAIwFACHxAgIAjQUAIfICgAAAAAECAAAAuAMAIBkAAMQDACACAAAAuAMAIBkAAMQDACADAAAAtQMAICAAAL0DACAhAADCAwAgAQAAALUDACABAAAAuAMAIAcJAACHBQAgJgAAigUAICcAAIkFACB4AACIBQAgeQAAiwUAIOQCAAD6BAAg7wIAAPoEACAMzAIAAJ4EADDNAgAAywMAEM4CAACeBAAwzwIBAIEEACHYAkAAgwQAIeQCAQCCBAAh7QJAAIMEACHuAgEAgQQAIe8CAQCCBAAh8AIgAJ8EACHxAgIAoAQAIfICAAChBAAgAwAAALgDACABAADKAwAwJQAAywMAIAMAAAC4AwAgAQAAuQMAMAIAALUDACANzAIAAJoEADDNAgAA0QMAEM4CAACaBAAwzwIBAAAAAdgCQACPBAAh5AIBAI0EACHlAgEAjgQAIecCAACbBOcCIukCAACcBOkCIuoCQACdBAAh6wJAAJ0EACHsAkAAnQQAIe0CQACPBAAhAQAAAM4DACABAAAAzgMAIA3MAgAAmgQAMM0CAADRAwAQzgIAAJoEADDPAgEAjQQAIdgCQACPBAAh5AIBAI0EACHlAgEAjgQAIecCAACbBOcCIukCAACcBOkCIuoCQACdBAAh6wJAAJ0EACHsAkAAnQQAIe0CQACPBAAhBOUCAAD6BAAg6gIAAPoEACDrAgAA-gQAIOwCAAD6BAAgAwAAANEDACABAADSAwAwAgAAzgMAIAMAAADRAwAgAQAA0gMAMAIAAM4DACADAAAA0QMAIAEAANIDADACAADOAwAgCs8CAQAAAAHYAkAAAAAB5AIBAAAAAeUCAQAAAAHnAgAAAOcCAukCAAAA6QIC6gJAAAAAAesCQAAAAAHsAkAAAAAB7QJAAAAAAQEZAADWAwAgCs8CAQAAAAHYAkAAAAAB5AIBAAAAAeUCAQAAAAHnAgAAAOcCAukCAAAA6QIC6gJAAAAAAesCQAAAAAHsAkAAAAAB7QJAAAAAAQEZAADYAwAwARkAANgDADAKzwIBAP4EACHYAkAAgAUAIeQCAQD-BAAh5QIBAP8EACHnAgAAhAXnAiLpAgAAhQXpAiLqAkAAhgUAIesCQACGBQAh7AJAAIYFACHtAkAAgAUAIQIAAADOAwAgGQAA2wMAIArPAgEA_gQAIdgCQACABQAh5AIBAP4EACHlAgEA_wQAIecCAACEBecCIukCAACFBekCIuoCQACGBQAh6wJAAIYFACHsAkAAhgUAIe0CQACABQAhAgAAANEDACAZAADdAwAgAgAAANEDACAZAADdAwAgAwAAAM4DACAgAADWAwAgIQAA2wMAIAEAAADOAwAgAQAAANEDACAHCQAAgQUAICYAAIMFACAnAACCBQAg5QIAAPoEACDqAgAA-gQAIOsCAAD6BAAg7AIAAPoEACANzAIAAJAEADDNAgAA5AMAEM4CAACQBAAwzwIBAIEEACHYAkAAgwQAIeQCAQCBBAAh5QIBAIIEACHnAgAAkQTnAiLpAgAAkgTpAiLqAkAAkwQAIesCQACTBAAh7AJAAJMEACHtAkAAgwQAIQMAAADRAwAgAQAA4wMAMCUAAOQDACADAAAA0QMAIAEAANIDADACAADOAwAgDcwCAACMBAAwzQIAAOoDABDOAgAAjAQAMM8CAQAAAAHQAgEAjQQAIdECAQCOBAAh0gIBAI0EACHTAgEAjgQAIdQCAQCOBAAh1QIBAI4EACHWAgEAjgQAIdcCAQCOBAAh2AJAAI8EACEBAAAA5wMAIAEAAADnAwAgDcwCAACMBAAwzQIAAOoDABDOAgAAjAQAMM8CAQCNBAAh0AIBAI0EACHRAgEAjgQAIdICAQCNBAAh0wIBAI4EACHUAgEAjgQAIdUCAQCOBAAh1gIBAI4EACHXAgEAjgQAIdgCQACPBAAhBtECAAD6BAAg0wIAAPoEACDUAgAA-gQAINUCAAD6BAAg1gIAAPoEACDXAgAA-gQAIAMAAADqAwAgAQAA6wMAMAIAAOcDACADAAAA6gMAIAEAAOsDADACAADnAwAgAwAAAOoDACABAADrAwAwAgAA5wMAIArPAgEAAAAB0AIBAAAAAdECAQAAAAHSAgEAAAAB0wIBAAAAAdQCAQAAAAHVAgEAAAAB1gIBAAAAAdcCAQAAAAHYAkAAAAABARkAAO8DACAKzwIBAAAAAdACAQAAAAHRAgEAAAAB0gIBAAAAAdMCAQAAAAHUAgEAAAAB1QIBAAAAAdYCAQAAAAHXAgEAAAAB2AJAAAAAAQEZAADxAwAwARkAAPEDADAKzwIBAP4EACHQAgEA_gQAIdECAQD_BAAh0gIBAP4EACHTAgEA_wQAIdQCAQD_BAAh1QIBAP8EACHWAgEA_wQAIdcCAQD_BAAh2AJAAIAFACECAAAA5wMAIBkAAPQDACAKzwIBAP4EACHQAgEA_gQAIdECAQD_BAAh0gIBAP4EACHTAgEA_wQAIdQCAQD_BAAh1QIBAP8EACHWAgEA_wQAIdcCAQD_BAAh2AJAAIAFACECAAAA6gMAIBkAAPYDACACAAAA6gMAIBkAAPYDACADAAAA5wMAICAAAO8DACAhAAD0AwAgAQAAAOcDACABAAAA6gMAIAkJAAD7BAAgJgAA_QQAICcAAPwEACDRAgAA-gQAINMCAAD6BAAg1AIAAPoEACDVAgAA-gQAINYCAAD6BAAg1wIAAPoEACANzAIAAIAEADDNAgAA_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_gIBAIEEACH_AgEAgQQAIYADAQCBBAAhgQMAAK4EACCCAwAArgQAIIMDAAChBAAghAMAAKEEACCFAyAAnwQAIQTZAgEAAAAFhgMBAAAAAYcDAQAAAASIAwEAAAAEEswCAACvBAAwzQIAAIYDABDOAgAArwQAMM8CAQCNBAAh2AJAAI8EACHkAgEAjQQAIeUCAQCNBAAh7QJAAI8EACHxAgIAqQQAIf0CIACoBAAh_gIBAI0EACH_AgEAjQQAIYADAQCNBAAhgQMAAK4EACCCAwAArgQAIIMDAACqBAAghAMAAKoEACCFAyAAqAQAIRTMAgAAsAQAMM0CAACAAwAQzgIAALAEADDPAgEAgQQAIdECAQCBBAAh2AJAAIMEACHlAgEAgQQAIecCAACxBIsDIu0CQACDBAAh8QICAKAEACH9AiAAnwQAIf4CAQCBBAAhhQMgAJ8EACGJAwEAgQQAIYsDAQCCBAAhjAMBAIEEACGNAwAArgQAII4DAQCBBAAhjwMBAIEEACGQAwEAggQAIQcJAACFBAAgJgAAswQAICcAALMEACDZAgAAAIsDAtoCAAAAiwMI2wIAAACLAwjgAgAAsgSLAyIHCQAAhQQAICYAALMEACAnAACzBAAg2QIAAACLAwLaAgAAAIsDCNsCAAAAiwMI4AIAALIEiwMiBNkCAAAAiwMC2gIAAACLAwjbAgAAAIsDCOACAACzBIsDIhTMAgAAtAQAMM0CAADtAgAQzgIAALQEADDPAgEAjQQAIdECAQCNBAAh2AJAAI8EACHlAgEAjQQAIecCAAC1BIsDIu0CQACPBAAh8QICAKkEACH9AiAAqAQAIf4CAQCNBAAhhQMgAKgEACGJAwEAjQQAIYsDAQCOBAAhjAMBAI0EACGNAwAArgQAII4DAQCNBAAhjwMBAI0EACGQAwEAjgQAIQTZAgAAAIsDAtoCAAAAiwMI2wIAAACLAwjgAgAAswSLAyIWzAIAALYEADDNAgAA5wIAEM4CAAC2BAAwzwIBAIEEACHYAkAAgwQAIeQCAQCBBAAh7QJAAIMEACHxAgIAoAQAIf0CIACfBAAh_gIBAIEEACGAAwEAgQQAIYUDIACfBAAhiwMBAIIEACGOAwEAgQQAIY8DAQCBBAAhkAMBAIIEACGRAwEAgQQAIZIDAACuBAAgkwMBAIEEACGUAwAArgQAIJUDAQCCBAAhlgMBAIIEACEWzAIAALcEADDNAgAA1AIAEM4CAAC3BAAwzwIBAI0EACHYAkAAjwQAIeQCAQCNBAAh7QJAAI8EACHxAgIAqQQAIf0CIACoBAAh_gIBAI0EACGAAwEAjQQAIYUDIACoBAAhiwMBAI4EACGOAwEAjQQAIY8DAQCNBAAhkAMBAI4EACGRAwEAjQQAIZIDAACuBAAgkwMBAI0EACGUAwAArgQAIJUDAQCOBAAhlgMBAI4EACELzAIAALgEADDNAgAAzgIAEM4CAAC4BAAwzwIBAIEEACHYAkAAgwQAIe0CQACDBAAh8QICAKAEACH9AiAAnwQAIZEDAQCCBAAhlwMBAIEEACGYAwEAgQQAIQvMAgAAuQQAMM0CAAC7AgAQzgIAALkEADDPAgEAjQQAIdgCQACPBAAh7QJAAI8EACHxAgIAqQQAIf0CIACoBAAhkQMBAI4EACGXAwEAjQQAIZgDAQCNBAAhDw8BAIEEACHMAgAAugQAMM0CAAC1AgAQzgIAALoEADDPAgEAgQQAIdgCQACDBAAh7QJAAIMEACHxAgIAoAQAIfkCAQCBBAAh-wIBAIIEACH9AiAAnwQAIYUDIACfBAAhmQMBAIEEACGaAwEAgQQAIZsDAgC7BAAhDQkAAIgEACAmAACIBAAgJwAAiAQAIHgAAL0EACB5AACIBAAg2QICAAAAAdoCAgAAAAXbAgIAAAAF3AICAAAAAd0CAgAAAAHeAgIAAAAB3wICAAAAAeACAgC8BAAhDQkAAIgEACAmAACIBAAgJwAAiAQAIHgAAL0EACB5AACIBAAg2QICAAAAAdoCAgAAAAXbAgIAAAAF3AICAAAAAd0CAgAAAAHeAgIAAAAB3wICAAAAAeACAgC8BAAhCNkCCAAAAAHaAggAAAAF2wIIAAAABdwCCAAAAAHdAggAAAAB3gIIAAAAAd8CCAAAAAHgAggAvQQAIQ8PAQCNBAAhzAIAAL4EADDNAgAAogIAEM4CAAC-BAAwzwIBAI0EACHYAkAAjwQAIe0CQACPBAAh8QICAKkEACH5AgEAjQQAIfsCAQCOBAAh_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_AwEAgQQAIcADQACDBAAhwgMBAIEEACHDA0AAkwQAIcQDAQCCBAAhDMwCAADdBAAwzQIAAEQAEM4CAADdBAAwzwIBAIEEACHRAgEAgQQAIdgCQACDBAAh7QJAAIMEACH5AgAA3gTHAyKkAwEAgQQAIcUDAQCBBAAhxwMgAJ8EACHIA0AAkwQAIQcJAACFBAAgJgAA4AQAICcAAOAEACDZAgAAAMcDAtoCAAAAxwMI2wIAAADHAwjgAgAA3wTHAyIHCQAAhQQAICYAAOAEACAnAADgBAAg2QIAAADHAwLaAgAAAMcDCNsCAAAAxwMI4AIAAN8ExwMiBNkCAAAAxwMC2gIAAADHAwjbAgAAAMcDCOACAADgBMcDIhUPAADjBAAgzAIAAOEEADDNAgAAJgAQzgIAAOEEADDPAgEAjQQAIdgCQACPBAAh5AIBAI0EACHnAgAA4gSeAyLtAkAAjwQAIf4CAQCNBAAhkAMBAI0EACGRAwEAjQQAIZIDAACuBAAglQMBAI4EACGcAwEAjQQAIZ4DAgCpBAAhnwMBAI4EACGgAwEAjgQAIaEDAQCOBAAhogNAAJ0EACGjA0AAnQQAIQTZAgAAAJ4DAtoCAAAAngMI2wIAAACeAwjgAgAAwwSeAyIUBAAA7gQAIAUAAO8EACAMAADwBAAgEQAA8QQAIBIAAOsEACATAADyBAAgzAIAAOwEADDNAgAAGAAQzgIAAOwEADDPAgEAjQQAIdECAQCNBAAh2AJAAI8EACHtAkAAjwQAIfkCAADtBMcDIqQDAQCNBAAhxQMBAI0EACHHAyAAqAQAIcgDQACdBAAhzAMAABgAIM0DAAAYACAKDgAA5QQAIA8AAOMEACDMAgAA5AQAMM0CAAAfABDOAgAA5AQAMM8CAQCNBAAh2AJAAI8EACGhAwEAjgQAIakDAQCNBAAhqgMBAI0EACEYDQAA4wQAIBAAAOsEACDMAgAA5gQAMM0CAAAaABDOAgAA5gQAMM8CAQCNBAAh0QIBAI0EACHTAgEAjgQAIdgCQACPBAAh5wIAAOgErwMi6QIAAOkEsAMi7QJAAI8EACGSAwAArgQAIJoDAQCOBAAhpAMBAI0EACGmAwAA5wSuAyKrAwEAjQQAIawDAQCOBAAhsAMBAI4EACGxAwEAjgQAIbIDAQCOBAAhswMAAOoEACDMAwAAGgAgzQMAABoAIBYNAADjBAAgEAAA6wQAIMwCAADmBAAwzQIAABoAEM4CAADmBAAwzwIBAI0EACHRAgEAjQQAIdMCAQCOBAAh2AJAAI8EACHnAgAA6ASvAyLpAgAA6QSwAyLtAkAAjwQAIZIDAACuBAAgmgMBAI4EACGkAwEAjQQAIaYDAADnBK4DIqsDAQCNBAAhrAMBAI4EACGwAwEAjgQAIbEDAQCOBAAhsgMBAI4EACGzAwAA6gQAIATZAgAAAK4DAtoCAAAArgMI2wIAAACuAwjgAgAA1gSuAyIE2QIAAACvAwLaAgAAAK8DCNsCAAAArwMI4AIAANQErwMiBNkCAAAAsAMC2gIAAACwAwjbAgAAALADCOACAADSBLADIgzZAoAAAAAB3AKAAAAAAd0CgAAAAAHeAoAAAAAB3wKAAAAAAeACgAAAAAHzAgEAAAAB9AIBAAAAAfUCAQAAAAH2AoAAAAAB9wKAAAAAAfgCgAAAAAEDyQMAAB8AIMoDAAAfACDLAwAAHwAgEgQAAO4EACAFAADvBAAgDAAA8AQAIBEAAPEEACASAADrBAAgEwAA8gQAIMwCAADsBAAwzQIAABgAEM4CAADsBAAwzwIBAI0EACHRAgEAjQQAIdgCQACPBAAh7QJAAI8EACH5AgAA7QTHAyKkAwEAjQQAIcUDAQCNBAAhxwMgAKgEACHIA0AAnQQAIQTZAgAAAMcDAtoCAAAAxwMI2wIAAADHAwjgAgAA4ATHAyIDyQMAAAMAIMoDAAADACDLAwAAAwAgA8kDAAAHACDKAwAABwAgywMAAAcAIAPJAwAACwAgygMAAAsAIMsDAAALACADyQMAABoAIMoDAAAaACDLAwAAGgAgA8kDAAAmACDKAwAAJgAgywMAACYAIAoGAAD0BAAgBwAA9QQAIAgAAPAEACDMAgAA8wQAMM0CAAAPABDOAgAA8wQAMM8CAQCNBAAh0QIBAI0EACHYAkAAjwQAIbsDAQCOBAAhDAYAAPQEACAHAAD1BAAgCAAA8AQAIMwCAADzBAAwzQIAAA8AEM4CAADzBAAwzwIBAI0EACHRAgEAjQQAIdgCQACPBAAhuwMBAI4EACHMAwAADwAgzQMAAA8AIAPJAwAADwAgygMAAA8AIMsDAAAPACAQCgAA9AQAIAsAAOMEACDMAgAA9gQAMM0CAAALABDOAgAA9gQAMM8CAQCNBAAh2AJAAI8EACHuAgEAjQQAIYsDAQCNBAAhtAMBAI0EACG1AwIAqQQAIbYDAgC_BAAhtwMCAL8EACG4AwEAjgQAIbkDAQCOBAAhugMBAI4EACEKAwAA-AQAIMwCAAD3BAAwzQIAAAcAEM4CAAD3BAAwzwIBAI0EACHYAkAAjwQAIb4DAQCNBAAhvwMBAI0EACHAA0AAjwQAIcEDQACdBAAhFAQAAO4EACAFAADvBAAgDAAA8AQAIBEAAPEEACASAADrBAAgEwAA8gQAIMwCAADsBAAwzQIAABgAEM4CAADsBAAwzwIBAI0EACHRAgEAjQQAIdgCQACPBAAh7QJAAI8EACH5AgAA7QTHAyKkAwEAjQQAIcUDAQCNBAAhxwMgAKgEACHIA0AAnQQAIcwDAAAYACDNAwAAGAAgDgMAAPgEACDMAgAA-QQAMM0CAAADABDOAgAA-QQAMM8CAQCNBAAh2AJAAI8EACGxAwEAjgQAIbIDAQCOBAAhvgMBAI0EACG_AwEAjQQAIcADQACPBAAhwgMBAI0EACHDA0AAnQQAIcQDAQCOBAAhAAAAAAHRAwEAAAABAdEDAQAAAAEB0QNAAAAAAQAAAAHRAwAAAOcCAgHRAwAAAOkCAgHRA0AAAAABAAAAAAAB0QMgAAAAAQXRAwIAAAAB2AMCAAAAAdkDAgAAAAHaAwIAAAAB2wMCAAAAAQAAAAAAAAAAAAAC0QMBAAAABNcDAQAAAAUC0QMBAAAABNcDAQAAAAUB0QMBAAAABAHRAwEAAAAEAAAAAAAB0QMAAACLAwIC0QMBAAAABNcDAQAAAAUB0QMBAAAABAAAAAAAAtEDAQAAAATXAwEAAAAFAtEDAQAAAATXAwEAAAAFAdEDAQAAAAQB0QMBAAAABAAAAAAAAAAAAAAF0QMCAAAAAdgDAgAAAAHZAwIAAAAB2gMCAAAAAdsDAgAAAAEAAAAAAALRAwEAAAAE1wMBAAAABQHRAwAAAJ4DAgcgAACpBwAgIQAArAcAIM4DAACqBwAgzwMAAKsHACDSAwAAGAAg0wMAABgAINQDAAABACAB0QMBAAAABAMgAACpBwAgzgMAAKoHACDUAwAAAQAgAAAAAdEDAAAApgMCAAAABSAAAKEHACAhAACnBwAgzgMAAKIHACDPAwAApgcAINQDAAAcACAHIAAAnwcAICEAAKQHACDOAwAAoAcAIM8DAACjBwAg0gMAABgAINMDAAAYACDUAwAAAQAgAyAAAKEHACDOAwAAogcAINQDAAAcACADIAAAnwcAIM4DAACgBwAg1AMAAAEAIAAAAAHRAwAAAK4DAgHRAwAAAK8DAgHRAwAAALADAgLRAwEAAAAE1wMBAAAABQcgAACZBwAgIQAAnQcAIM4DAACaBwAgzwMAAJwHACDSAwAAGAAg0wMAABgAINQDAAABACALIAAA1gUAMCEAANsFADDOAwAA1wUAMM8DAADYBQAw0AMAANkFACDRAwAA2gUAMNIDAADaBQAw0wMAANoFADDUAwAA2gUAMNUDAADcBQAw1gMAAN0FADAFDwAAzAUAIM8CAQAAAAHYAkAAAAABoQMBAAAAAaoDAQAAAAECAAAAIQAgIAAA4QUAIAMAAAAhACAgAADhBQAgIQAA4AUAIAEZAACbBwAwCg4AAOUEACAPAADjBAAgzAIAAOQEADDNAgAAHwAQzgIAAOQEADDPAgEAAAAB2AJAAI8EACGhAwEAjgQAIakDAQCNBAAhqgMBAI0EACECAAAAIQAgGQAA4AUAIAIAAADeBQAgGQAA3wUAIAjMAgAA3QUAMM0CAADeBQAQzgIAAN0FADDPAgEAjQQAIdgCQACPBAAhoQMBAI4EACGpAwEAjQQAIaoDAQCNBAAhCMwCAADdBQAwzQIAAN4FABDOAgAA3QUAMM8CAQCNBAAh2AJAAI8EACGhAwEAjgQAIakDAQCNBAAhqgMBAI0EACEEzwIBAP4EACHYAkAAgAUAIaEDAQD_BAAhqgMBAP4EACEFDwAAygUAIM8CAQD-BAAh2AJAAIAFACGhAwEA_wQAIaoDAQD-BAAhBQ8AAMwFACDPAgEAAAAB2AJAAAAAAaEDAQAAAAGqAwEAAAABAdEDAQAAAAQDIAAAmQcAIM4DAACaBwAg1AMAAAEAIAQgAADWBQAwzgMAANcFADDQAwAA2QUAINQDAADaBQAwAAAAAAAHIAAAkQcAICEAAJcHACDOAwAAkgcAIM8DAACWBwAg0gMAAA8AINMDAAAPACDUAwAAEwAgByAAAI8HACAhAACUBwAgzgMAAJAHACDPAwAAkwcAINIDAAAYACDTAwAAGAAg1AMAAAEAIAMgAACRBwAgzgMAAJIHACDUAwAAEwAgAyAAAI8HACDOAwAAkAcAINQDAAABACAAAAAHIAAAiAcAICEAAI0HACDOAwAAiQcAIM8DAACMBwAg0gMAAA8AINMDAAAPACDUAwAAEwAgCyAAAIAGADAhAACFBgAwzgMAAIEGADDPAwAAggYAMNADAACDBgAg0QMAAIQGADDSAwAAhAYAMNMDAACEBgAw1AMAAIQGADDVAwAAhgYAMNYDAACHBgAwCyAAAPQFADAhAAD5BQAwzgMAAPUFADDPAwAA9gUAMNADAAD3BQAg0QMAAPgFADDSAwAA-AUAMNMDAAD4BQAw1AMAAPgFADDVAwAA-gUAMNYDAAD7BQAwCwsAAO0FACDPAgEAAAAB2AJAAAAAAe4CAQAAAAGLAwEAAAABtAMBAAAAAbUDAgAAAAG2AwIAAAABtwMCAAAAAbgDAQAAAAG6AwEAAAABAgAAAA0AICAAAP8FACADAAAADQAgIAAA_wUAICEAAP4FACABGQAAiwcAMBAKAAD0BAAgCwAA4wQAIMwCAAD2BAAwzQIAAAsAEM4CAAD2BAAwzwIBAAAAAdgCQACPBAAh7gIBAAAAAYsDAQCNBAAhtAMBAI0EACG1AwIAqQQAIbYDAgC_BAAhtwMCAL8EACG4AwEAjgQAIbkDAQCOBAAhugMBAI4EACECAAAADQAgGQAA_gUAIAIAAAD8BQAgGQAA_QUAIA7MAgAA-wUAMM0CAAD8BQAQzgIAAPsFADDPAgEAjQQAIdgCQACPBAAh7gIBAI0EACGLAwEAjQQAIbQDAQCNBAAhtQMCAKkEACG2AwIAvwQAIbcDAgC_BAAhuAMBAI4EACG5AwEAjgQAIboDAQCOBAAhDswCAAD7BQAwzQIAAPwFABDOAgAA-wUAMM8CAQCNBAAh2AJAAI8EACHuAgEAjQQAIYsDAQCNBAAhtAMBAI0EACG1AwIAqQQAIbYDAgC_BAAhtwMCAL8EACG4AwEAjgQAIbkDAQCOBAAhugMBAI4EACEKzwIBAP4EACHYAkAAgAUAIe4CAQD-BAAhiwMBAP4EACG0AwEA_gQAIbUDAgCNBQAhtgMCALcFACG3AwIAtwUAIbgDAQD_BAAhugMBAP8EACELCwAA6wUAIM8CAQD-BAAh2AJAAIAFACHuAgEA_gQAIYsDAQD-BAAhtAMBAP4EACG1AwIAjQUAIbYDAgC3BQAhtwMCALcFACG4AwEA_wQAIboDAQD_BAAhCwsAAO0FACDPAgEAAAAB2AJAAAAAAe4CAQAAAAGLAwEAAAABtAMBAAAAAbUDAgAAAAG2AwIAAAABtwMCAAAAAbgDAQAAAAG6AwEAAAABBQcAAIwGACAIAACNBgAgzwIBAAAAAdECAQAAAAHYAkAAAAABAgAAABMAICAAAIsGACADAAAAEwAgIAAAiwYAICEAAIoGACABGQAAigcAMAoGAAD0BAAgBwAA9QQAIAgAAPAEACDMAgAA8wQAMM0CAAAPABDOAgAA8wQAMM8CAQAAAAHRAgEAjQQAIdgCQACPBAAhuwMBAI4EACECAAAAEwAgGQAAigYAIAIAAACIBgAgGQAAiQYAIAfMAgAAhwYAMM0CAACIBgAQzgIAAIcGADDPAgEAjQQAIdECAQCNBAAh2AJAAI8EACG7AwEAjgQAIQfMAgAAhwYAMM0CAACIBgAQzgIAAIcGADDPAgEAjQQAIdECAQCNBAAh2AJAAI8EACG7AwEAjgQAIQPPAgEA_gQAIdECAQD-BAAh2AJAAIAFACEFBwAA8gUAIAgAAPMFACDPAgEA_gQAIdECAQD-BAAh2AJAAIAFACEFBwAAjAYAIAgAAI0GACDPAgEAAAAB0QIBAAAAAdgCQAAAAAEEIAAAgAYAMM4DAACBBgAw0AMAAIMGACDUAwAAhAYAMAQgAAD0BQAwzgMAAPUFADDQAwAA9wUAINQDAAD4BQAwAyAAAIgHACDOAwAAiQcAINQDAAATACAAAAAAAAAFIAAAgwcAICEAAIYHACDOAwAAhAcAIM8DAACFBwAg1AMAAAEAIAMgAACDBwAgzgMAAIQHACDUAwAAAQAgAAAABSAAAP4GACAhAACBBwAgzgMAAP8GACDPAwAAgAcAINQDAAABACADIAAA_gYAIM4DAAD_BgAg1AMAAAEAIAAAAAHRAwAAAMcDAgsgAADcBgAwIQAA4QYAMM4DAADdBgAwzwMAAN4GADDQAwAA3wYAINEDAADgBgAw0gMAAOAGADDTAwAA4AYAMNQDAADgBgAw1QMAAOIGADDWAwAA4wYAMAsgAADQBgAwIQAA1QYAMM4DAADRBgAwzwMAANIGADDQAwAA0wYAINEDAADUBgAw0gMAANQGADDTAwAA1AYAMNQDAADUBgAw1QMAANYGADDWAwAA1wYAMAsgAADHBgAwIQAAywYAMM4DAADIBgAwzwMAAMkGADDQAwAAygYAINEDAAD4BQAw0gMAAPgFADDTAwAA-AUAMNQDAAD4BQAw1QMAAMwGADDWAwAA-wUAMAsgAAC7BgAwIQAAwAYAMM4DAAC8BgAwzwMAAL0GADDQAwAAvgYAINEDAAC_BgAw0gMAAL8GADDTAwAAvwYAMNQDAAC_BgAw1QMAAMEGADDWAwAAwgYAMAsgAACyBgAwIQAAtgYAMM4DAACzBgAwzwMAALQGADDQAwAAtQYAINEDAADaBQAw0gMAANoFADDTAwAA2gUAMNQDAADaBQAw1QMAALcGADDWAwAA3QUAMAsgAACmBgAwIQAAqwYAMM4DAACnBgAwzwMAAKgGADDQAwAAqQYAINEDAACqBgAw0gMAAKoGADDTAwAAqgYAMNQDAACqBgAw1QMAAKwGADDWAwAArQYAMBDPAgEAAAAB2AJAAAAAAeQCAQAAAAHnAgAAAJ4DAu0CQAAAAAH-AgEAAAABkAMBAAAAAZEDAQAAAAGSAwAAwAUAIJUDAQAAAAGcAwEAAAABngMCAAAAAZ8DAQAAAAGgAwEAAAABogNAAAAAAaMDQAAAAAECAAAAKAAgIAAAsQYAIAMAAAAoACAgAACxBgAgIQAAsAYAIAEZAAD9BgAwFQ8AAOMEACDMAgAA4QQAMM0CAAAmABDOAgAA4QQAMM8CAQAAAAHYAkAAjwQAIeQCAQCNBAAh5wIAAOIEngMi7QJAAI8EACH-AgEAAAABkAMBAI0EACGRAwEAjQQAIZIDAACuBAAglQMBAI4EACGcAwEAjQQAIZ4DAgCpBAAhnwMBAI4EACGgAwEAjgQAIaEDAQCOBAAhogNAAJ0EACGjA0AAnQQAIQIAAAAoACAZAACwBgAgAgAAAK4GACAZAACvBgAgFMwCAACtBgAwzQIAAK4GABDOAgAArQYAMM8CAQCNBAAh2AJAAI8EACHkAgEAjQQAIecCAADiBJ4DIu0CQACPBAAh_gIBAI0EACGQAwEAjQQAIZEDAQCNBAAhkgMAAK4EACCVAwEAjgQAIZwDAQCNBAAhngMCAKkEACGfAwEAjgQAIaADAQCOBAAhoQMBAI4EACGiA0AAnQQAIaMDQACdBAAhFMwCAACtBgAwzQIAAK4GABDOAgAArQYAMM8CAQCNBAAh2AJAAI8EACHkAgEAjQQAIecCAADiBJ4DIu0CQACPBAAh_gIBAI0EACGQAwEAjQQAIZEDAQCNBAAhkgMAAK4EACCVAwEAjgQAIZwDAQCNBAAhngMCAKkEACGfAwEAjgQAIaADAQCOBAAhoQMBAI4EACGiA0AAnQQAIaMDQACdBAAhEM8CAQD-BAAh2AJAAIAFACHkAgEA_gQAIecCAAC-BZ4DIu0CQACABQAh_gIBAP4EACGQAwEA_gQAIZEDAQD-BAAhkgMAAL0FACCVAwEA_wQAIZwDAQD-BAAhngMCAI0FACGfAwEA_wQAIaADAQD_BAAhogNAAIYFACGjA0AAhgUAIRDPAgEA_gQAIdgCQACABQAh5AIBAP4EACHnAgAAvgWeAyLtAkAAgAUAIf4CAQD-BAAhkAMBAP4EACGRAwEA_gQAIZIDAAC9BQAglQMBAP8EACGcAwEA_gQAIZ4DAgCNBQAhnwMBAP8EACGgAwEA_wQAIaIDQACGBQAhowNAAIYFACEQzwIBAAAAAdgCQAAAAAHkAgEAAAAB5wIAAACeAwLtAkAAAAAB_gIBAAAAAZADAQAAAAGRAwEAAAABkgMAAMAFACCVAwEAAAABnAMBAAAAAZ4DAgAAAAGfAwEAAAABoAMBAAAAAaIDQAAAAAGjA0AAAAABBQ4AAMsFACDPAgEAAAAB2AJAAAAAAakDAQAAAAGqAwEAAAABAgAAACEAICAAALoGACADAAAAIQAgIAAAugYAICEAALkGACABGQAA_AYAMAIAAAAhACAZAAC5BgAgAgAAAN4FACAZAAC4BgAgBM8CAQD-BAAh2AJAAIAFACGpAwEA_gQAIaoDAQD-BAAhBQ4AAMkFACDPAgEA_gQAIdgCQACABQAhqQMBAP4EACGqAwEA_gQAIQUOAADLBQAgzwIBAAAAAdgCQAAAAAGpAwEAAAABqgMBAAAAAREQAADkBQAgzwIBAAAAAdECAQAAAAHTAgEAAAAB2AJAAAAAAecCAAAArwMC6QIAAACwAwLtAkAAAAABkgMAAOIFACCaAwEAAAABpAMBAAAAAaYDAAAArgMCqwMBAAAAAawDAQAAAAGxAwEAAAABsgMBAAAAAbMDgAAAAAECAAAAHAAgIAAAxgYAIAMAAAAcACAgAADGBgAgIQAAxQYAIAEZAAD7BgAwFg0AAOMEACAQAADrBAAgzAIAAOYEADDNAgAAGgAQzgIAAOYEADDPAgEAAAAB0QIBAI0EACHTAgEAjgQAIdgCQACPBAAh5wIAAOgErwMi6QIAAOkEsAMi7QJAAI8EACGSAwAArgQAIJoDAQCOBAAhpAMBAI0EACGmAwAA5wSuAyKrAwEAjQQAIawDAQCOBAAhsAMBAI4EACGxAwEAjgQAIbIDAQCOBAAhswMAAOoEACACAAAAHAAgGQAAxQYAIAIAAADDBgAgGQAAxAYAIBTMAgAAwgYAMM0CAADDBgAQzgIAAMIGADDPAgEAjQQAIdECAQCNBAAh0wIBAI4EACHYAkAAjwQAIecCAADoBK8DIukCAADpBLADIu0CQACPBAAhkgMAAK4EACCaAwEAjgQAIaQDAQCNBAAhpgMAAOcErgMiqwMBAI0EACGsAwEAjgQAIbADAQCOBAAhsQMBAI4EACGyAwEAjgQAIbMDAADqBAAgFMwCAADCBgAwzQIAAMMGABDOAgAAwgYAMM8CAQCNBAAh0QIBAI0EACHTAgEAjgQAIdgCQACPBAAh5wIAAOgErwMi6QIAAOkEsAMi7QJAAI8EACGSAwAArgQAIJoDAQCOBAAhpAMBAI0EACGmAwAA5wSuAyKrAwEAjQQAIawDAQCOBAAhsAMBAI4EACGxAwEAjgQAIbIDAQCOBAAhswMAAOoEACAQzwIBAP4EACHRAgEA_gQAIdMCAQD_BAAh2AJAAIAFACHnAgAA0QWvAyLpAgAA0gWwAyLtAkAAgAUAIZIDAADTBQAgmgMBAP8EACGkAwEA_gQAIaYDAADQBa4DIqsDAQD-BAAhrAMBAP8EACGxAwEA_wQAIbIDAQD_BAAhswOAAAAAAREQAADVBQAgzwIBAP4EACHRAgEA_gQAIdMCAQD_BAAh2AJAAIAFACHnAgAA0QWvAyLpAgAA0gWwAyLtAkAAgAUAIZIDAADTBQAgmgMBAP8EACGkAwEA_gQAIaYDAADQBa4DIqsDAQD-BAAhrAMBAP8EACGxAwEA_wQAIbIDAQD_BAAhswOAAAAAAREQAADkBQAgzwIBAAAAAdECAQAAAAHTAgEAAAAB2AJAAAAAAecCAAAArwMC6QIAAACwAwLtAkAAAAABkgMAAOIFACCaAwEAAAABpAMBAAAAAaYDAAAArgMCqwMBAAAAAawDAQAAAAGxAwEAAAABsgMBAAAAAbMDgAAAAAELCgAA7AUAIM8CAQAAAAHYAkAAAAAB7gIBAAAAAYsDAQAAAAG0AwEAAAABtQMCAAAAAbYDAgAAAAG3AwIAAAABuAMBAAAAAbkDAQAAAAECAAAADQAgIAAAzwYAIAMAAAANACAgAADPBgAgIQAAzgYAIAEZAAD6BgAwAgAAAA0AIBkAAM4GACACAAAA_AUAIBkAAM0GACAKzwIBAP4EACHYAkAAgAUAIe4CAQD-BAAhiwMBAP4EACG0AwEA_gQAIbUDAgCNBQAhtgMCALcFACG3AwIAtwUAIbgDAQD_BAAhuQMBAP8EACELCgAA6gUAIM8CAQD-BAAh2AJAAIAFACHuAgEA_gQAIYsDAQD-BAAhtAMBAP4EACG1AwIAjQUAIbYDAgC3BQAhtwMCALcFACG4AwEA_wQAIbkDAQD_BAAhCwoAAOwFACDPAgEAAAAB2AJAAAAAAe4CAQAAAAGLAwEAAAABtAMBAAAAAbUDAgAAAAG2AwIAAAABtwMCAAAAAbgDAQAAAAG5AwEAAAABBc8CAQAAAAHYAkAAAAABvwMBAAAAAcADQAAAAAHBA0AAAAABAgAAAAkAICAAANsGACADAAAACQAgIAAA2wYAICEAANoGACABGQAA-QYAMAoDAAD4BAAgzAIAAPcEADDNAgAABwAQzgIAAPcEADDPAgEAAAAB2AJAAI8EACG-AwEAjQQAIb8DAQAAAAHAA0AAjwQAIcEDQACdBAAhAgAAAAkAIBkAANoGACACAAAA2AYAIBkAANkGACAJzAIAANcGADDNAgAA2AYAEM4CAADXBgAwzwIBAI0EACHYAkAAjwQAIb4DAQCNBAAhvwMBAI0EACHAA0AAjwQAIcEDQACdBAAhCcwCAADXBgAwzQIAANgGABDOAgAA1wYAMM8CAQCNBAAh2AJAAI8EACG-AwEAjQQAIb8DAQCNBAAhwANAAI8EACHBA0AAnQQAIQXPAgEA_gQAIdgCQACABQAhvwMBAP4EACHAA0AAgAUAIcEDQACGBQAhBc8CAQD-BAAh2AJAAIAFACG_AwEA_gQAIcADQACABQAhwQNAAIYFACEFzwIBAAAAAdgCQAAAAAG_AwEAAAABwANAAAAAAcEDQAAAAAEJzwIBAAAAAdgCQAAAAAGxAwEAAAABsgMBAAAAAb8DAQAAAAHAA0AAAAABwgMBAAAAAcMDQAAAAAHEAwEAAAABAgAAAAUAICAAAOcGACADAAAABQAgIAAA5wYAICEAAOYGACABGQAA-AYAMA4DAAD4BAAgzAIAAPkEADDNAgAAAwAQzgIAAPkEADDPAgEAAAAB2AJAAI8EACGxAwEAjgQAIbIDAQCOBAAhvgMBAI0EACG_AwEAAAABwANAAI8EACHCAwEAjQQAIcMDQACdBAAhxAMBAI4EACECAAAABQAgGQAA5gYAIAIAAADkBgAgGQAA5QYAIA3MAgAA4wYAMM0CAADkBgAQzgIAAOMGADDPAgEAjQQAIdgCQACPBAAhsQMBAI4EACGyAwEAjgQAIb4DAQCNBAAhvwMBAI0EACHAA0AAjwQAIcIDAQCNBAAhwwNAAJ0EACHEAwEAjgQAIQ3MAgAA4wYAMM0CAADkBgAQzgIAAOMGADDPAgEAjQQAIdgCQACPBAAhsQMBAI4EACGyAwEAjgQAIb4DAQCNBAAhvwMBAI0EACHAA0AAjwQAIcIDAQCNBAAhwwNAAJ0EACHEAwEAjgQAIQnPAgEA_gQAIdgCQACABQAhsQMBAP8EACGyAwEA_wQAIb8DAQD-BAAhwANAAIAFACHCAwEA_gQAIcMDQACGBQAhxAMBAP8EACEJzwIBAP4EACHYAkAAgAUAIbEDAQD_BAAhsgMBAP8EACG_AwEA_gQAIcADQACABQAhwgMBAP4EACHDA0AAhgUAIcQDAQD_BAAhCc8CAQAAAAHYAkAAAAABsQMBAAAAAbIDAQAAAAG_AwEAAAABwANAAAAAAcIDAQAAAAHDA0AAAAABxAMBAAAAAQQgAADcBgAwzgMAAN0GADDQAwAA3wYAINQDAADgBgAwBCAAANAGADDOAwAA0QYAMNADAADTBgAg1AMAANQGADAEIAAAxwYAMM4DAADIBgAw0AMAAMoGACDUAwAA-AUAMAQgAAC7BgAwzgMAALwGADDQAwAAvgYAINQDAAC_BgAwBCAAALIGADDOAwAAswYAMNADAAC1BgAg1AMAANoFADAEIAAApgYAMM4DAACnBgAw0AMAAKkGACDUAwAAqgYAMAAAAAAAAAcEAADuBgAgBQAA7wYAIAwAAPAGACARAADxBgAgEgAA8gYAIBMAAPMGACDIAwAA-gQAIAkNAAD0BgAgEAAA8gYAINMCAAD6BAAgmgMAAPoEACCsAwAA-gQAILADAAD6BAAgsQMAAPoEACCyAwAA-gQAILMDAAD6BAAgBAYAAPYGACAHAAD3BgAgCAAA8AYAILsDAAD6BAAgAAnPAgEAAAAB2AJAAAAAAbEDAQAAAAGyAwEAAAABvwMBAAAAAcADQAAAAAHCAwEAAAABwwNAAAAAAcQDAQAAAAEFzwIBAAAAAdgCQAAAAAG_AwEAAAABwANAAAAAAcEDQAAAAAEKzwIBAAAAAdgCQAAAAAHuAgEAAAABiwMBAAAAAbQDAQAAAAG1AwIAAAABtgMCAAAAAbcDAgAAAAG4AwEAAAABuQMBAAAAARDPAgEAAAAB0QIBAAAAAdMCAQAAAAHYAkAAAAAB5wIAAACvAwLpAgAAALADAu0CQAAAAAGSAwAA4gUAIJoDAQAAAAGkAwEAAAABpgMAAACuAwKrAwEAAAABrAMBAAAAAbEDAQAAAAGyAwEAAAABswOAAAAAAQTPAgEAAAAB2AJAAAAAAakDAQAAAAGqAwEAAAABEM8CAQAAAAHYAkAAAAAB5AIBAAAAAecCAAAAngMC7QJAAAAAAf4CAQAAAAGQAwEAAAABkQMBAAAAAZIDAADABQAglQMBAAAAAZwDAQAAAAGeAwIAAAABnwMBAAAAAaADAQAAAAGiA0AAAAABowNAAAAAAQ4FAADpBgAgDAAA6gYAIBEAAOsGACASAADsBgAgEwAA7QYAIM8CAQAAAAHRAgEAAAAB2AJAAAAAAe0CQAAAAAH5AgAAAMcDAqQDAQAAAAHFAwEAAAABxwMgAAAAAcgDQAAAAAECAAAAAQAgIAAA_gYAIAMAAAAYACAgAAD-BgAgIQAAggcAIBAAAAAYACAFAAChBgAgDAAAogYAIBEAAKMGACASAACkBgAgEwAApQYAIBkAAIIHACDPAgEA_gQAIdECAQD-BAAh2AJAAIAFACHtAkAAgAUAIfkCAACfBscDIqQDAQD-BAAhxQMBAP4EACHHAyAAjAUAIcgDQACGBQAhDgUAAKEGACAMAACiBgAgEQAAowYAIBIAAKQGACATAAClBgAgzwIBAP4EACHRAgEA_gQAIdgCQACABQAh7QJAAIAFACH5AgAAnwbHAyKkAwEA_gQAIcUDAQD-BAAhxwMgAIwFACHIA0AAhgUAIQ4EAADoBgAgDAAA6gYAIBEAAOsGACASAADsBgAgEwAA7QYAIM8CAQAAAAHRAgEAAAAB2AJAAAAAAe0CQAAAAAH5AgAAAMcDAqQDAQAAAAHFAwEAAAABxwMgAAAAAcgDQAAAAAECAAAAAQAgIAAAgwcAIAMAAAAYACAgAACDBwAgIQAAhwcAIBAAAAAYACAEAACgBgAgDAAAogYAIBEAAKMGACASAACkBgAgEwAApQYAIBkAAIcHACDPAgEA_gQAIdECAQD-BAAh2AJAAIAFACHtAkAAgAUAIfkCAACfBscDIqQDAQD-BAAhxQMBAP4EACHHAyAAjAUAIcgDQACGBQAhDgQAAKAGACAMAACiBgAgEQAAowYAIBIAAKQGACATAAClBgAgzwIBAP4EACHRAgEA_gQAIdgCQACABQAh7QJAAIAFACH5AgAAnwbHAyKkAwEA_gQAIcUDAQD-BAAhxwMgAIwFACHIA0AAhgUAIQYGAACOBgAgCAAAjQYAIM8CAQAAAAHRAgEAAAAB2AJAAAAAAbsDAQAAAAECAAAAEwAgIAAAiAcAIAPPAgEAAAAB0QIBAAAAAdgCQAAAAAEKzwIBAAAAAdgCQAAAAAHuAgEAAAABiwMBAAAAAbQDAQAAAAG1AwIAAAABtgMCAAAAAbcDAgAAAAG4AwEAAAABugMBAAAAAQMAAAAPACAgAACIBwAgIQAAjgcAIAgAAAAPACAGAADxBQAgCAAA8wUAIBkAAI4HACDPAgEA_gQAIdECAQD-BAAh2AJAAIAFACG7AwEA_wQAIQYGAADxBQAgCAAA8wUAIM8CAQD-BAAh0QIBAP4EACHYAkAAgAUAIbsDAQD_BAAhDgQAAOgGACAFAADpBgAgEQAA6wYAIBIAAOwGACATAADtBgAgzwIBAAAAAdECAQAAAAHYAkAAAAAB7QJAAAAAAfkCAAAAxwMCpAMBAAAAAcUDAQAAAAHHAyAAAAAByANAAAAAAQIAAAABACAgAACPBwAgBgYAAI4GACAHAACMBgAgzwIBAAAAAdECAQAAAAHYAkAAAAABuwMBAAAAAQIAAAATACAgAACRBwAgAwAAABgAICAAAI8HACAhAACVBwAgEAAAABgAIAQAAKAGACAFAAChBgAgEQAAowYAIBIAAKQGACATAAClBgAgGQAAlQcAIM8CAQD-BAAh0QIBAP4EACHYAkAAgAUAIe0CQACABQAh-QIAAJ8GxwMipAMBAP4EACHFAwEA_gQAIccDIACMBQAhyANAAIYFACEOBAAAoAYAIAUAAKEGACARAACjBgAgEgAApAYAIBMAAKUGACDPAgEA_gQAIdECAQD-BAAh2AJAAIAFACHtAkAAgAUAIfkCAACfBscDIqQDAQD-BAAhxQMBAP4EACHHAyAAjAUAIcgDQACGBQAhAwAAAA8AICAAAJEHACAhAACYBwAgCAAAAA8AIAYAAPEFACAHAADyBQAgGQAAmAcAIM8CAQD-BAAh0QIBAP4EACHYAkAAgAUAIbsDAQD_BAAhBgYAAPEFACAHAADyBQAgzwIBAP4EACHRAgEA_gQAIdgCQACABQAhuwMBAP8EACEOBAAA6AYAIAUAAOkGACAMAADqBgAgEgAA7AYAIBMAAO0GACDPAgEAAAAB0QIBAAAAAdgCQAAAAAHtAkAAAAAB-QIAAADHAwKkAwEAAAABxQMBAAAAAccDIAAAAAHIA0AAAAABAgAAAAEAICAAAJkHACAEzwIBAAAAAdgCQAAAAAGhAwEAAAABqgMBAAAAAQMAAAAYACAgAACZBwAgIQAAngcAIBAAAAAYACAEAACgBgAgBQAAoQYAIAwAAKIGACASAACkBgAgEwAApQYAIBkAAJ4HACDPAgEA_gQAIdECAQD-BAAh2AJAAIAFACHtAkAAgAUAIfkCAACfBscDIqQDAQD-BAAhxQMBAP4EACHHAyAAjAUAIcgDQACGBQAhDgQAAKAGACAFAAChBgAgDAAAogYAIBIAAKQGACATAAClBgAgzwIBAP4EACHRAgEA_gQAIdgCQACABQAh7QJAAIAFACH5AgAAnwbHAyKkAwEA_gQAIcUDAQD-BAAhxwMgAIwFACHIA0AAhgUAIQ4EAADoBgAgBQAA6QYAIAwAAOoGACARAADrBgAgEwAA7QYAIM8CAQAAAAHRAgEAAAAB2AJAAAAAAe0CQAAAAAH5AgAAAMcDAqQDAQAAAAHFAwEAAAABxwMgAAAAAcgDQAAAAAECAAAAAQAgIAAAnwcAIBINAADjBQAgzwIBAAAAAdECAQAAAAHTAgEAAAAB2AJAAAAAAecCAAAArwMC6QIAAACwAwLtAkAAAAABkgMAAOIFACCaAwEAAAABpAMBAAAAAaYDAAAArgMCqwMBAAAAAawDAQAAAAGwAwEAAAABsQMBAAAAAbIDAQAAAAGzA4AAAAABAgAAABwAICAAAKEHACADAAAAGAAgIAAAnwcAICEAAKUHACAQAAAAGAAgBAAAoAYAIAUAAKEGACAMAACiBgAgEQAAowYAIBMAAKUGACAZAAClBwAgzwIBAP4EACHRAgEA_gQAIdgCQACABQAh7QJAAIAFACH5AgAAnwbHAyKkAwEA_gQAIcUDAQD-BAAhxwMgAIwFACHIA0AAhgUAIQ4EAACgBgAgBQAAoQYAIAwAAKIGACARAACjBgAgEwAApQYAIM8CAQD-BAAh0QIBAP4EACHYAkAAgAUAIe0CQACABQAh-QIAAJ8GxwMipAMBAP4EACHFAwEA_gQAIccDIACMBQAhyANAAIYFACEDAAAAGgAgIAAAoQcAICEAAKgHACAUAAAAGgAgDQAA1AUAIBkAAKgHACDPAgEA_gQAIdECAQD-BAAh0wIBAP8EACHYAkAAgAUAIecCAADRBa8DIukCAADSBbADIu0CQACABQAhkgMAANMFACCaAwEA_wQAIaQDAQD-BAAhpgMAANAFrgMiqwMBAP4EACGsAwEA_wQAIbADAQD_BAAhsQMBAP8EACGyAwEA_wQAIbMDgAAAAAESDQAA1AUAIM8CAQD-BAAh0QIBAP4EACHTAgEA_wQAIdgCQACABQAh5wIAANEFrwMi6QIAANIFsAMi7QJAAIAFACGSAwAA0wUAIJoDAQD_BAAhpAMBAP4EACGmAwAA0AWuAyKrAwEA_gQAIawDAQD_BAAhsAMBAP8EACGxAwEA_wQAIbIDAQD_BAAhswOAAAAAAQ4EAADoBgAgBQAA6QYAIAwAAOoGACARAADrBgAgEgAA7AYAIM8CAQAAAAHRAgEAAAAB2AJAAAAAAe0CQAAAAAH5AgAAAMcDAqQDAQAAAAHFAwEAAAABxwMgAAAAAcgDQAAAAAECAAAAAQAgIAAAqQcAIAMAAAAYACAgAACpBwAgIQAArQcAIBAAAAAYACAEAACgBgAgBQAAoQYAIAwAAKIGACARAACjBgAgEgAApAYAIBkAAK0HACDPAgEA_gQAIdECAQD-BAAh2AJAAIAFACHtAkAAgAUAIfkCAACfBscDIqQDAQD-BAAhxQMBAP4EACHHAyAAjAUAIcgDQACGBQAhDgQAAKAGACAFAAChBgAgDAAAogYAIBEAAKMGACASAACkBgAgzwIBAP4EACHRAgEA_gQAIdgCQACABQAh7QJAAIAFACH5AgAAnwbHAyKkAwEA_gQAIcUDAQD-BAAhxwMgAIwFACHIA0AAhgUAIQcEBgIFCgMJAAsMDgQRHQcSJQgTKQoBAwABAQMAAQIKEAULGQEEBhEFBxQFCBUECQAGAgcWAAgXAAMJAAkNHgEQIggCDgAHDyMBARAkAAEPKgEGBCsABSwADC0AES4AEi8AEzAAAAAAAwkAECYAEScAEgAAAAMJABAmABEnABIBAwABAQMAAQMJABcmABgnABkAAAADCQAXJgAYJwAZAQMAAQEDAAEDCQAeJgAfJwAgAAAAAwkAHiYAHycAIAAAAAMJACYmACcnACgAAAADCQAmJgAnJwAoAQaWAQUBBpwBBQMJAC0mAC4nAC8AAAADCQAtJgAuJwAvAgquAQULrwEBAgq1AQULtgEBBQkANCYANycAOHgANXkANgAAAAAABQkANCYANycAOHgANXkANgENyAEBAQ3OAQEDCQA9JgA-JwA_AAAAAwkAPSYAPicAPwIOAAcP4AEBAg4ABw_mAQEDCQBEJgBFJwBGAAAAAwkARCYARScARgAAAAMJAEwmAE0nAE4AAAADCQBMJgBNJwBOAQ-RAgEBD5cCAQUJAFMmAFYnAFd4AFR5AFUAAAAAAAUJAFMmAFYnAFd4AFR5AFUAAAAFCQBdJgBgJwBheABeeQBfAAAAAAAFCQBdJgBgJwBheABeeQBfAAAABQkAZyYAaicAa3gAaHkAaQAAAAAABQkAZyYAaicAa3gAaHkAaQAAAAUJAHEmAHQnAHV4AHJ5AHMAAAAAAAUJAHEmAHQnAHV4AHJ5AHMAAAAFCQB7JgB-JwB_eAB8eQB9AAAAAAAFCQB7JgB-JwB_eAB8eQB9AAAABQkAhQEmAIgBJwCJAXgAhgF5AIcBAAAAAAAFCQCFASYAiAEnAIkBeACGAXkAhwEAAAAFCQCPASYAkgEnAJMBeACQAXkAkQEAAAAAAAUJAI8BJgCSAScAkwF4AJABeQCRAQAAAAUJAJkBJgCcAScAnQF4AJoBeQCbAQAAAAAABQkAmQEmAJwBJwCdAXgAmgF5AJsBAAAAAwkAowEmAKQBJwClAQAAAAMJAKMBJgCkAScApQEAAAADCQCrASYArAEnAK0BAAAAAwkAqwEmAKwBJwCtARQCARUxARYzARc0ARg1ARo3ARs5DBw6DR08AR4-DB8_DiJAASNBASRCDChFDylGEypHAitIAixJAi1KAi5LAi9NAjBPDDFQFDJSAjNUDDRVFTVWAjZXAjdYDDhbFjlcGjpdAzteAzxfAz1gAz5hAz9jA0BlDEFmG0JoA0NqDERrHEVsA0ZtA0duDEhxHUlyIUp0Ikt1Ikx4Ik15Ik56Ik98IlB-DFF_I1KBASJTgwEMVIQBJFWFASJWhgEiV4cBDFiKASVZiwEpWowBBVuNAQVcjgEFXY8BBV6QAQVfkgEFYJQBDGGVASpimAEFY5oBDGSbAStlnQEFZp4BBWefAQxoogEsaaMBMGqkAQRrpQEEbKYBBG2nAQRuqAEEb6oBBHCsAQxxrQExcrEBBHOzAQx0tAEydbcBBHa4AQR3uQEMerwBM3u9ATl8vgEHfb8BB37AAQd_wQEHgAHCAQeBAcQBB4IBxgEMgwHHATqEAcoBB4UBzAEMhgHNATuHAc8BB4gB0AEHiQHRAQyKAdQBPIsB1QFAjAHWAQiNAdcBCI4B2AEIjwHZAQiQAdoBCJEB3AEIkgHeAQyTAd8BQZQB4gEIlQHkAQyWAeUBQpcB5wEImAHoAQiZAekBDJoB7AFDmwHtAUecAe8BSJ0B8AFIngHzAUifAfQBSKAB9QFIoQH3AUiiAfkBDKMB-gFJpAH8AUilAf4BDKYB_wFKpwGAAkioAYECSKkBggIMqgGFAkurAYYCT6wBhwIKrQGIAgquAYkCCq8BigIKsAGLAgqxAY0CCrIBjwIMswGQAlC0AZMCCrUBlQIMtgGWAlG3AZgCCrgBmQIKuQGaAgy6AZ0CUrsBngJYvAGgAlm9AaECWb4BpAJZvwGlAlnAAaYCWcEBqAJZwgGqAgzDAasCWsQBrQJZxQGvAgzGAbACW8cBsQJZyAGyAlnJAbMCDMoBtgJcywG3AmLMAbkCY80BugJjzgG9AmPPAb4CY9ABvwJj0QHBAmPSAcMCDNMBxAJk1AHGAmPVAcgCDNYByQJl1wHKAmPYAcsCY9kBzAIM2gHPAmbbAdACbNwB0gJt3QHTAm3eAdYCbd8B1wJt4AHYAm3hAdoCbeIB3AIM4wHdAm7kAd8CbeUB4QIM5gHiAm_nAeMCbegB5AJt6QHlAgzqAegCcOsB6QJ27AHrAnftAewCd-4B7wJ37wHwAnfwAfECd_EB8wJ38gH1AgzzAfYCePQB-AJ39QH6Agz2AfsCefcB_AJ3-AH9Anf5Af4CDPoBgQN6-wGCA4AB_AGEA4EB_QGFA4EB_gGIA4EB_wGJA4EBgAKKA4EBgQKMA4EBggKOAwyDAo8DggGEApEDgQGFApMDDIYClAODAYcClQOBAYgClgOBAYkClwMMigKaA4QBiwKbA4oBjAKdA4sBjQKeA4sBjgKhA4sBjwKiA4sBkAKjA4sBkQKlA4sBkgKnAwyTAqgDjAGUAqoDiwGVAqwDDJYCrQONAZcCrgOLAZgCrwOLAZkCsAMMmgKzA44BmwK0A5QBnAK2A5UBnQK3A5UBngK6A5UBnwK7A5UBoAK8A5UBoQK-A5UBogLAAwyjAsEDlgGkAsMDlQGlAsUDDKYCxgOXAacCxwOVAagCyAOVAakCyQMMqgLMA5gBqwLNA54BrALPA58BrQLQA58BrgLTA58BrwLUA58BsALVA58BsQLXA58BsgLZAwyzAtoDoAG0AtwDnwG1At4DDLYC3wOhAbcC4AOfAbgC4QOfAbkC4gMMugLlA6IBuwLmA6YBvALoA6cBvQLpA6cBvgLsA6cBvwLtA6cBwALuA6cBwQLwA6cBwgLyAwzDAvMDqAHEAvUDpwHFAvcDDMYC-AOpAccC-QOnAcgC-gOnAckC-wMMygL-A6oBywL_A64B"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer } = await import("node:buffer");
  const wasmArray = Buffer.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// ../../packages/database/src/generated/prisma/internal/prismaNamespace.ts
import * as runtime2 from "@prisma/client/runtime/client";
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var defineExtension = runtime2.Extensions.defineExtension;

// ../../packages/database/src/generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// ../../packages/database/src/client.ts
var client;
function getPrisma(connectionString) {
  client ??= new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  return client;
}

// ../../packages/database/src/repositories/analytics.repository.ts
var AnalyticsRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  create(data) {
    return this.db.analyticsEvent.create({ data });
  }
  /** Total pageviews + distinct visitors since `since`. */
  async summary(since) {
    const where = { type: "pageview", createdAt: { gte: since } };
    const [pageviews, distinct] = await Promise.all([
      this.db.analyticsEvent.count({ where }),
      this.db.analyticsEvent.findMany({
        where: { ...where, visitorHash: { not: null } },
        distinct: ["visitorHash"],
        select: { visitorHash: true }
      })
    ]);
    return { pageviews, visitors: distinct.length };
  }
  /** Pageviews grouped by UTC day since `since`, ascending. */
  async dailyPageviews(since) {
    const rows = await this.db.$queryRaw`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
      FROM analytics_events
      WHERE type = 'pageview' AND "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `;
    return rows.map((r) => ({
      date: r.day.toISOString().slice(0, 10),
      count: Number(r.count)
    }));
  }
  /** Top values of a groupable column (path or referrer) since `since`. */
  async topBy(field, since, limit) {
    const where = {
      type: "pageview",
      createdAt: { gte: since },
      ...field === "referrer" ? { referrer: { not: null } } : {}
    };
    const grouped = await this.db.analyticsEvent.groupBy({
      by: [field],
      where,
      _count: { _all: true },
      orderBy: { _count: { [field]: "desc" } },
      take: limit
    });
    return grouped.map((g) => ({
      key: g[field] ?? "(direct)",
      count: g._count._all
    }));
  }
  topPaths(since, limit = 10) {
    return this.topBy("path", since, limit);
  }
  topReferrers(since, limit = 10) {
    return this.topBy("referrer", since, limit);
  }
};

// ../../packages/database/src/repositories/blog.repository.ts
var authorSelect = { author: { select: { id: true, name: true } } };
var BlogRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  create(data) {
    return this.db.blogPost.create({ data });
  }
  findById(id) {
    return this.db.blogPost.findUnique({ where: { id }, include: authorSelect });
  }
  findBySlug(slug) {
    return this.db.blogPost.findUnique({ where: { slug }, include: authorSelect });
  }
  slugExists(slug, exceptId) {
    return this.db.blogPost.findFirst({
      where: { slug, ...exceptId ? { id: { not: exceptId } } : {} },
      select: { id: true }
    });
  }
  async list({ skip = 0, take = 20, status } = {}) {
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.db.blogPost.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, include: authorSelect }),
      this.db.blogPost.count({ where })
    ]);
    return { items, total };
  }
  async listPublished({ skip = 0, take = 50 } = {}) {
    const where = { status: "PUBLISHED" };
    const [items, total] = await Promise.all([
      this.db.blogPost.findMany({ where, orderBy: { publishedAt: "desc" }, skip, take }),
      this.db.blogPost.count({ where })
    ]);
    return { items, total };
  }
  update(id, data) {
    return this.db.blogPost.update({ where: { id }, data });
  }
  /** Stamp the moment subscribers were notified about this post. */
  markNotified(id, at = /* @__PURE__ */ new Date()) {
    return this.db.blogPost.update({ where: { id }, data: { notifiedAt: at } });
  }
  delete(id) {
    return this.db.blogPost.delete({ where: { id } });
  }
};

// ../../packages/database/src/repositories/faq.repository.ts
var FaqRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  create(data) {
    return this.db.faq.create({ data });
  }
  findById(id) {
    return this.db.faq.findUnique({ where: { id } });
  }
  async list({ skip = 0, take = 100, published, category } = {}) {
    const where = {
      ...published !== void 0 ? { published } : {},
      ...category !== void 0 ? { category } : {}
    };
    const [items, total] = await Promise.all([
      this.db.faq.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        skip,
        take
      }),
      this.db.faq.count({ where })
    ]);
    return { items, total };
  }
  update(id, data) {
    return this.db.faq.update({ where: { id }, data });
  }
  delete(id) {
    return this.db.faq.delete({ where: { id } });
  }
};

// ../../packages/database/src/repositories/homepage-section.repository.ts
var HomepageSectionRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  list() {
    return this.db.homepageSection.findMany({ orderBy: { order: "asc" } });
  }
  listEnabled() {
    return this.db.homepageSection.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" }
    });
  }
  findById(id) {
    return this.db.homepageSection.findUnique({ where: { id } });
  }
  findByKey(key) {
    return this.db.homepageSection.findUnique({ where: { key } });
  }
  /** Create the section if its key is new, otherwise update it. */
  upsert({ key, ...rest }) {
    return this.db.homepageSection.upsert({
      where: { key },
      create: { key, ...rest },
      update: rest
    });
  }
  update(id, data) {
    return this.db.homepageSection.update({ where: { id }, data });
  }
  delete(id) {
    return this.db.homepageSection.delete({ where: { id } });
  }
};

// ../../packages/database/src/repositories/lead.repository.ts
var LeadRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  create(data) {
    return this.db.lead.create({ data });
  }
  findById(id) {
    return this.db.lead.findUnique({
      where: { id },
      include: {
        notes: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { id: true, name: true } } }
        },
        assignedTo: { select: { id: true, name: true } }
      }
    });
  }
  async list({ skip = 0, take = 20, status } = {}) {
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.db.lead.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      this.db.lead.count({ where })
    ]);
    return { items, total };
  }
  /** Count leads created on/after `since` - used by the reminder digest. */
  countSince(since) {
    return this.db.lead.count({ where: { createdAt: { gte: since } } });
  }
  update(id, data) {
    return this.db.lead.update({ where: { id }, data });
  }
  addNote(leadId, authorId, body) {
    return this.db.leadNote.create({ data: { leadId, authorId, body } });
  }
};

// ../../packages/database/src/repositories/media.repository.ts
var MediaRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  create(data) {
    return this.db.media.create({ data });
  }
  findById(id) {
    return this.db.media.findUnique({ where: { id } });
  }
  findByKey(key) {
    return this.db.media.findUnique({ where: { key } });
  }
  async list({ skip = 0, take = 20, folderId } = {}) {
    const where = folderId === void 0 ? {} : { folderId };
    const [items, total] = await Promise.all([
      this.db.media.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      this.db.media.count({ where })
    ]);
    return { items, total };
  }
  delete(id) {
    return this.db.media.delete({ where: { id } });
  }
};

// ../../packages/database/src/repositories/newsletter.repository.ts
var NewsletterRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  findByEmail(email) {
    return this.db.newsletterSubscriber.findUnique({ where: { email } });
  }
  findByToken(unsubscribeToken) {
    return this.db.newsletterSubscriber.findUnique({ where: { unsubscribeToken } });
  }
  create(data) {
    return this.db.newsletterSubscriber.create({
      data: {
        email: data.email,
        unsubscribeToken: data.unsubscribeToken,
        source: data.source ?? null,
        status: "SUBSCRIBED",
        confirmedAt: /* @__PURE__ */ new Date()
      }
    });
  }
  resubscribe(id) {
    return this.db.newsletterSubscriber.update({
      where: { id },
      data: { status: "SUBSCRIBED", confirmedAt: /* @__PURE__ */ new Date() }
    });
  }
  unsubscribe(id) {
    return this.db.newsletterSubscriber.update({
      where: { id },
      data: { status: "UNSUBSCRIBED" }
    });
  }
  /** Every currently-subscribed recipient (email + unsubscribe token), for broadcasts. */
  listSubscribed() {
    return this.db.newsletterSubscriber.findMany({
      where: { status: "SUBSCRIBED" },
      select: { id: true, email: true, unsubscribeToken: true },
      orderBy: { createdAt: "asc" }
    });
  }
  async list({ skip = 0, take = 50 } = {}) {
    const [items, total] = await Promise.all([
      this.db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, skip, take }),
      this.db.newsletterSubscriber.count()
    ]);
    return { items, total };
  }
};

// ../../packages/database/src/repositories/password-reset.repository.ts
var PasswordResetTokenRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  create(data) {
    return this.db.passwordResetToken.create({ data });
  }
  findByHash(tokenHash) {
    return this.db.passwordResetToken.findUnique({ where: { tokenHash } });
  }
  markUsed(id) {
    return this.db.passwordResetToken.update({ where: { id }, data: { usedAt: /* @__PURE__ */ new Date() } });
  }
  /** Invalidate any outstanding reset tokens for a user (e.g. before issuing a new one). */
  invalidateAllForUser(userId) {
    return this.db.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: /* @__PURE__ */ new Date() }
    });
  }
};

// ../../packages/database/src/repositories/product.repository.ts
var ProductRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  create(data) {
    return this.db.product.create({ data });
  }
  findById(id) {
    return this.db.product.findUnique({ where: { id } });
  }
  findBySlug(slug) {
    return this.db.product.findUnique({ where: { slug } });
  }
  slugExists(slug, exceptId) {
    return this.db.product.findFirst({
      where: { slug, ...exceptId ? { id: { not: exceptId } } : {} },
      select: { id: true }
    });
  }
  async list({ skip = 0, take = 100, published, featured } = {}) {
    const where = {
      ...published !== void 0 ? { published } : {},
      ...featured !== void 0 ? { featured } : {}
    };
    const [items, total] = await Promise.all([
      this.db.product.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        skip,
        take
      }),
      this.db.product.count({ where })
    ]);
    return { items, total };
  }
  update(id, data) {
    return this.db.product.update({ where: { id }, data });
  }
  delete(id) {
    return this.db.product.delete({ where: { id } });
  }
};

// ../../packages/database/src/repositories/project.repository.ts
var ProjectRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  create(data) {
    return this.db.project.create({ data });
  }
  findById(id) {
    return this.db.project.findUnique({ where: { id } });
  }
  findBySlug(slug) {
    return this.db.project.findUnique({ where: { slug } });
  }
  slugExists(slug, exceptId) {
    return this.db.project.findFirst({
      where: { slug, ...exceptId ? { id: { not: exceptId } } : {} },
      select: { id: true }
    });
  }
  async list({ skip = 0, take = 100, published, featured } = {}) {
    const where = {
      ...published !== void 0 ? { published } : {},
      ...featured !== void 0 ? { featured } : {}
    };
    const [items, total] = await Promise.all([
      this.db.project.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        skip,
        take
      }),
      this.db.project.count({ where })
    ]);
    return { items, total };
  }
  update(id, data) {
    return this.db.project.update({ where: { id }, data });
  }
  delete(id) {
    return this.db.project.delete({ where: { id } });
  }
};

// ../../packages/database/src/repositories/refresh-token.repository.ts
var RefreshTokenRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  create(data) {
    return this.db.refreshToken.create({ data });
  }
  findByHash(tokenHash) {
    return this.db.refreshToken.findUnique({ where: { tokenHash } });
  }
  /**
   * Atomically rotate: revoke the old token ONLY IF it is still un-revoked, then
   * issue the replacement. The conditional revoke (updateMany guarded by
   * `revokedAt: null`) prevents a read-then-write race where two concurrent
   * requests with the same token both mint a new one. Returns `null` if the old
   * token was already revoked/rotated (caller should treat as an invalid session).
   */
  rotate(oldId, replacement) {
    return this.db.$transaction(async (tx) => {
      const revoked = await tx.refreshToken.updateMany({
        where: { id: oldId, revokedAt: null },
        data: { revokedAt: /* @__PURE__ */ new Date() }
      });
      if (revoked.count === 0) return null;
      const created = await tx.refreshToken.create({ data: replacement });
      await tx.refreshToken.update({ where: { id: oldId }, data: { replacedById: created.id } });
      return created;
    });
  }
  revoke(id) {
    return this.db.refreshToken.update({ where: { id }, data: { revokedAt: /* @__PURE__ */ new Date() } });
  }
  /** Reuse detected → revoke the whole rotation chain. */
  revokeFamily(family) {
    return this.db.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: /* @__PURE__ */ new Date() }
    });
  }
  revokeAllForUser(userId) {
    return this.db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: /* @__PURE__ */ new Date() }
    });
  }
  /** Housekeeping: drop expired/long-revoked rows. */
  deleteExpired(now = /* @__PURE__ */ new Date()) {
    return this.db.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } });
  }
};

// ../../packages/database/src/repositories/service.repository.ts
var ServiceRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  create(data) {
    return this.db.service.create({ data });
  }
  findById(id) {
    return this.db.service.findUnique({ where: { id } });
  }
  findBySlug(slug) {
    return this.db.service.findUnique({ where: { slug } });
  }
  slugExists(slug, exceptId) {
    return this.db.service.findFirst({
      where: { slug, ...exceptId ? { id: { not: exceptId } } : {} },
      select: { id: true }
    });
  }
  async list({ skip = 0, take = 100, published, featured } = {}) {
    const where = {
      ...published !== void 0 ? { published } : {},
      ...featured !== void 0 ? { featured } : {}
    };
    const [items, total] = await Promise.all([
      this.db.service.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        skip,
        take
      }),
      this.db.service.count({ where })
    ]);
    return { items, total };
  }
  update(id, data) {
    return this.db.service.update({ where: { id }, data });
  }
  delete(id) {
    return this.db.service.delete({ where: { id } });
  }
};

// ../../packages/database/src/repositories/setting.repository.ts
var SettingRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  getGroup(group) {
    return this.db.setting.findUnique({ where: { group } });
  }
  getAll() {
    return this.db.setting.findMany({ orderBy: { group: "asc" } });
  }
  upsertGroup(group, value) {
    return this.db.setting.upsert({
      where: { group },
      create: { group, value },
      update: { value }
    });
  }
};

// ../../packages/database/src/repositories/team-member.repository.ts
var TeamMemberRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  create(data) {
    return this.db.teamMember.create({ data });
  }
  findById(id) {
    return this.db.teamMember.findUnique({ where: { id } });
  }
  async list({ skip = 0, take = 100, published } = {}) {
    const where = published !== void 0 ? { published } : {};
    const [items, total] = await Promise.all([
      this.db.teamMember.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        skip,
        take
      }),
      this.db.teamMember.count({ where })
    ]);
    return { items, total };
  }
  update(id, data) {
    return this.db.teamMember.update({ where: { id }, data });
  }
  delete(id) {
    return this.db.teamMember.delete({ where: { id } });
  }
};

// ../../packages/database/src/repositories/testimonial.repository.ts
var TestimonialRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  create(data) {
    return this.db.testimonial.create({ data });
  }
  findById(id) {
    return this.db.testimonial.findUnique({ where: { id } });
  }
  async list({ skip = 0, take = 100, published, featured } = {}) {
    const where = {
      ...published !== void 0 ? { published } : {},
      ...featured !== void 0 ? { featured } : {}
    };
    const [items, total] = await Promise.all([
      this.db.testimonial.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        skip,
        take
      }),
      this.db.testimonial.count({ where })
    ]);
    return { items, total };
  }
  update(id, data) {
    return this.db.testimonial.update({ where: { id }, data });
  }
  delete(id) {
    return this.db.testimonial.delete({ where: { id } });
  }
};

// ../../packages/database/src/repositories/todo.repository.ts
var TodoRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  create(data) {
    return this.db.todo.create({ data });
  }
  findById(id) {
    return this.db.todo.findUnique({ where: { id } });
  }
  async list({ skip = 0, take = 200, status } = {}) {
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.db.todo.findMany({
        where,
        // Open tasks first, then by due date (nulls last), then newest.
        orderBy: [{ status: "asc" }, { dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
        skip,
        take
      }),
      this.db.todo.count({ where })
    ]);
    return { items, total };
  }
  /** Open (non-DONE) todos with a due date on/before `end`, soonest first. */
  dueWithin(end) {
    return this.db.todo.findMany({
      where: { status: { not: "DONE" }, dueDate: { not: null, lte: end } },
      orderBy: { dueDate: "asc" }
    });
  }
  update(id, data) {
    return this.db.todo.update({ where: { id }, data });
  }
  delete(id) {
    return this.db.todo.delete({ where: { id } });
  }
};

// ../../packages/database/src/repositories/user.repository.ts
var UserRepository = class {
  constructor(db) {
    this.db = db;
  }
  db;
  findByEmail(email) {
    return this.db.user.findUnique({ where: { email } });
  }
  findById(id) {
    return this.db.user.findUnique({ where: { id } });
  }
  create(data) {
    return this.db.user.create({ data });
  }
  updateLastLogin(id) {
    return this.db.user.update({ where: { id }, data: { lastLoginAt: /* @__PURE__ */ new Date() } });
  }
  updatePassword(id, passwordHash) {
    return this.db.user.update({ where: { id }, data: { passwordHash } });
  }
};

// ../../packages/database/src/repositories/index.ts
function createRepositories(db) {
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
    analytics: new AnalyticsRepository(db)
  };
}

// ../../packages/email/src/types.ts
var EmailSendError = class extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = "EmailSendError";
  }
  status;
};
function formatAddress(address) {
  return address.name ? `${address.name} <${address.email}>` : address.email;
}
function toRecipients(value) {
  return Array.isArray(value) ? value : [value];
}

// ../../packages/email/src/providers/console.ts
var ConsoleProvider = class {
  constructor(from) {
    this.from = from;
  }
  from;
  name = "console";
  send(message) {
    console.warn(
      `[email:console] would send "${message.subject}" from ${formatAddress(
        message.from ?? this.from
      )} to ${toRecipients(message.to).join(", ")}`
    );
    return Promise.resolve({ id: `console-${message.subject.length}` });
  }
};

// ../../packages/email/src/providers/resend.ts
var RESEND_ENDPOINT = "https://api.resend.com/emails";
var ResendProvider = class {
  constructor(config3) {
    this.config = config3;
  }
  config;
  name = "resend";
  async send(message) {
    const payload = {
      from: formatAddress(message.from ?? this.config.from),
      to: toRecipients(message.to),
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
      cc: message.cc ? toRecipients(message.cc) : void 0,
      bcc: message.bcc ? toRecipients(message.bcc) : void 0
    };
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new EmailSendError(
        `Resend rejected the message (HTTP ${response.status})${detail ? `: ${detail}` : ""}`,
        response.status
      );
    }
    const data = await response.json();
    return { id: data.id ?? "" };
  }
};

// ../../packages/email/src/factory.ts
function createEmailProvider(config3) {
  switch (config3.provider) {
    case "resend": {
      if (!config3.resendApiKey) {
        throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
      }
      return new ResendProvider({ apiKey: config3.resendApiKey, from: config3.from });
    }
    case "console":
      return new ConsoleProvider(config3.from);
    default: {
      const exhaustive = config3.provider;
      throw new Error(`Unknown email provider: ${String(exhaustive)}`);
    }
  }
}

// ../../packages/email/src/templates.ts
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function layout(opts) {
  const { title, bodyHtml, brand, preheader } = opts;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #e2e8f0;">
                <a href="${brand.siteUrl}" style="font-size:18px;font-weight:700;color:#4f46e5;text-decoration:none;">${escapeHtml(brand.companyName)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-size:15px;line-height:1.6;color:#334155;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
                \xA9 ${brand.companyName} \xB7 <a href="${brand.siteUrl}" style="color:#94a3b8;">${escapeHtml(brand.siteUrl)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
function button(label, href) {
  return `<a href="${href}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:12px;">${escapeHtml(label)}</a>`;
}
function passwordResetEmail(opts) {
  const { resetUrl, expiresMinutes, brand } = opts;
  const subject = `Reset your ${brand.companyName} password`;
  const html = layout({
    title: subject,
    brand,
    preheader: `This link expires in ${expiresMinutes} minutes.`,
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Reset your password</h1>
      <p style="margin:0 0 20px;">We received a request to reset your password. Click below to choose a new one. This link expires in ${expiresMinutes} minutes.</p>
      <p style="margin:0 0 24px;">${button("Reset password", resetUrl)}</p>
      <p style="margin:0;color:#64748b;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>`
  });
  const text = `Reset your ${brand.companyName} password

Open this link (expires in ${expiresMinutes} minutes):
${resetUrl}

If you didn't request this, ignore this email.`;
  return { subject, html, text };
}
function leadConfirmationEmail(opts) {
  const { name, brand } = opts;
  const subject = `Thanks for reaching out to ${brand.companyName}`;
  const html = layout({
    title: subject,
    brand,
    preheader: "We received your message and will reply shortly.",
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Thanks, ${escapeHtml(name)} \u{1F44B}</h1>
      <p style="margin:0 0 20px;">We've received your message and a member of our team will get back to you shortly - usually within one business day.</p>
      <p style="margin:0;color:#64748b;font-size:13px;">- The ${escapeHtml(brand.companyName)} team</p>`
  });
  const text = `Thanks, ${name}!

We've received your message and will get back to you shortly.

- The ${brand.companyName} team`;
  return { subject, html, text };
}
function dailyDigestEmail(opts) {
  const { overdue, dueToday, upcoming, newLeads, adminUrl, brand } = opts;
  const subject = `Your ${brand.companyName} daily digest`;
  const taskList = (items) => items.map(
    (t) => `<li style="margin:0 0 6px;"><strong>${escapeHtml(t.title)}</strong> <span style="color:#94a3b8;">\xB7 ${escapeHtml(t.dueDate)}</span></li>`
  ).join("");
  const section = (heading, items, color) => items.length ? `<h2 style="margin:20px 0 8px;font-size:15px;color:${color};">${escapeHtml(heading)} (${items.length})</h2><ul style="margin:0;padding-left:18px;">${taskList(items)}</ul>` : "";
  const nothing = !overdue.length && !dueToday.length && !upcoming.length;
  const html = layout({
    title: subject,
    brand,
    preheader: `${overdue.length} overdue \xB7 ${dueToday.length} due today \xB7 ${newLeads} new lead(s)`,
    bodyHtml: `
      <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Daily digest</h1>
      <p style="margin:0 0 8px;color:#334155;">${newLeads} new lead${newLeads === 1 ? "" : "s"} in the last 24 hours.</p>
      ${section("Overdue", overdue, "#dc2626")}
      ${section("Due today", dueToday, "#b45309")}
      ${section("Coming up", upcoming, "#4f46e5")}
      ${nothing ? `<p style="margin:16px 0;color:#64748b;">No tasks need attention today. \u{1F389}</p>` : ""}
      <p style="margin:24px 0 0;">${button("Open admin", adminUrl)}</p>`
  });
  const lines = (label, items) => items.length ? `
${label}:
${items.map((t) => `  - ${t.title} (${t.dueDate})`).join("\n")}
` : "";
  const text = `Daily digest

${newLeads} new lead(s) in the last 24h.
${lines("Overdue", overdue)}${lines("Due today", dueToday)}${lines("Coming up", upcoming)}
Open admin: ${adminUrl}`;
  return { subject, html, text };
}
function newPostEmail(opts) {
  const { post, unsubscribeUrl, brand } = opts;
  const subject = `New from ${brand.companyName}: ${post.title}`;
  const cover = post.coverImage ? `<img src="${post.coverImage}" alt="" width="100%" style="display:block;border-radius:12px;margin:0 0 20px;max-width:100%;" />` : "";
  const html = layout({
    title: subject,
    brand,
    preheader: post.excerpt,
    bodyHtml: `
      ${cover}
      <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">${escapeHtml(post.title)}</h1>
      <p style="margin:0 0 24px;">${escapeHtml(post.excerpt)}</p>
      <p style="margin:0 0 8px;">${button("Read the post", post.url)}</p>
      <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
        You're receiving this because you subscribed to ${escapeHtml(brand.companyName)} updates.
        <a href="${unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe</a>.
      </p>`
  });
  const text = `${post.title}

${post.excerpt}

Read the post: ${post.url}

\u2014
Unsubscribe: ${unsubscribeUrl}`;
  return { subject, html, text };
}
function leadNotificationEmail(opts) {
  const { lead, adminUrl, brand } = opts;
  const subject = `New lead: ${lead.name}${lead.company ? ` (${lead.company})` : ""}`;
  const html = layout({
    title: subject,
    brand,
    preheader: `${lead.name} just submitted the contact form.`,
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">New lead</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;">
        <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Name</td><td>${escapeHtml(lead.name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Email</td><td>${escapeHtml(lead.email)}</td></tr>
        ${lead.company ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b;">Company</td><td>${escapeHtml(lead.company)}</td></tr>` : ""}
        ${lead.source ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b;">Source</td><td>${escapeHtml(lead.source)}</td></tr>` : ""}
      </table>
      <p style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:12px;white-space:pre-wrap;">${escapeHtml(lead.message)}</p>
      <p style="margin:0 0 4px;">${button("Open in admin", adminUrl)}</p>`
  });
  const text = `New lead

Name: ${lead.name}
Email: ${lead.email}${lead.company ? `
Company: ${lead.company}` : ""}${lead.source ? `
Source: ${lead.source}` : ""}

${lead.message}

Open admin: ${adminUrl}`;
  return { subject, html, text };
}

// ../../packages/auth/src/password.ts
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
var N = 2 ** 15;
var R = 8;
var P = 1;
var DK_LEN = 32;
var SALT_BYTES = 16;
function encode(value) {
  return new TextEncoder().encode(value);
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const dk = await scryptAsync(encode(password), salt, { N, r: R, p: P, dkLen: DK_LEN });
  return `scrypt$${N}$${R}$${P}$${bytesToHex(salt)}$${bytesToHex(dk)}`;
}
async function verifyPassword(password, stored) {
  const [scheme, nStr, rStr, pStr, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !nStr || !rStr || !pStr || !saltHex || !hashHex) return false;
  const n = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  let salt;
  let expected;
  try {
    salt = hexToBytes(saltHex);
    expected = hexToBytes(hashHex);
  } catch {
    return false;
  }
  const derived = await scryptAsync(encode(password), salt, { N: n, r, p, dkLen: expected.length });
  return timingSafeEqual(derived, expected);
}

// ../../packages/auth/src/tokens.ts
import { bytesToHex as bytesToHex2 } from "@noble/hashes/utils.js";
import { SignJWT, jwtVerify } from "jose";
var ACCESS_ALG = "HS256";
function secretKey(secret) {
  return new TextEncoder().encode(secret);
}
function isRole(value) {
  return value === "SUPER_ADMIN" || value === "ADMIN" || value === "EDITOR";
}
function signAccessToken(opts) {
  return new SignJWT({ role: opts.role }).setProtectedHeader({ alg: ACCESS_ALG }).setSubject(opts.userId).setIssuedAt().setJti(opts.jti).setExpirationTime(opts.expiresIn ?? "15m").sign(secretKey(opts.secret));
}
async function verifyAccessToken(token, secret) {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret), { algorithms: [ACCESS_ALG] });
    if (typeof payload.sub !== "string" || typeof payload.jti !== "string" || !isRole(payload.role)) {
      return null;
    }
    return { sub: payload.sub, role: payload.role, jti: payload.jti };
  } catch {
    return null;
  }
}
function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function generateOpaqueToken(bytes = 32) {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}
function generateId(bytes = 16) {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}
async function hashToken(token, secret) {
  const enc = new TextEncoder();
  if (secret) {
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, enc.encode(token));
    return bytesToHex2(new Uint8Array(signature));
  }
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(token));
  return bytesToHex2(new Uint8Array(digest));
}

// ../../packages/auth/src/rbac.ts
var RANK = {
  EDITOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3
};
function hasRole(role, required) {
  return RANK[role] >= RANK[required];
}

// src/lib/errors.ts
var AppError = class extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = new.target.name;
  }
  status;
  code;
  details;
};
var BadRequestError = class extends AppError {
  constructor(message = "Bad request", details) {
    super(400, "BAD_REQUEST", message, details);
  }
};
var UnauthorizedError = class extends AppError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
  }
};
var ForbiddenError = class extends AppError {
  constructor(message = "Forbidden") {
    super(403, "FORBIDDEN", message);
  }
};
var NotFoundError = class extends AppError {
  constructor(message = "Not found") {
    super(404, "NOT_FOUND", message);
  }
};
var ConflictError = class extends AppError {
  constructor(message = "Conflict") {
    super(409, "CONFLICT", message);
  }
};
var TooManyRequestsError = class extends AppError {
  constructor(message = "Too many requests") {
    super(429, "TOO_MANY_REQUESTS", message);
  }
};

// src/modules/auth/auth.service.ts
var ACCESS_TTL = "15m";
var REFRESH_TTL_MS = 60 * 60 * 24 * 30 * 1e3;
var RESET_TTL_MINUTES = 30;
function toPublicUser(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
var dummyHashPromise;
function dummyHash() {
  dummyHashPromise ??= hashPassword("not-a-real-password-placeholder");
  return dummyHashPromise;
}
var AuthService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  /** HMAC-hash an opaque token with the server pepper for at-rest storage and lookup. */
  hash(token) {
    return hashToken(token, this.deps.config.jwt.refreshSecret);
  }
  async mintTokens(user, family, ctx) {
    const accessToken = await signAccessToken({
      userId: user.id,
      role: user.role,
      secret: this.deps.config.jwt.accessSecret,
      jti: generateId(),
      expiresIn: ACCESS_TTL
    });
    const refreshToken = generateOpaqueToken();
    await this.deps.repos.refreshTokens.create({
      userId: user.id,
      tokenHash: await this.hash(refreshToken),
      family,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      userAgent: ctx.userAgent ?? null,
      ip: ctx.ip ?? null
    });
    return { accessToken, refreshToken };
  }
  async login(input, ctx) {
    const user = await this.deps.repos.users.findByEmail(input.email);
    const hash = user?.passwordHash ?? await dummyHash();
    const passwordOk = await verifyPassword(input.password, hash);
    if (!user || !passwordOk || !user.isActive) {
      throw new UnauthorizedError("Invalid email or password");
    }
    await this.deps.repos.users.updateLastLogin(user.id);
    const tokens = await this.mintTokens(user, generateId(), ctx);
    return { user: toPublicUser(user), ...tokens };
  }
  async refresh(rawToken, ctx) {
    const tokenHash = await this.hash(rawToken);
    const existing = await this.deps.repos.refreshTokens.findByHash(tokenHash);
    if (!existing) throw new UnauthorizedError("Invalid session");
    if (existing.revokedAt) {
      await this.deps.repos.refreshTokens.revokeFamily(existing.family);
      throw new UnauthorizedError("Session reuse detected");
    }
    if (existing.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError("Session expired");
    }
    const user = await this.deps.repos.users.findById(existing.userId);
    if (!user || !user.isActive) throw new UnauthorizedError("Account unavailable");
    const refreshToken = generateOpaqueToken();
    const rotated = await this.deps.repos.refreshTokens.rotate(existing.id, {
      userId: user.id,
      tokenHash: await this.hash(refreshToken),
      family: existing.family,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      userAgent: ctx.userAgent ?? null,
      ip: ctx.ip ?? null
    });
    if (!rotated) throw new UnauthorizedError("Session is no longer valid");
    const accessToken = await signAccessToken({
      userId: user.id,
      role: user.role,
      secret: this.deps.config.jwt.accessSecret,
      jti: generateId(),
      expiresIn: ACCESS_TTL
    });
    return { user: toPublicUser(user), accessToken, refreshToken };
  }
  async logout(rawToken) {
    if (!rawToken) return;
    const existing = await this.deps.repos.refreshTokens.findByHash(await this.hash(rawToken));
    if (existing && !existing.revokedAt) {
      await this.deps.repos.refreshTokens.revoke(existing.id);
    }
  }
  async me(userId) {
    const user = await this.deps.repos.users.findById(userId);
    if (!user) throw new UnauthorizedError();
    return toPublicUser(user);
  }
  /** Always resolves the same way regardless of whether the email exists. */
  async forgotPassword(email) {
    const user = await this.deps.repos.users.findByEmail(email);
    if (!user || !user.isActive) return;
    await this.deps.repos.passwordResets.invalidateAllForUser(user.id);
    const rawToken = generateOpaqueToken();
    await this.deps.repos.passwordResets.create({
      userId: user.id,
      tokenHash: await this.hash(rawToken),
      expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1e3)
    });
    const resetUrl = `${this.deps.config.adminUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const mail = passwordResetEmail({
      resetUrl,
      expiresMinutes: RESET_TTL_MINUTES,
      brand: { companyName: "Strophic", siteUrl: this.deps.config.siteUrl }
    });
    try {
      await this.deps.email.send({
        to: user.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text
      });
    } catch (error) {
      console.error("[auth] password reset email failed:", error);
    }
  }
  async resetPassword(token, newPassword) {
    const record = await this.deps.repos.passwordResets.findByHash(await this.hash(token));
    if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestError("Invalid or expired reset token");
    }
    const user = await this.deps.repos.users.findById(record.userId);
    if (!user || !user.isActive) {
      throw new BadRequestError("Invalid or expired reset token");
    }
    await this.deps.repos.users.updatePassword(record.userId, await hashPassword(newPassword));
    await this.deps.repos.passwordResets.markUsed(record.id);
    await this.deps.repos.refreshTokens.revokeAllForUser(record.userId);
  }
  /** Authenticated password change. Verifies the current password, then revokes all sessions. */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.deps.repos.users.findById(userId);
    if (!user) throw new UnauthorizedError();
    const ok2 = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok2) throw new BadRequestError("Current password is incorrect");
    await this.deps.repos.users.updatePassword(userId, await hashPassword(newPassword));
    await this.deps.repos.refreshTokens.revokeAllForUser(userId);
  }
};

// src/modules/analytics/analytics.service.ts
import { createHash } from "node:crypto";
var sha256 = (input) => createHash("sha256").update(input).digest("hex");
function referrerHost(referrer) {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname || null;
  } catch {
    return referrer.slice(0, 120);
  }
}
var AnalyticsService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  /**
   * A daily-rotating salt: the same visitor produces the same hash within a day,
   * but cannot be correlated across days. Derived from a server secret so it is
   * never guessable by a client.
   */
  dailySalt(now) {
    const ymd2 = now.toISOString().slice(0, 10);
    return sha256(`${this.deps.config.jwt.refreshSecret}:analytics:${ymd2}`);
  }
  visitorHash(ip, userAgent, now) {
    if (!ip) return null;
    return sha256(`${this.dailySalt(now)}:${ip}:${userAgent ?? ""}`);
  }
  async track(input, ctx) {
    await this.deps.repos.analytics.create({
      type: input.type,
      name: input.name ?? null,
      path: input.path,
      referrer: referrerHost(input.referrer),
      visitorHash: this.visitorHash(ctx.ip, ctx.userAgent, /* @__PURE__ */ new Date()),
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null
    });
  }
  /** Aggregated dashboard data for the last `days` days. */
  async dashboard(days) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1e3);
    const [summary, daily, topPaths, topReferrers] = await Promise.all([
      this.deps.repos.analytics.summary(since),
      this.deps.repos.analytics.dailyPageviews(since),
      this.deps.repos.analytics.topPaths(since, 10),
      this.deps.repos.analytics.topReferrers(since, 8)
    ]);
    return { days, summary, daily, topPaths, topReferrers };
  }
};

// ../../packages/utils/src/homepage-sections.ts
var eyebrow = {
  name: "eyebrow",
  description: 'Small label shown above the title (e.g. "What we do").'
};
var HOMEPAGE_SECTIONS = [
  {
    key: "hero",
    label: "Hero (top banner)",
    description: "The first screen visitors see. Title overrides the big headline; Subtitle overrides the line beneath it.",
    title: "Main headline (plain text - the styled default is used when left blank)",
    subtitle: "Supporting line under the headline",
    config: [{ name: "badge", description: 'The small pill above the headline (e.g. "Available for new projects").' }],
    sampleConfig: { badge: "Available for new projects" }
  },
  {
    key: "services",
    label: "Services grid",
    description: "The grid of services (cards come from the Services CMS). This controls the heading; disable to hide the whole block.",
    title: "Section title",
    subtitle: "Intro paragraph under the title",
    config: [eyebrow],
    sampleConfig: { eyebrow: "What we do" }
  },
  {
    key: "why-us",
    label: '"Why Strophic" block',
    description: "The four differentiators block. Controls its heading; disable to hide it.",
    title: "Section title",
    subtitle: "Intro paragraph",
    config: [eyebrow],
    sampleConfig: { eyebrow: "Why Strophic" }
  },
  {
    key: "industries",
    label: "Industries block",
    description: "The 'who we help' industries grid. Controls its heading; disable to hide it.",
    title: "Section title",
    subtitle: "Intro paragraph",
    config: [eyebrow],
    sampleConfig: { eyebrow: "Who we help" }
  },
  {
    key: "process",
    label: "Process block",
    description: "The 'how we work' four-step process. Controls its heading; disable to hide it.",
    title: "Section title",
    subtitle: "Intro paragraph",
    config: [eyebrow],
    sampleConfig: { eyebrow: "How we work" }
  },
  {
    key: "featured-work",
    label: "Featured work",
    description: "The selected case studies grid (uses Projects marked Featured). Controls its heading; disable to hide it.",
    title: "Section title",
    subtitle: "Intro paragraph",
    config: [eyebrow],
    sampleConfig: { eyebrow: "Selected work" }
  },
  {
    key: "featured-products",
    label: "Featured products",
    description: "The Micro-SaaS products grid (uses Products marked Featured). Controls its heading; disable to hide it.",
    title: "Section title",
    subtitle: "Intro paragraph",
    config: [eyebrow],
    sampleConfig: { eyebrow: "Our products" }
  },
  {
    key: "testimonials",
    label: "Testimonials",
    description: "The testimonials grid (uses Testimonials marked Featured). Controls its heading; disable to hide it.",
    title: "Section title",
    subtitle: "Intro paragraph",
    config: [eyebrow],
    sampleConfig: { eyebrow: "In their words" }
  },
  {
    key: "newsletter",
    label: "Newsletter block",
    description: "The newsletter signup band. Title/Subtitle set the heading and copy; disable to hide it.",
    title: "Heading",
    subtitle: "Supporting copy",
    config: [{ name: "badge", description: 'The small pill label (e.g. "Newsletter").' }],
    sampleConfig: { badge: "Newsletter" }
  },
  {
    key: "cta",
    label: "Call to action (bottom)",
    description: "The closing call-to-action band. Title/Subtitle set the heading; config sets the buttons.",
    title: "CTA heading",
    subtitle: "CTA supporting text",
    config: [
      { name: "primaryLabel", description: "Primary button text." },
      { name: "primaryHref", description: "Primary button link (e.g. /contact)." },
      { name: "secondaryLabel", description: "Secondary button text." },
      { name: "secondaryHref", description: "Secondary button link (e.g. /work)." }
    ],
    sampleConfig: {
      primaryLabel: "Start a project",
      primaryHref: "/contact",
      secondaryLabel: "See our work",
      secondaryHref: "/work"
    }
  }
];
var HOMEPAGE_SECTION_KEYS = HOMEPAGE_SECTIONS.map((s) => s.key);

// ../../packages/utils/src/index.ts
function readingTimeMinutes(text, wordsPerMinute = 200) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// src/modules/blog/blog.service.ts
function nextPublishedAt(status, current) {
  if (status === "PUBLISHED") return current ?? /* @__PURE__ */ new Date();
  if (status === "DRAFT") return null;
  return current;
}
var BlogService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async create(input, authorId) {
    if (await this.deps.repos.blog.slugExists(input.slug)) {
      throw new ConflictError("A post with that slug already exists");
    }
    return this.deps.repos.blog.create({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      coverImage: input.coverImage ?? null,
      category: input.category,
      tags: input.tags,
      status: input.status,
      readingTime: readingTimeMinutes(input.content),
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      authorId,
      publishedAt: input.status === "PUBLISHED" ? /* @__PURE__ */ new Date() : null
    });
  }
  async update(id, input) {
    const existing = await this.deps.repos.blog.findById(id);
    if (!existing) throw new NotFoundError("Post not found");
    if (input.slug && input.slug !== existing.slug && await this.deps.repos.blog.slugExists(input.slug, id)) {
      throw new ConflictError("A post with that slug already exists");
    }
    return this.deps.repos.blog.update(id, {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      coverImage: input.coverImage,
      category: input.category,
      tags: input.tags,
      status: input.status,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      ...input.content !== void 0 ? { readingTime: readingTimeMinutes(input.content) } : {},
      ...input.status !== void 0 ? { publishedAt: nextPublishedAt(input.status, existing.publishedAt) } : {}
    });
  }
  async get(id) {
    const post = await this.deps.repos.blog.findById(id);
    if (!post) throw new NotFoundError("Post not found");
    return post;
  }
  list(opts) {
    return this.deps.repos.blog.list(opts);
  }
  async remove(id) {
    await this.get(id);
    await this.deps.repos.blog.delete(id);
  }
  /**
   * Email every current subscriber a "new post" notification for a published post.
   * Sends are best-effort and counted; a few provider failures don't fail the batch.
   * Refuses to re-send an already-notified post unless `force` is set. Marks the post
   * as notified on completion so the admin can see (and the next click can guard against
   * an accidental re-blast).
   */
  async notify(id, opts = {}) {
    const post = await this.deps.repos.blog.findById(id);
    if (!post) throw new NotFoundError("Post not found");
    if (post.status !== "PUBLISHED") {
      throw new BadRequestError("Only published posts can be sent to subscribers");
    }
    if (post.notifiedAt && !opts.force) {
      throw new ConflictError("Subscribers were already notified for this post");
    }
    const subscribers = await this.deps.repos.newsletter.listSubscribed();
    const brand = { companyName: "Strophic", siteUrl: this.deps.config.siteUrl };
    const postUrl = `${this.deps.config.siteUrl}/blog/${post.slug}`;
    let sent = 0;
    let failed = 0;
    for (const sub of subscribers) {
      const unsubscribeUrl = `${this.deps.config.apiUrl}/api/v1/newsletter/unsubscribe?token=${sub.unsubscribeToken}`;
      try {
        await this.deps.email.send({
          to: sub.email,
          ...newPostEmail({
            post: { title: post.title, excerpt: post.excerpt, url: postUrl, coverImage: post.coverImage },
            unsubscribeUrl,
            brand
          })
        });
        sent += 1;
      } catch (error) {
        failed += 1;
        console.error(`[blog] notify email failed for ${sub.email}:`, error);
      }
    }
    await this.deps.repos.blog.markNotified(id);
    return { total: subscribers.length, sent, failed };
  }
  // ── Public ──
  listPublished(opts) {
    return this.deps.repos.blog.listPublished(opts);
  }
  async getPublishedBySlug(slug) {
    const post = await this.deps.repos.blog.findBySlug(slug);
    if (!post || post.status !== "PUBLISHED") throw new NotFoundError("Post not found");
    return post;
  }
};

// src/modules/content/faq.service.ts
var FaqService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  create(input) {
    return this.deps.repos.faqs.create({
      question: input.question,
      answer: input.answer,
      category: input.category ?? null,
      published: input.published,
      order: input.order
    });
  }
  async update(id, input) {
    await this.get(id);
    return this.deps.repos.faqs.update(id, input);
  }
  async get(id) {
    const item = await this.deps.repos.faqs.findById(id);
    if (!item) throw new NotFoundError("FAQ not found");
    return item;
  }
  list(opts) {
    return this.deps.repos.faqs.list(opts);
  }
  async remove(id) {
    await this.get(id);
    await this.deps.repos.faqs.delete(id);
  }
  // ── Public ──
  listPublished() {
    return this.deps.repos.faqs.list({ published: true, take: 100 });
  }
};

// src/modules/content/homepage.service.ts
var HomepageService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  list() {
    return this.deps.repos.homepageSections.list();
  }
  /** Create-or-update by stable `key`. */
  upsert(input) {
    return this.deps.repos.homepageSections.upsert({
      ...input,
      config: input.config
    });
  }
  async update(id, input) {
    await this.get(id);
    const { config: config3, ...rest } = input;
    return this.deps.repos.homepageSections.update(id, {
      ...rest,
      ...config3 !== void 0 ? { config: config3 } : {}
    });
  }
  async get(id) {
    const item = await this.deps.repos.homepageSections.findById(id);
    if (!item) throw new NotFoundError("Homepage section not found");
    return item;
  }
  async remove(id) {
    await this.get(id);
    await this.deps.repos.homepageSections.delete(id);
  }
  // ── Public ──
  listEnabled() {
    return this.deps.repos.homepageSections.listEnabled();
  }
};

// src/modules/content/product.service.ts
var ProductService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async create(input) {
    if (await this.deps.repos.products.slugExists(input.slug)) {
      throw new ConflictError("A product with that slug already exists");
    }
    return this.deps.repos.products.create(input);
  }
  async update(id, input) {
    const existing = await this.get(id);
    if (input.slug && input.slug !== existing.slug && await this.deps.repos.products.slugExists(input.slug, id)) {
      throw new ConflictError("A product with that slug already exists");
    }
    return this.deps.repos.products.update(id, input);
  }
  async get(id) {
    const item = await this.deps.repos.products.findById(id);
    if (!item) throw new NotFoundError("Product not found");
    return item;
  }
  list(opts) {
    return this.deps.repos.products.list(opts);
  }
  async remove(id) {
    await this.get(id);
    await this.deps.repos.products.delete(id);
  }
  // ── Public ──
  listPublished() {
    return this.deps.repos.products.list({ published: true, take: 100 });
  }
  async getPublishedBySlug(slug) {
    const item = await this.deps.repos.products.findBySlug(slug);
    if (!item || !item.published) throw new NotFoundError("Product not found");
    return item;
  }
};

// src/modules/content/project.service.ts
var ProjectService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async create(input) {
    if (await this.deps.repos.projects.slugExists(input.slug)) {
      throw new ConflictError("A project with that slug already exists");
    }
    return this.deps.repos.projects.create(input);
  }
  async update(id, input) {
    const existing = await this.get(id);
    if (input.slug && input.slug !== existing.slug && await this.deps.repos.projects.slugExists(input.slug, id)) {
      throw new ConflictError("A project with that slug already exists");
    }
    return this.deps.repos.projects.update(id, input);
  }
  async get(id) {
    const item = await this.deps.repos.projects.findById(id);
    if (!item) throw new NotFoundError("Project not found");
    return item;
  }
  list(opts) {
    return this.deps.repos.projects.list(opts);
  }
  async remove(id) {
    await this.get(id);
    await this.deps.repos.projects.delete(id);
  }
  // ── Public ──
  listPublished() {
    return this.deps.repos.projects.list({ published: true, take: 100 });
  }
  async getPublishedBySlug(slug) {
    const item = await this.deps.repos.projects.findBySlug(slug);
    if (!item || !item.published) throw new NotFoundError("Project not found");
    return item;
  }
};

// src/modules/content/service-offering.service.ts
var ServiceOfferingService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async create(input) {
    if (await this.deps.repos.services.slugExists(input.slug)) {
      throw new ConflictError("A service with that slug already exists");
    }
    return this.deps.repos.services.create({
      ...input,
      workflow: input.workflow,
      faqs: input.faqs
    });
  }
  async update(id, input) {
    const existing = await this.get(id);
    if (input.slug && input.slug !== existing.slug && await this.deps.repos.services.slugExists(input.slug, id)) {
      throw new ConflictError("A service with that slug already exists");
    }
    return this.deps.repos.services.update(id, {
      ...input,
      ...input.workflow !== void 0 ? { workflow: input.workflow } : {},
      ...input.faqs !== void 0 ? { faqs: input.faqs } : {}
    });
  }
  async get(id) {
    const item = await this.deps.repos.services.findById(id);
    if (!item) throw new NotFoundError("Service not found");
    return item;
  }
  list(opts) {
    return this.deps.repos.services.list(opts);
  }
  async remove(id) {
    await this.get(id);
    await this.deps.repos.services.delete(id);
  }
  // ── Public ──
  listPublished() {
    return this.deps.repos.services.list({ published: true, take: 100 });
  }
  async getPublishedBySlug(slug) {
    const item = await this.deps.repos.services.findBySlug(slug);
    if (!item || !item.published) throw new NotFoundError("Service not found");
    return item;
  }
};

// src/modules/content/team.service.ts
var TeamService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  create(input) {
    return this.deps.repos.team.create({
      ...input,
      links: input.links
    });
  }
  async update(id, input) {
    await this.get(id);
    return this.deps.repos.team.update(id, {
      ...input,
      ...input.links !== void 0 ? { links: input.links } : {}
    });
  }
  async get(id) {
    const item = await this.deps.repos.team.findById(id);
    if (!item) throw new NotFoundError("Team member not found");
    return item;
  }
  list(opts) {
    return this.deps.repos.team.list(opts);
  }
  async remove(id) {
    await this.get(id);
    await this.deps.repos.team.delete(id);
  }
  // ── Public ──
  listPublished() {
    return this.deps.repos.team.list({ published: true, take: 100 });
  }
};

// src/modules/content/testimonial.service.ts
var TestimonialService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  create(input) {
    return this.deps.repos.testimonials.create({
      quote: input.quote,
      author: input.author,
      role: input.role,
      company: input.company,
      avatarUrl: input.avatarUrl ?? null,
      rating: input.rating ?? null,
      featured: input.featured,
      published: input.published,
      order: input.order
    });
  }
  async update(id, input) {
    await this.get(id);
    return this.deps.repos.testimonials.update(id, input);
  }
  async get(id) {
    const item = await this.deps.repos.testimonials.findById(id);
    if (!item) throw new NotFoundError("Testimonial not found");
    return item;
  }
  list(opts) {
    return this.deps.repos.testimonials.list(opts);
  }
  async remove(id) {
    await this.get(id);
    await this.deps.repos.testimonials.delete(id);
  }
  // ── Public ──
  listPublished() {
    return this.deps.repos.testimonials.list({ published: true, take: 100 });
  }
};

// src/modules/content/todo.service.ts
function completedAtFor(status) {
  if (status === void 0) return void 0;
  return status === "DONE" ? /* @__PURE__ */ new Date() : null;
}
var TodoService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  create(input) {
    return this.deps.repos.todos.create({
      ...input,
      completedAt: input.status === "DONE" ? /* @__PURE__ */ new Date() : null
    });
  }
  async update(id, input) {
    const existing = await this.get(id);
    const completedAt = input.status !== void 0 && input.status !== existing.status ? completedAtFor(input.status) : void 0;
    return this.deps.repos.todos.update(id, {
      ...input,
      ...completedAt !== void 0 ? { completedAt } : {}
    });
  }
  async get(id) {
    const item = await this.deps.repos.todos.findById(id);
    if (!item) throw new NotFoundError("Todo not found");
    return item;
  }
  list(opts) {
    return this.deps.repos.todos.list(opts);
  }
  async remove(id) {
    await this.get(id);
    await this.deps.repos.todos.delete(id);
  }
};

// src/modules/leads/lead.service.ts
var SOURCE_MAP = {
  instagram: "INSTAGRAM",
  x: "X",
  twitter: "X",
  linkedin: "LINKEDIN",
  google: "GOOGLE",
  referral: "REFERRAL",
  direct: "DIRECT"
};
function mapSource(source) {
  if (!source) return "DIRECT";
  return SOURCE_MAP[source.toLowerCase()] ?? "OTHER";
}
var LeadService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  /** Persist a contact submission and fire confirmation + notification emails (best-effort). */
  async submit(input, meta) {
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
      ...input.utm ? { utm: input.utm } : {}
    });
    await this.sendNotifications(input);
    return { id: lead.id };
  }
  // Email failures must never fail the submission (the lead is already saved).
  async sendNotifications(input) {
    const brand = { companyName: "Strophic", siteUrl: this.deps.config.siteUrl };
    try {
      await this.deps.email.send({
        to: input.email,
        ...leadConfirmationEmail({ name: input.name, brand })
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
            source: input.source
          },
          adminUrl: this.deps.config.adminUrl,
          brand
        })
      });
    } catch (error) {
      console.error("[leads] notification email failed:", error);
    }
  }
  // ── Admin ──
  list(opts) {
    return this.deps.repos.leads.list(opts);
  }
  async get(id) {
    const lead = await this.deps.repos.leads.findById(id);
    if (!lead) throw new NotFoundError("Lead not found");
    return lead;
  }
  async update(id, data) {
    await this.get(id);
    return this.deps.repos.leads.update(id, data);
  }
  async addNote(id, authorId, body) {
    await this.get(id);
    return this.deps.repos.leads.addNote(id, authorId, body);
  }
};

// ../../packages/validation/src/common.ts
import { z } from "zod";
var paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});
var idParamSchema = z.object({
  id: z.string().min(1, "id is required")
});
var slugParamSchema = z.object({
  slug: z.string().min(1, "slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase, hyphenated slug")
});

// ../../packages/validation/src/auth.ts
import { z as z2 } from "zod";
var passwordSchema = z2.string().min(10, "Password must be at least 10 characters").max(128, "Password must be at most 128 characters");
var loginSchema = z2.object({
  email: z2.email().trim().toLowerCase(),
  password: z2.string().min(1, "Password is required")
});
var forgotPasswordSchema = z2.object({
  email: z2.email().trim().toLowerCase()
});
var resetPasswordSchema = z2.object({
  token: z2.string().min(1, "Reset token is required"),
  password: passwordSchema
});
var changePasswordSchema = z2.object({
  currentPassword: z2.string().min(1, "Current password is required"),
  newPassword: passwordSchema
});

// ../../packages/validation/src/settings.ts
import { z as z3 } from "zod";
var settingsGroupSchema = z3.enum(["company", "social", "email", "seo", "theme"]);
var updateSettingsSchema = z3.object({
  group: settingsGroupSchema,
  value: z3.record(z3.string(), z3.unknown())
});

// ../../packages/validation/src/media.ts
import { z as z4 } from "zod";
var MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
var ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif"
];
var presignUploadSchema = z4.object({
  filename: z4.string().min(1).max(255),
  contentType: z4.enum(ALLOWED_IMAGE_MIME_TYPES),
  size: z4.number().int().positive().max(MAX_UPLOAD_BYTES, `File exceeds the ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB limit`),
  folder: z4.string().regex(/^[a-z0-9][a-z0-9/_-]*$/i, "Invalid folder path").max(120).optional()
});
var persistMediaSchema = z4.object({
  key: z4.string().max(512).regex(
    /^([a-z0-9][a-z0-9/_-]*\/)?[A-Za-z0-9_-]{8,}\.(jpg|png|webp|avif|gif)$/,
    "Invalid storage key"
  ),
  contentType: z4.enum(ALLOWED_IMAGE_MIME_TYPES),
  size: z4.number().int().positive().max(MAX_UPLOAD_BYTES),
  alt: z4.string().max(300).optional(),
  width: z4.number().int().positive().optional(),
  height: z4.number().int().positive().optional()
});

// ../../packages/validation/src/contact.ts
import { z as z5 } from "zod";
var contactSchema = z5.object({
  name: z5.string().min(1, "Name is required").max(120),
  email: z5.email().trim().toLowerCase(),
  company: z5.string().max(160).optional(),
  service: z5.string().max(80).optional(),
  message: z5.string().min(10, "Please add a little more detail").max(5e3),
  source: z5.string().max(40).optional(),
  utm: z5.record(z5.string(), z5.string()).optional(),
  // Honeypot - legitimate users never fill this; bots do. Must stay empty.
  website: z5.string().max(0).optional()
});

// ../../packages/validation/src/newsletter.ts
import { z as z6 } from "zod";
var newsletterSubscribeSchema = z6.object({
  email: z6.email().trim().toLowerCase(),
  source: z6.string().max(40).optional(),
  // Honeypot.
  website: z6.string().max(0).optional()
});
var newsletterUnsubscribeSchema = z6.object({
  token: z6.string().min(1, "Unsubscribe token is required")
});

// ../../packages/validation/src/lead.ts
import { z as z7 } from "zod";
var leadStatusValues = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];
var leadPriorityValues = ["LOW", "MEDIUM", "HIGH"];
var updateLeadSchema = z7.object({
  status: z7.enum(leadStatusValues).optional(),
  priority: z7.enum(leadPriorityValues).optional(),
  tags: z7.array(z7.string().max(40)).max(20).optional(),
  assignedToId: z7.string().min(1).nullable().optional()
});
var leadFilterSchema = paginationSchema.extend({
  status: z7.enum(leadStatusValues).optional()
});
var leadNoteSchema = z7.object({
  body: z7.string().min(1, "Note can't be empty").max(2e3)
});

// ../../packages/validation/src/blog.ts
import { z as z8 } from "zod";
var postStatusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"];
var postFields = {
  title: z8.string().min(1, "Title is required").max(160),
  slug: z8.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphenated slug").max(120),
  excerpt: z8.string().min(1, "Excerpt is required").max(320),
  content: z8.string().min(1, "Content is required"),
  coverImage: z8.string().max(500).optional(),
  category: z8.string().min(1).max(60),
  tags: z8.array(z8.string().max(40)).max(20),
  status: z8.enum(postStatusValues),
  metaTitle: z8.string().max(160).optional(),
  metaDescription: z8.string().max(200).optional()
};
var createPostSchema = z8.object({
  ...postFields,
  category: postFields.category.default("Engineering"),
  tags: postFields.tags.default([]),
  status: postFields.status.default("DRAFT")
});
var updatePostSchema = z8.object(postFields).partial();
var notifyPostSchema = z8.object({
  // Re-send even if subscribers were already notified for this post.
  force: z8.boolean().optional()
});
var blogFilterSchema = paginationSchema.extend({
  status: z8.enum(postStatusValues).optional()
});

// ../../packages/validation/src/testimonial.ts
import { z as z9 } from "zod";
var testimonialFields = {
  quote: z9.string().min(1, "Quote is required").max(800),
  author: z9.string().min(1, "Author is required").max(120),
  role: z9.string().min(1, "Role is required").max(120),
  company: z9.string().min(1, "Company is required").max(120),
  avatarUrl: z9.string().max(500).optional(),
  rating: z9.number().int().min(1).max(5).optional(),
  featured: z9.boolean(),
  published: z9.boolean(),
  order: z9.number().int().min(0).max(9999)
};
var createTestimonialSchema = z9.object({
  ...testimonialFields,
  featured: testimonialFields.featured.default(false),
  published: testimonialFields.published.default(true),
  order: testimonialFields.order.default(0)
});
var updateTestimonialSchema = z9.object(testimonialFields).partial();

// ../../packages/validation/src/faq.ts
import { z as z10 } from "zod";
var faqFields = {
  question: z10.string().min(1, "Question is required").max(300),
  answer: z10.string().min(1, "Answer is required").max(2e3),
  category: z10.string().max(60).optional(),
  published: z10.boolean(),
  order: z10.number().int().min(0).max(9999)
};
var createFaqSchema = z10.object({
  ...faqFields,
  published: faqFields.published.default(true),
  order: faqFields.order.default(0)
});
var updateFaqSchema = z10.object(faqFields).partial();

// ../../packages/validation/src/project.ts
import { z as z11 } from "zod";
var hexColor = z11.string().regex(/^#[0-9a-fA-F]{3,8}$/, "Use a hex color like #7c5cff");
var projectFields = {
  slug: z11.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphenated slug").max(120),
  title: z11.string().min(1, "Title is required").max(160),
  summary: z11.string().min(1, "Summary is required").max(400),
  category: z11.string().min(1).max(60),
  tags: z11.array(z11.string().max(40)).max(20),
  year: z11.string().min(1).max(10),
  accentFrom: hexColor,
  accentTo: hexColor,
  results: z11.array(z11.string().max(120)).max(12),
  coverImage: z11.string().max(500).optional(),
  logoImage: z11.string().max(500).optional(),
  url: z11.string().url("Use a full URL like https://example.com").max(500).optional(),
  content: z11.string().max(5e4).optional(),
  featured: z11.boolean(),
  published: z11.boolean(),
  order: z11.number().int().min(0).max(9999)
};
var createProjectSchema = z11.object({
  ...projectFields,
  tags: projectFields.tags.default([]),
  accentFrom: projectFields.accentFrom.default("#7c5cff"),
  accentTo: projectFields.accentTo.default("#3d2689"),
  results: projectFields.results.default([]),
  featured: projectFields.featured.default(false),
  published: projectFields.published.default(true),
  order: projectFields.order.default(0)
});
var updateProjectSchema = z11.object(projectFields).partial();

// ../../packages/validation/src/product.ts
import { z as z12 } from "zod";
var productStatusValues = ["LIVE", "BETA", "SOON"];
var hexColor2 = z12.string().regex(/^#[0-9a-fA-F]{3,8}$/, "Use a hex color like #7c5cff");
var productFields = {
  slug: z12.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphenated slug").max(120),
  name: z12.string().min(1, "Name is required").max(120),
  tagline: z12.string().min(1, "Tagline is required").max(200),
  description: z12.string().min(1, "Description is required").max(2e3),
  status: z12.enum(productStatusValues),
  url: z12.string().url().max(500).optional(),
  pricing: z12.string().min(1).max(120),
  features: z12.array(z12.string().max(120)).max(20),
  accentFrom: hexColor2,
  accentTo: hexColor2,
  content: z12.string().max(5e4).optional(),
  featured: z12.boolean(),
  published: z12.boolean(),
  order: z12.number().int().min(0).max(9999)
};
var createProductSchema = z12.object({
  ...productFields,
  status: productFields.status.default("BETA"),
  features: productFields.features.default([]),
  accentFrom: productFields.accentFrom.default("#7c5cff"),
  accentTo: productFields.accentTo.default("#3d2689"),
  featured: productFields.featured.default(false),
  published: productFields.published.default(true),
  order: productFields.order.default(0)
});
var updateProductSchema = z12.object(productFields).partial();

// ../../packages/validation/src/service.ts
import { z as z13 } from "zod";
var serviceWorkflowStepSchema = z13.object({
  title: z13.string().min(1).max(120),
  description: z13.string().min(1).max(400)
});
var serviceFaqSchema = z13.object({
  question: z13.string().min(1).max(300),
  answer: z13.string().min(1).max(2e3)
});
var serviceFields = {
  slug: z13.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphenated slug").max(120),
  icon: z13.string().min(1).max(40),
  title: z13.string().min(1, "Title is required").max(160),
  summary: z13.string().min(1, "Summary is required").max(400),
  description: z13.string().min(1, "Description is required").max(4e3),
  benefits: z13.array(z13.string().max(200)).max(20),
  stack: z13.array(z13.string().max(40)).max(30),
  workflow: z13.array(serviceWorkflowStepSchema).max(12),
  faqs: z13.array(serviceFaqSchema).max(20),
  featured: z13.boolean(),
  published: z13.boolean(),
  order: z13.number().int().min(0).max(9999)
};
var createServiceSchema = z13.object({
  ...serviceFields,
  icon: serviceFields.icon.default("sparkles"),
  benefits: serviceFields.benefits.default([]),
  stack: serviceFields.stack.default([]),
  workflow: serviceFields.workflow.default([]),
  faqs: serviceFields.faqs.default([]),
  featured: serviceFields.featured.default(false),
  published: serviceFields.published.default(true),
  order: serviceFields.order.default(0)
});
var updateServiceSchema = z13.object(serviceFields).partial();

// ../../packages/validation/src/team.ts
import { z as z14 } from "zod";
var teamMemberFields = {
  name: z14.string().min(1, "Name is required").max(120),
  role: z14.string().min(1, "Role is required").max(120),
  bio: z14.string().max(2e3).optional(),
  avatarUrl: z14.string().max(500).optional(),
  links: z14.record(z14.string(), z14.string().url().max(500)),
  published: z14.boolean(),
  order: z14.number().int().min(0).max(9999)
};
var createTeamMemberSchema = z14.object({
  ...teamMemberFields,
  links: teamMemberFields.links.default({}),
  published: teamMemberFields.published.default(true),
  order: teamMemberFields.order.default(0)
});
var updateTeamMemberSchema = z14.object(teamMemberFields).partial();

// ../../packages/validation/src/homepage.ts
import { z as z15 } from "zod";
var homepageSectionFields = {
  key: z15.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphenated key").max(60),
  title: z15.string().max(200).optional(),
  subtitle: z15.string().max(400).optional(),
  enabled: z15.boolean(),
  order: z15.number().int().min(0).max(9999),
  config: z15.record(z15.string(), z15.unknown())
};
var upsertHomepageSectionSchema = z15.object({
  ...homepageSectionFields,
  enabled: homepageSectionFields.enabled.default(true),
  order: homepageSectionFields.order.default(0),
  config: homepageSectionFields.config.default({})
});
var updateHomepageSectionSchema = z15.object(homepageSectionFields).omit({ key: true }).partial();

// ../../packages/validation/src/todo.ts
import { z as z16 } from "zod";
var todoStatusValues = ["TODO", "IN_PROGRESS", "DONE"];
var todoPriorityValues = ["LOW", "MEDIUM", "HIGH"];
var nullableDate = z16.preprocess((v) => v === "" || v === null ? null : v, z16.coerce.date().nullable()).optional();
var todoFields = {
  title: z16.string().min(1, "Title is required").max(300),
  description: z16.string().max(4e3).optional(),
  status: z16.enum(todoStatusValues),
  priority: z16.enum(todoPriorityValues),
  dueDate: nullableDate,
  reminderAt: nullableDate
};
var createTodoSchema = z16.object({
  ...todoFields,
  status: todoFields.status.default("TODO"),
  priority: todoFields.priority.default("MEDIUM")
});
var updateTodoSchema = z16.object(todoFields).partial();
var todoFilterSchema = paginationSchema.extend({
  status: z16.enum(todoStatusValues).optional()
});

// ../../packages/validation/src/analytics.ts
import { z as z17 } from "zod";
var trackEventSchema = z17.object({
  type: z17.enum(["pageview", "event"]).default("pageview"),
  name: z17.string().max(80).optional(),
  path: z17.string().min(1).max(512),
  referrer: z17.string().max(512).optional(),
  utmSource: z17.string().max(120).optional(),
  utmMedium: z17.string().max(120).optional(),
  utmCampaign: z17.string().max(120).optional()
});
var analyticsRangeSchema = z17.object({
  days: z17.coerce.number().int().min(1).max(365).default(30)
});

// src/modules/media/media.service.ts
var EXTENSION_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif"
};
function sanitizeFolder(folder) {
  if (!folder) return void 0;
  const clean = folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "");
  return clean.length > 0 ? clean : void 0;
}
var MediaService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  /** Validate, derive a server-side key, and return a presigned PUT URL. */
  async createPresignedUpload(input) {
    const ext = EXTENSION_BY_MIME[input.contentType];
    if (!ext) throw new BadRequestError("Unsupported content type");
    if (input.size <= 0 || input.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestError("File size out of range");
    }
    const folder = sanitizeFolder(input.folder);
    const key = `${folder ? `${folder}/` : ""}${generateId()}.${ext}`;
    const uploadUrl = await this.deps.storage.presignPut({ key, contentType: input.contentType });
    return { key, uploadUrl, publicUrl: this.deps.storage.publicUrl(key) };
  }
  /** Record an uploaded object's metadata after a successful client PUT. */
  persist(input, uploadedById) {
    return this.deps.repos.media.create({
      key: input.key,
      url: this.deps.storage.publicUrl(input.key),
      mimeType: input.contentType,
      size: input.size,
      alt: input.alt ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      uploadedById
    });
  }
  list(opts) {
    return this.deps.repos.media.list(opts);
  }
  async remove(id) {
    const media = await this.deps.repos.media.findById(id);
    if (!media) throw new NotFoundError("Media not found");
    await this.deps.repos.media.delete(id);
  }
};

// src/modules/newsletter/newsletter.service.ts
var NewsletterService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  /** Idempotent subscribe: re-subscribes a previously unsubscribed email, no-ops if already active. */
  async subscribe(email, source) {
    const existing = await this.deps.repos.newsletter.findByEmail(email);
    if (existing) {
      if (existing.status === "UNSUBSCRIBED") {
        await this.deps.repos.newsletter.resubscribe(existing.id);
      }
      return;
    }
    await this.deps.repos.newsletter.create({
      email,
      unsubscribeToken: generateOpaqueToken(),
      source: source ?? null
    });
  }
  async unsubscribe(token) {
    const sub = await this.deps.repos.newsletter.findByToken(token);
    if (sub) await this.deps.repos.newsletter.unsubscribe(sub.id);
  }
  list(opts) {
    return this.deps.repos.newsletter.list(opts);
  }
};

// src/modules/reminders/reminder.service.ts
var ymd = (d) => d.toISOString().slice(0, 10);
var ReminderService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  /**
   * Build and (best-effort) send the owner's daily digest: overdue / due-today /
   * upcoming tasks plus new leads in the last 24h. Skips sending when there is
   * genuinely nothing to report.
   */
  async runDailyDigest(now = /* @__PURE__ */ new Date()) {
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1e3);
    const horizon = new Date(startOfToday.getTime() + 4 * 24 * 60 * 60 * 1e3);
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
    const [dueTodos, newLeads] = await Promise.all([
      this.deps.repos.todos.dueWithin(horizon),
      this.deps.repos.leads.countSince(since24h)
    ]);
    const fmt = (t) => ({
      title: t.title,
      dueDate: t.dueDate ? ymd(t.dueDate) : ""
    });
    const overdue = dueTodos.filter((t) => t.dueDate && t.dueDate < startOfToday).map(fmt);
    const dueToday = dueTodos.filter((t) => t.dueDate && t.dueDate >= startOfToday && t.dueDate < endOfToday).map(fmt);
    const upcoming = dueTodos.filter((t) => t.dueDate && t.dueDate >= endOfToday).map(fmt);
    const result = {
      sent: false,
      overdue: overdue.length,
      dueToday: dueToday.length,
      upcoming: upcoming.length,
      newLeads
    };
    const notify = this.deps.config.email.notifyEmail;
    if (!notify) return result;
    if (!overdue.length && !dueToday.length && !upcoming.length && newLeads === 0) return result;
    try {
      await this.deps.email.send({
        to: notify,
        ...dailyDigestEmail({
          overdue,
          dueToday,
          upcoming,
          newLeads,
          adminUrl: this.deps.config.adminUrl,
          brand: { companyName: "Strophic", siteUrl: this.deps.config.siteUrl }
        })
      });
      result.sent = true;
    } catch (error) {
      console.error("[reminders] digest email failed:", error);
    }
    return result;
  }
};

// src/modules/settings/settings.service.ts
var PUBLIC_GROUPS = /* @__PURE__ */ new Set(["company", "social", "seo", "theme"]);
var SettingsService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  getAll() {
    return this.deps.repos.settings.getAll();
  }
  /** Public, read-only subset keyed by group, e.g. { social: { x, linkedin } }. */
  async getPublic() {
    const rows = await this.deps.repos.settings.getAll();
    const out = {};
    for (const row of rows) {
      if (PUBLIC_GROUPS.has(row.group)) {
        out[row.group] = row.value ?? {};
      }
    }
    return out;
  }
  getGroup(group) {
    return this.deps.repos.settings.getGroup(group);
  }
  updateGroup(group, value) {
    return this.deps.repos.settings.upsertGroup(group, value);
  }
};

// src/services/deploy.service.ts
var DeployService = class {
  constructor(deps) {
    this.deps = deps;
  }
  deps;
  async triggerRebuild() {
    const url = this.deps.config.deployHookUrl;
    if (!url) return { triggered: false, notConfigured: true };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5e3);
    try {
      const res = await fetch(url, { method: "POST", signal: controller.signal });
      return { triggered: res.ok };
    } catch (error) {
      console.error("[deploy] rebuild trigger failed:", error);
      return { triggered: false };
    } finally {
      clearTimeout(timeout);
    }
  }
};

// src/services/storage.service.ts
import { AwsClient } from "aws4fetch";
var StorageService = class {
  constructor(config3) {
    this.config = config3;
    if (config3.accessKeyId && config3.secretAccessKey) {
      this.client = new AwsClient({
        accessKeyId: config3.accessKeyId,
        secretAccessKey: config3.secretAccessKey,
        region: config3.region,
        service: "s3"
      });
    }
  }
  config;
  client;
  ready() {
    if (!this.client || !this.config.endpoint) {
      throw new BadRequestError("Storage is not configured");
    }
    return { client: this.client, endpoint: this.config.endpoint };
  }
  /** Generate a short-lived presigned PUT URL the browser can upload directly to. */
  async presignPut(opts) {
    const { client: client2, endpoint } = this.ready();
    const expires = opts.expiresSeconds ?? 600;
    const objectUrl = `${endpoint}/${this.config.bucket}/${opts.key}?X-Amz-Expires=${expires}`;
    const signed = await client2.sign(objectUrl, {
      method: "PUT",
      headers: { "content-type": opts.contentType },
      aws: { signQuery: true, allHeaders: true }
    });
    return signed.url;
  }
  /** The public (CDN) URL for a stored object. */
  publicUrl(key) {
    const base = this.config.publicUrl?.replace(/\/+$/, "") ?? "";
    return `${base}/${key}`;
  }
};

// src/container.ts
function createContainer(config3) {
  const repos = createRepositories(getPrisma(config3.databaseUrl));
  const email = createEmailProvider({
    provider: config3.email.provider,
    from: config3.email.from,
    resendApiKey: config3.email.resendApiKey
  });
  const storage = new StorageService(config3.storage);
  return {
    config: config3,
    repos,
    auth: new AuthService({ repos, config: config3, email }),
    media: new MediaService({ repos, storage, config: config3 }),
    settings: new SettingsService({ repos }),
    leads: new LeadService({ repos, config: config3, email }),
    newsletter: new NewsletterService({ repos }),
    blog: new BlogService({ repos, config: config3, email }),
    testimonials: new TestimonialService({ repos }),
    faqs: new FaqService({ repos }),
    projects: new ProjectService({ repos }),
    products: new ProductService({ repos }),
    serviceOfferings: new ServiceOfferingService({ repos }),
    team: new TeamService({ repos }),
    homepage: new HomepageService({ repos }),
    todos: new TodoService({ repos }),
    analytics: new AnalyticsService({ repos, config: config3 }),
    reminders: new ReminderService({ repos, config: config3, email }),
    deploy: new DeployService({ config: config3 })
  };
}

// src/middleware/error.ts
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
var HTTP_CODE_BY_STATUS = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  429: "TOO_MANY_REQUESTS"
};
function errorHandler(err, c) {
  if (err instanceof AppError) {
    const body2 = {
      ok: false,
      error: { code: err.code, message: err.message, details: err.details }
    };
    return c.json(body2, err.status);
  }
  if (err instanceof HTTPException) {
    const code = HTTP_CODE_BY_STATUS[err.status] ?? "HTTP_ERROR";
    const body2 = { ok: false, error: { code, message: err.message || code } };
    return c.json(body2, err.status);
  }
  if (err instanceof ZodError) {
    const body2 = {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues }
    };
    return c.json(body2, 400);
  }
  console.error("[api] unhandled error:", err);
  const body = {
    ok: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" }
  };
  return c.json(body, 500);
}
function notFoundHandler(c) {
  const body = { ok: false, error: { code: "NOT_FOUND", message: "Route not found" } };
  return c.json(body, 404);
}

// src/modules/auth/auth.routes.ts
import { Hono } from "hono";
import { getCookie as getCookie2 } from "hono/cookie";

// src/lib/cookies.ts
import { deleteCookie, setCookie } from "hono/cookie";
var ACCESS_COOKIE = "strophic_at";
var REFRESH_COOKIE = "strophic_rt";
var REFRESH_PATH = "/api/v1/auth";
var ACCESS_MAX_AGE = 60 * 15;
var REFRESH_MAX_AGE = 60 * 60 * 24 * 30;
function baseCookieOptions(config3) {
  return {
    httpOnly: true,
    secure: config3.isProd,
    sameSite: "Lax",
    // Only set a cross-subdomain domain in production; on localhost it must be host-only.
    ...config3.isProd && config3.cookieDomain ? { domain: config3.cookieDomain } : {}
  };
}
function setAuthCookies(c, config3, tokens) {
  const base = baseCookieOptions(config3);
  setCookie(c, ACCESS_COOKIE, tokens.accessToken, { ...base, path: "/", maxAge: ACCESS_MAX_AGE });
  setCookie(c, REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    path: REFRESH_PATH,
    maxAge: REFRESH_MAX_AGE
  });
}
function clearAuthCookies(c, config3) {
  const domainOpt = config3.isProd && config3.cookieDomain ? { domain: config3.cookieDomain } : {};
  deleteCookie(c, ACCESS_COOKIE, { path: "/", ...domainOpt });
  deleteCookie(c, REFRESH_COOKIE, { path: REFRESH_PATH, ...domainOpt });
}

// src/lib/request.ts
function clientIp(c) {
  const realIp = c.req.header("x-real-ip")?.trim();
  if (realIp) return realIp;
  const xff = c.req.header("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1] ?? null;
  }
  return null;
}
function requestContext(c) {
  return { userAgent: c.req.header("user-agent") ?? null, ip: clientIp(c) };
}

// src/lib/response.ts
function ok(c, data, meta) {
  const body = meta ? { ok: true, data, meta } : { ok: true, data };
  return c.json(body);
}

// src/lib/validate.ts
import { zValidator } from "@hono/zod-validator";
var validate = (target, schema) => zValidator(target, schema, (result) => {
  if (!result.success) {
    throw result.error;
  }
});

// src/middleware/auth.ts
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
function extractToken(c) {
  const cookie = getCookie(c, ACCESS_COOKIE);
  if (cookie) return cookie;
  const header = c.req.header("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return void 0;
}
async function authenticate(c, config3) {
  const token = extractToken(c);
  if (!token) throw new UnauthorizedError();
  const claims = await verifyAccessToken(token, config3.jwt.accessSecret);
  if (!claims) throw new UnauthorizedError();
  return { id: claims.sub, role: claims.role };
}
function requireAuth(config3) {
  return createMiddleware(async (c, next) => {
    c.set("user", await authenticate(c, config3));
    await next();
  });
}
function requireRole(config3, min) {
  return createMiddleware(async (c, next) => {
    const user = await authenticate(c, config3);
    if (!hasRole(user.role, min)) throw new ForbiddenError();
    c.set("user", user);
    await next();
  });
}
function getUser(c) {
  const user = c.get("user");
  if (!user) throw new UnauthorizedError();
  return user;
}

// src/middleware/rate-limit.ts
import { createMiddleware as createMiddleware2 } from "hono/factory";
var store = /* @__PURE__ */ new Map();
function rateLimit(opts) {
  return createMiddleware2(async (c, next) => {
    const ip = clientIp(c) ?? "unknown";
    const key = `${opts.keyPrefix ?? "rl"}:${ip}`;
    const now = Date.now();
    const bucket = store.get(key);
    if (!bucket || bucket.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + opts.windowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > opts.max) {
        throw new TooManyRequestsError("Too many requests - please slow down");
      }
    }
    await next();
  });
}

// src/modules/auth/auth.routes.ts
function authRoutes(container) {
  const app2 = new Hono();
  app2.post(
    "/login",
    rateLimit({ windowMs: 15 * 60 * 1e3, max: 10, keyPrefix: "login" }),
    validate("json", loginSchema),
    async (c) => {
      const result = await container.auth.login(c.req.valid("json"), requestContext(c));
      setAuthCookies(c, container.config, result);
      return ok(c, { user: result.user });
    }
  );
  app2.post("/refresh", rateLimit({ windowMs: 15 * 60 * 1e3, max: 60, keyPrefix: "refresh" }), async (c) => {
    const raw2 = getCookie2(c, REFRESH_COOKIE);
    if (!raw2) throw new UnauthorizedError();
    const result = await container.auth.refresh(raw2, requestContext(c));
    setAuthCookies(c, container.config, result);
    return ok(c, { user: result.user });
  });
  app2.post("/logout", async (c) => {
    await container.auth.logout(getCookie2(c, REFRESH_COOKIE));
    clearAuthCookies(c, container.config);
    return ok(c, { success: true });
  });
  app2.post(
    "/forgot-password",
    rateLimit({ windowMs: 15 * 60 * 1e3, max: 5, keyPrefix: "forgot" }),
    validate("json", forgotPasswordSchema),
    async (c) => {
      await container.auth.forgotPassword(c.req.valid("json").email);
      return ok(c, { success: true });
    }
  );
  app2.post(
    "/reset-password",
    rateLimit({ windowMs: 15 * 60 * 1e3, max: 5, keyPrefix: "reset" }),
    validate("json", resetPasswordSchema),
    async (c) => {
      const { token, password } = c.req.valid("json");
      await container.auth.resetPassword(token, password);
      return ok(c, { success: true });
    }
  );
  app2.get("/me", requireAuth(container.config), async (c) => {
    const user = getUser(c);
    return ok(c, { user: await container.auth.me(user.id) });
  });
  app2.post(
    "/change-password",
    requireAuth(container.config),
    validate("json", changePasswordSchema),
    async (c) => {
      const { currentPassword, newPassword } = c.req.valid("json");
      await container.auth.changePassword(getUser(c).id, currentPassword, newPassword);
      return ok(c, { success: true });
    }
  );
  return app2;
}

// src/modules/blog/blog.routes.ts
import { Hono as Hono2 } from "hono";
function blogRoutes(container) {
  const app2 = new Hono2();
  app2.use("*", requireRole(container.config, "EDITOR"));
  app2.get("/", validate("query", blogFilterSchema), async (c) => {
    const { page, pageSize, status } = c.req.valid("query");
    const { items, total } = await container.blog.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
      status
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  });
  app2.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { post: await container.blog.get(c.req.valid("param").id) });
  });
  app2.post("/", validate("json", createPostSchema), async (c) => {
    const post = await container.blog.create(c.req.valid("json"), getUser(c).id);
    return ok(c, { post });
  });
  app2.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updatePostSchema),
    async (c) => {
      const post = await container.blog.update(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, { post });
    }
  );
  app2.post(
    "/:id/notify",
    validate("param", idParamSchema),
    validate("json", notifyPostSchema),
    async (c) => {
      const result = await container.blog.notify(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, result);
    }
  );
  app2.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.blog.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });
  return app2;
}

// src/modules/blog/posts.routes.ts
import { Hono as Hono3 } from "hono";
function postsRoutes(container) {
  const app2 = new Hono3();
  app2.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.blog.listPublished({
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  });
  app2.get("/:slug", validate("param", slugParamSchema), async (c) => {
    return ok(c, { post: await container.blog.getPublishedBySlug(c.req.valid("param").slug) });
  });
  return app2;
}

// src/modules/analytics/analytics.routes.ts
import { Hono as Hono4 } from "hono";
function eventsRoutes(container) {
  const app2 = new Hono4();
  app2.post(
    "/",
    rateLimit({ windowMs: 60 * 1e3, max: 120, keyPrefix: "events" }),
    validate("json", trackEventSchema),
    async (c) => {
      const { ip, userAgent } = requestContext(c);
      await container.analytics.track(c.req.valid("json"), { ip, userAgent });
      return ok(c, { success: true });
    }
  );
  return app2;
}
function analyticsRoutes(container) {
  const app2 = new Hono4();
  app2.use("*", requireRole(container.config, "EDITOR"));
  app2.get("/", validate("query", analyticsRangeSchema), async (c) => {
    return ok(c, await container.analytics.dashboard(c.req.valid("query").days));
  });
  return app2;
}

// src/modules/content/faq.routes.ts
import { Hono as Hono5 } from "hono";
function faqRoutes(container) {
  const app2 = new Hono5();
  app2.use("*", requireRole(container.config, "EDITOR"));
  app2.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.faqs.list({
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  });
  app2.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { faq: await container.faqs.get(c.req.valid("param").id) });
  });
  app2.post("/", validate("json", createFaqSchema), async (c) => {
    return ok(c, { faq: await container.faqs.create(c.req.valid("json")) });
  });
  app2.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updateFaqSchema),
    async (c) => {
      const faq = await container.faqs.update(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, { faq });
    }
  );
  app2.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.faqs.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });
  return app2;
}
function publicFaqRoutes(container) {
  const app2 = new Hono5();
  app2.get("/", async (c) => {
    const { items } = await container.faqs.listPublished();
    return ok(c, { items });
  });
  return app2;
}

// src/modules/content/homepage.routes.ts
import { Hono as Hono6 } from "hono";
function homepageRoutes(container) {
  const app2 = new Hono6();
  app2.use("*", requireRole(container.config, "EDITOR"));
  app2.get("/", async (c) => {
    return ok(c, { items: await container.homepage.list() });
  });
  app2.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { section: await container.homepage.get(c.req.valid("param").id) });
  });
  app2.put("/", validate("json", upsertHomepageSectionSchema), async (c) => {
    return ok(c, { section: await container.homepage.upsert(c.req.valid("json")) });
  });
  app2.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updateHomepageSectionSchema),
    async (c) => {
      const section = await container.homepage.update(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, { section });
    }
  );
  app2.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.homepage.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });
  return app2;
}
function publicHomepageRoutes(container) {
  const app2 = new Hono6();
  app2.get("/", async (c) => {
    return ok(c, { items: await container.homepage.list() });
  });
  return app2;
}

// src/modules/content/product.routes.ts
import { Hono as Hono7 } from "hono";
function productRoutes(container) {
  const app2 = new Hono7();
  app2.use("*", requireRole(container.config, "EDITOR"));
  app2.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.products.list({
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  });
  app2.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { product: await container.products.get(c.req.valid("param").id) });
  });
  app2.post("/", validate("json", createProductSchema), async (c) => {
    return ok(c, { product: await container.products.create(c.req.valid("json")) });
  });
  app2.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updateProductSchema),
    async (c) => {
      const product = await container.products.update(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, { product });
    }
  );
  app2.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.products.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });
  return app2;
}
function publicProductRoutes(container) {
  const app2 = new Hono7();
  app2.get("/", async (c) => {
    const { items } = await container.products.listPublished();
    return ok(c, { items });
  });
  app2.get("/:slug", validate("param", slugParamSchema), async (c) => {
    return ok(c, { product: await container.products.getPublishedBySlug(c.req.valid("param").slug) });
  });
  return app2;
}

// src/modules/content/project.routes.ts
import { Hono as Hono8 } from "hono";
function projectRoutes(container) {
  const app2 = new Hono8();
  app2.use("*", requireRole(container.config, "EDITOR"));
  app2.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.projects.list({
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  });
  app2.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { project: await container.projects.get(c.req.valid("param").id) });
  });
  app2.post("/", validate("json", createProjectSchema), async (c) => {
    return ok(c, { project: await container.projects.create(c.req.valid("json")) });
  });
  app2.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updateProjectSchema),
    async (c) => {
      const project = await container.projects.update(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, { project });
    }
  );
  app2.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.projects.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });
  return app2;
}
function publicProjectRoutes(container) {
  const app2 = new Hono8();
  app2.get("/", async (c) => {
    const { items } = await container.projects.listPublished();
    return ok(c, { items });
  });
  app2.get("/:slug", validate("param", slugParamSchema), async (c) => {
    return ok(c, { project: await container.projects.getPublishedBySlug(c.req.valid("param").slug) });
  });
  return app2;
}

// src/modules/content/service-offering.routes.ts
import { Hono as Hono9 } from "hono";
function serviceOfferingRoutes(container) {
  const app2 = new Hono9();
  app2.use("*", requireRole(container.config, "EDITOR"));
  app2.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.serviceOfferings.list({
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  });
  app2.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { service: await container.serviceOfferings.get(c.req.valid("param").id) });
  });
  app2.post("/", validate("json", createServiceSchema), async (c) => {
    return ok(c, { service: await container.serviceOfferings.create(c.req.valid("json")) });
  });
  app2.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updateServiceSchema),
    async (c) => {
      const service = await container.serviceOfferings.update(
        c.req.valid("param").id,
        c.req.valid("json")
      );
      return ok(c, { service });
    }
  );
  app2.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.serviceOfferings.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });
  return app2;
}
function publicServiceOfferingRoutes(container) {
  const app2 = new Hono9();
  app2.get("/", async (c) => {
    const { items } = await container.serviceOfferings.listPublished();
    return ok(c, { items });
  });
  app2.get("/:slug", validate("param", slugParamSchema), async (c) => {
    return ok(c, {
      service: await container.serviceOfferings.getPublishedBySlug(c.req.valid("param").slug)
    });
  });
  return app2;
}

// src/modules/content/team.routes.ts
import { Hono as Hono10 } from "hono";
function teamRoutes(container) {
  const app2 = new Hono10();
  app2.use("*", requireRole(container.config, "EDITOR"));
  app2.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.team.list({
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  });
  app2.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { member: await container.team.get(c.req.valid("param").id) });
  });
  app2.post("/", validate("json", createTeamMemberSchema), async (c) => {
    return ok(c, { member: await container.team.create(c.req.valid("json")) });
  });
  app2.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updateTeamMemberSchema),
    async (c) => {
      const member = await container.team.update(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, { member });
    }
  );
  app2.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.team.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });
  return app2;
}
function publicTeamRoutes(container) {
  const app2 = new Hono10();
  app2.get("/", async (c) => {
    const { items } = await container.team.listPublished();
    return ok(c, { items });
  });
  return app2;
}

// src/modules/content/testimonial.routes.ts
import { Hono as Hono11 } from "hono";
function testimonialRoutes(container) {
  const app2 = new Hono11();
  app2.use("*", requireRole(container.config, "EDITOR"));
  app2.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.testimonials.list({
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  });
  app2.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { testimonial: await container.testimonials.get(c.req.valid("param").id) });
  });
  app2.post("/", validate("json", createTestimonialSchema), async (c) => {
    return ok(c, { testimonial: await container.testimonials.create(c.req.valid("json")) });
  });
  app2.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updateTestimonialSchema),
    async (c) => {
      const testimonial = await container.testimonials.update(
        c.req.valid("param").id,
        c.req.valid("json")
      );
      return ok(c, { testimonial });
    }
  );
  app2.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.testimonials.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });
  return app2;
}
function publicTestimonialRoutes(container) {
  const app2 = new Hono11();
  app2.get("/", async (c) => {
    const { items } = await container.testimonials.listPublished();
    return ok(c, { items });
  });
  return app2;
}

// src/modules/content/todo.routes.ts
import { Hono as Hono12 } from "hono";
function todoRoutes(container) {
  const app2 = new Hono12();
  app2.use("*", requireRole(container.config, "EDITOR"));
  app2.get("/", validate("query", todoFilterSchema), async (c) => {
    const { page, pageSize, status } = c.req.valid("query");
    const { items, total } = await container.todos.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
      status
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  });
  app2.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { todo: await container.todos.get(c.req.valid("param").id) });
  });
  app2.post("/", validate("json", createTodoSchema), async (c) => {
    return ok(c, { todo: await container.todos.create(c.req.valid("json")) });
  });
  app2.patch(
    "/:id",
    validate("param", idParamSchema),
    validate("json", updateTodoSchema),
    async (c) => {
      const todo = await container.todos.update(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, { todo });
    }
  );
  app2.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.todos.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });
  return app2;
}

// src/modules/deploy/deploy.routes.ts
import { Hono as Hono13 } from "hono";
function deployRoutes(container) {
  const app2 = new Hono13();
  app2.use("*", requireRole(container.config, "EDITOR"));
  app2.post("/", async (c) => {
    return ok(c, await container.deploy.triggerRebuild());
  });
  return app2;
}

// src/modules/leads/contact.routes.ts
import { Hono as Hono14 } from "hono";
function contactRoutes(container) {
  const app2 = new Hono14();
  app2.post(
    "/",
    rateLimit({ windowMs: 60 * 60 * 1e3, max: 20, keyPrefix: "contact" }),
    validate("json", contactSchema),
    async (c) => {
      const input = c.req.valid("json");
      if (input.website) return ok(c, { success: true });
      const { ip, userAgent } = requestContext(c);
      const result = await container.leads.submit(input, {
        ip,
        userAgent,
        referrer: c.req.header("referer") ?? null
      });
      return ok(c, { success: true, id: result.id });
    }
  );
  return app2;
}

// src/modules/reminders/cron.routes.ts
import { Hono as Hono15 } from "hono";
function cronRoutes(container) {
  const app2 = new Hono15();
  app2.use("*", async (c, next) => {
    const secret = container.config.cronSecret;
    if (secret) {
      const auth = c.req.header("authorization");
      if (auth !== `Bearer ${secret}`) throw new UnauthorizedError("Invalid cron credentials");
    } else if (container.config.isProd) {
      throw new UnauthorizedError("Cron is not configured");
    }
    await next();
  });
  app2.get("/reminders", async (c) => {
    return ok(c, await container.reminders.runDailyDigest());
  });
  return app2;
}

// src/modules/leads/lead.routes.ts
import { Hono as Hono16 } from "hono";
function leadRoutes(container) {
  const app2 = new Hono16();
  app2.use("*", requireRole(container.config, "EDITOR"));
  app2.get("/", validate("query", leadFilterSchema), async (c) => {
    const { page, pageSize, status } = c.req.valid("query");
    const { items, total } = await container.leads.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
      status
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  });
  app2.get("/:id", validate("param", idParamSchema), async (c) => {
    return ok(c, { lead: await container.leads.get(c.req.valid("param").id) });
  });
  app2.patch(
    "/:id",
    requireRole(container.config, "ADMIN"),
    validate("param", idParamSchema),
    validate("json", updateLeadSchema),
    async (c) => {
      const lead = await container.leads.update(c.req.valid("param").id, c.req.valid("json"));
      return ok(c, { lead });
    }
  );
  app2.post(
    "/:id/notes",
    validate("param", idParamSchema),
    validate("json", leadNoteSchema),
    async (c) => {
      const note = await container.leads.addNote(
        c.req.valid("param").id,
        getUser(c).id,
        c.req.valid("json").body
      );
      return ok(c, { note });
    }
  );
  return app2;
}

// src/modules/media/media.routes.ts
import { Hono as Hono17 } from "hono";
function mediaRoutes(container) {
  const app2 = new Hono17();
  app2.use("*", requireRole(container.config, "EDITOR"));
  app2.post("/presign", validate("json", presignUploadSchema), async (c) => {
    return ok(c, await container.media.createPresignedUpload(c.req.valid("json")));
  });
  app2.post("/", validate("json", persistMediaSchema), async (c) => {
    const media = await container.media.persist(c.req.valid("json"), getUser(c).id);
    return ok(c, { media });
  });
  app2.get("/", validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.media.list({
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  });
  app2.delete("/:id", validate("param", idParamSchema), async (c) => {
    await container.media.remove(c.req.valid("param").id);
    return ok(c, { success: true });
  });
  return app2;
}

// src/modules/newsletter/newsletter.routes.ts
import { Hono as Hono18 } from "hono";
function newsletterRoutes(container) {
  const app2 = new Hono18();
  app2.post(
    "/subscribe",
    rateLimit({ windowMs: 60 * 60 * 1e3, max: 30, keyPrefix: "newsletter" }),
    validate("json", newsletterSubscribeSchema),
    async (c) => {
      const input = c.req.valid("json");
      if (input.website) return ok(c, { success: true });
      await container.newsletter.subscribe(input.email, input.source);
      return ok(c, { success: true });
    }
  );
  app2.post("/unsubscribe", validate("json", newsletterUnsubscribeSchema), async (c) => {
    await container.newsletter.unsubscribe(c.req.valid("json").token);
    return ok(c, { success: true });
  });
  app2.get("/unsubscribe", async (c) => {
    const token = c.req.query("token");
    if (token) await container.newsletter.unsubscribe(token);
    const siteUrl = container.config.siteUrl;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" /><title>Unsubscribed</title></head>
<body style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;color:#0f172a;">
<div style="max-width:480px;margin:80px auto;padding:32px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;text-align:center;">
<h1 style="font-size:20px;margin:0 0 12px;">You're unsubscribed</h1>
<p style="color:#475569;margin:0 0 24px;">You won't receive any more emails from us. Changed your mind? You can resubscribe anytime.</p>
<a href="${siteUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:12px;">Back to Strophic</a>
</div></body></html>`;
    return c.html(html);
  });
  app2.get("/", requireRole(container.config, "ADMIN"), validate("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const { items, total } = await container.newsletter.list({
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    return ok(c, { items }, {
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  });
  return app2;
}

// src/modules/settings/settings.routes.ts
import { Hono as Hono19 } from "hono";
function settingsRoutes(container) {
  const app2 = new Hono19();
  app2.get("/public", async (c) => {
    return ok(c, { settings: await container.settings.getPublic() });
  });
  app2.get("/", requireRole(container.config, "ADMIN"), async (c) => {
    return ok(c, { settings: await container.settings.getAll() });
  });
  app2.put(
    "/",
    requireRole(container.config, "ADMIN"),
    validate("json", updateSettingsSchema),
    async (c) => {
      const { group, value } = c.req.valid("json");
      return ok(c, { setting: await container.settings.updateGroup(group, value) });
    }
  );
  return app2;
}

// src/middleware/revalidate.ts
import { createMiddleware as createMiddleware3 } from "hono/factory";
var MUTATING = /* @__PURE__ */ new Set(["POST", "PUT", "PATCH", "DELETE"]);
var REBUILD_PREFIXES = [
  "/api/v1/blog",
  "/api/v1/settings",
  "/api/v1/admin/testimonials",
  "/api/v1/admin/faqs",
  "/api/v1/admin/projects",
  "/api/v1/admin/products",
  "/api/v1/admin/services",
  "/api/v1/admin/team",
  "/api/v1/admin/homepage"
];
function revalidateAfterMutation(container) {
  return createMiddleware3(async (c, next) => {
    await next();
    if (!container.config.deployHookUrl) return;
    if (!MUTATING.has(c.req.method)) return;
    if (c.res.status >= 400) return;
    if (c.req.path.endsWith("/notify")) return;
    if (!REBUILD_PREFIXES.some((p) => c.req.path.startsWith(p))) return;
    await container.deploy.triggerRebuild();
  });
}

// src/app.ts
function createApp(config3) {
  const container = createContainer(config3);
  const app2 = new Hono20();
  app2.use(
    "*",
    secureHeaders({
      contentSecurityPolicy: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      xFrameOptions: "DENY",
      referrerPolicy: "no-referrer",
      crossOriginResourcePolicy: "same-site",
      strictTransportSecurity: config3.isProd ? "max-age=63072000; includeSubDomains; preload" : false
    })
  );
  app2.use(
    "*",
    cors({
      origin: config3.corsOrigins,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    })
  );
  app2.use("*", csrf({ origin: config3.corsOrigins }));
  app2.onError(errorHandler);
  app2.notFound(notFoundHandler);
  app2.get("/health", (c) => {
    const body = {
      ok: true,
      data: { status: "healthy", service: "strophic-api" }
    };
    return c.json(body);
  });
  const v1 = new Hono20();
  v1.use("*", revalidateAfterMutation(container));
  v1.route("/auth", authRoutes(container));
  v1.route("/contact", contactRoutes(container));
  v1.route("/newsletter", newsletterRoutes(container));
  v1.route("/posts", postsRoutes(container));
  v1.route("/testimonials", publicTestimonialRoutes(container));
  v1.route("/faqs", publicFaqRoutes(container));
  v1.route("/projects", publicProjectRoutes(container));
  v1.route("/products", publicProductRoutes(container));
  v1.route("/services", publicServiceOfferingRoutes(container));
  v1.route("/team", publicTeamRoutes(container));
  v1.route("/homepage", publicHomepageRoutes(container));
  v1.route("/events", eventsRoutes(container));
  v1.route("/leads", leadRoutes(container));
  v1.route("/media", mediaRoutes(container));
  v1.route("/settings", settingsRoutes(container));
  v1.route("/blog", blogRoutes(container));
  v1.route("/admin/testimonials", testimonialRoutes(container));
  v1.route("/admin/faqs", faqRoutes(container));
  v1.route("/admin/projects", projectRoutes(container));
  v1.route("/admin/products", productRoutes(container));
  v1.route("/admin/services", serviceOfferingRoutes(container));
  v1.route("/admin/team", teamRoutes(container));
  v1.route("/admin/homepage", homepageRoutes(container));
  v1.route("/admin/todos", todoRoutes(container));
  v1.route("/admin/analytics", analyticsRoutes(container));
  v1.route("/admin/deploy", deployRoutes(container));
  v1.route("/cron", cronRoutes(container));
  app2.route("/api/v1", v1);
  return app2;
}

// src/env.ts
import { z as z18 } from "zod";
var envSchema = z18.object({
  NODE_ENV: z18.string().default("development"),
  PORT: z18.coerce.number().default(8787),
  DATABASE_URL: z18.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z18.string().min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  // Used as the HMAC pepper for refresh/reset token hashing (packages/auth hashToken).
  JWT_REFRESH_SECRET: z18.string().min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  COOKIE_DOMAIN: z18.string().optional(),
  EMAIL_PROVIDER: z18.enum(["resend", "console"]).default("console"),
  RESEND_API_KEY: z18.string().optional(),
  EMAIL_FROM: z18.string().default("Strophic <onboarding@resend.dev>"),
  CONTACT_NOTIFY_EMAIL: z18.string().optional(),
  SUPABASE_STORAGE_ENDPOINT: z18.string().optional(),
  SUPABASE_STORAGE_REGION: z18.string().default("us-east-1"),
  SUPABASE_STORAGE_ACCESS_KEY_ID: z18.string().optional(),
  SUPABASE_STORAGE_SECRET_ACCESS_KEY: z18.string().optional(),
  SUPABASE_STORAGE_BUCKET: z18.string().default("media"),
  SUPABASE_STORAGE_PUBLIC_URL: z18.string().optional(),
  PUBLIC_SITE_URL: z18.string().default("http://localhost:4321"),
  // The API's own public base URL, used to build absolute links in emails
  // (e.g. the one-click newsletter unsubscribe link).
  PUBLIC_API_URL: z18.string().default("http://localhost:8787"),
  ADMIN_URL: z18.string().default("http://localhost:3000"),
  // Shared secret for scheduled-job endpoints; Vercel Cron sends it as a Bearer token.
  CRON_SECRET: z18.string().optional(),
  // Cloudflare Pages (or any) deploy hook. POSTed to after content changes to
  // rebuild the static website. Server-side only - never exposed to the browser.
  DEPLOY_HOOK_URL: z18.string().url().optional()
});
function parseAddress(value) {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value);
  if (match?.[2]) {
    return { name: match[1] || void 0, email: match[2].trim() };
  }
  return { email: value.trim() };
}
function loadConfig(source = process.env) {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  const env = parsed.data;
  const isProd = env.NODE_ENV === "production";
  const corsOrigins = Array.from(
    new Set(
      isProd ? [env.ADMIN_URL, env.PUBLIC_SITE_URL] : [env.ADMIN_URL, env.PUBLIC_SITE_URL, "http://localhost:3000", "http://localhost:4321"]
    )
  );
  return {
    isProd,
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    jwt: { accessSecret: env.JWT_ACCESS_SECRET, refreshSecret: env.JWT_REFRESH_SECRET },
    cookieDomain: env.COOKIE_DOMAIN,
    email: {
      provider: env.EMAIL_PROVIDER,
      resendApiKey: env.RESEND_API_KEY,
      from: parseAddress(env.EMAIL_FROM),
      notifyEmail: env.CONTACT_NOTIFY_EMAIL
    },
    storage: {
      endpoint: env.SUPABASE_STORAGE_ENDPOINT,
      region: env.SUPABASE_STORAGE_REGION,
      accessKeyId: env.SUPABASE_STORAGE_ACCESS_KEY_ID,
      secretAccessKey: env.SUPABASE_STORAGE_SECRET_ACCESS_KEY,
      bucket: env.SUPABASE_STORAGE_BUCKET,
      publicUrl: env.SUPABASE_STORAGE_PUBLIC_URL
    },
    corsOrigins,
    siteUrl: env.PUBLIC_SITE_URL,
    apiUrl: env.PUBLIC_API_URL,
    adminUrl: env.ADMIN_URL,
    cronSecret: env.CRON_SECRET,
    deployHookUrl: env.DEPLOY_HOOK_URL
  };
}

// src/vercel.ts
var config2 = { runtime: "nodejs" };
var app = createApp(loadConfig());
var vercel_default = getRequestListener(app.fetch);
export {
  config2 as config,
  vercel_default as default
};
