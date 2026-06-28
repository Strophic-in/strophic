import {
  generateId,
  generateOpaqueToken,
  hashPassword,
  hashToken,
  signAccessToken,
  verifyPassword,
} from "@strophic/auth";
import type { Repositories, User } from "@strophic/database";
import { type EmailProvider, passwordResetEmail } from "@strophic/email";
import type { AppConfig } from "../../env";
import { BadRequestError, UnauthorizedError } from "../../lib/errors";

const ACCESS_TTL = "15m";
const REFRESH_TTL_MS = 60 * 60 * 24 * 30 * 1000; // 30 days
const RESET_TTL_MINUTES = 30;

export interface RequestContext {
  userAgent?: string | null;
  ip?: string | null;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: User["role"];
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

// Computed once and reused so login timing doesn't reveal whether an email exists.
let dummyHashPromise: Promise<string> | undefined;
function dummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword("not-a-real-password-placeholder");
  return dummyHashPromise;
}

export class AuthService {
  constructor(
    private readonly deps: { repos: Repositories; config: AppConfig; email: EmailProvider },
  ) {}

  /** HMAC-hash an opaque token with the server pepper for at-rest storage and lookup. */
  private hash(token: string): Promise<string> {
    return hashToken(token, this.deps.config.jwt.refreshSecret);
  }

  private async mintTokens(
    user: { id: string; role: User["role"] },
    family: string,
    ctx: RequestContext,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await signAccessToken({
      userId: user.id,
      role: user.role,
      secret: this.deps.config.jwt.accessSecret,
      jti: generateId(),
      expiresIn: ACCESS_TTL,
    });
    const refreshToken = generateOpaqueToken();
    await this.deps.repos.refreshTokens.create({
      userId: user.id,
      tokenHash: await this.hash(refreshToken),
      family,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      userAgent: ctx.userAgent ?? null,
      ip: ctx.ip ?? null,
    });
    return { accessToken, refreshToken };
  }

  async login(input: { email: string; password: string }, ctx: RequestContext): Promise<AuthResult> {
    const user = await this.deps.repos.users.findByEmail(input.email);
    // Always run a hash to equalize timing whether or not the user exists.
    const hash = user?.passwordHash ?? (await dummyHash());
    const passwordOk = await verifyPassword(input.password, hash);

    if (!user || !passwordOk || !user.isActive) {
      throw new UnauthorizedError("Invalid email or password");
    }

    await this.deps.repos.users.updateLastLogin(user.id);
    const tokens = await this.mintTokens(user, generateId(), ctx);
    return { user: toPublicUser(user), ...tokens };
  }

  async refresh(rawToken: string, ctx: RequestContext): Promise<AuthResult> {
    const tokenHash = await this.hash(rawToken);
    const existing = await this.deps.repos.refreshTokens.findByHash(tokenHash);
    if (!existing) throw new UnauthorizedError("Invalid session");

    // Reuse of an already-rotated token ⇒ likely theft ⇒ revoke the whole family.
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
      ip: ctx.ip ?? null,
    });
    // Lost a concurrent rotation race (token already rotated) - reject this one.
    if (!rotated) throw new UnauthorizedError("Session is no longer valid");

    const accessToken = await signAccessToken({
      userId: user.id,
      role: user.role,
      secret: this.deps.config.jwt.accessSecret,
      jti: generateId(),
      expiresIn: ACCESS_TTL,
    });

    return { user: toPublicUser(user), accessToken, refreshToken };
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const existing = await this.deps.repos.refreshTokens.findByHash(await this.hash(rawToken));
    if (existing && !existing.revokedAt) {
      await this.deps.repos.refreshTokens.revoke(existing.id);
    }
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.deps.repos.users.findById(userId);
    if (!user) throw new UnauthorizedError();
    return toPublicUser(user);
  }

  /** Always resolves the same way regardless of whether the email exists. */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.deps.repos.users.findByEmail(email);
    if (!user || !user.isActive) return;

    await this.deps.repos.passwordResets.invalidateAllForUser(user.id);
    const rawToken = generateOpaqueToken();
    await this.deps.repos.passwordResets.create({
      userId: user.id,
      tokenHash: await this.hash(rawToken),
      expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000),
    });

    const resetUrl = `${this.deps.config.adminUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const mail = passwordResetEmail({
      resetUrl,
      expiresMinutes: RESET_TTL_MINUTES,
      brand: { companyName: "Strophic", siteUrl: this.deps.config.siteUrl },
    });
    try {
      await this.deps.email.send({
        to: user.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    } catch (error) {
      // Email delivery failures must never reveal whether an account exists.
      console.error("[auth] password reset email failed:", error);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
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
    // Force re-login everywhere after a password change.
    await this.deps.repos.refreshTokens.revokeAllForUser(record.userId);
  }

  /** Authenticated password change. Verifies the current password, then revokes all sessions. */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.deps.repos.users.findById(userId);
    if (!user) throw new UnauthorizedError();
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestError("Current password is incorrect");
    await this.deps.repos.users.updatePassword(userId, await hashPassword(newPassword));
    await this.deps.repos.refreshTokens.revokeAllForUser(userId);
  }
}
