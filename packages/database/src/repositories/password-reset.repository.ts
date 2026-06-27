import type { PrismaClient } from "../generated/prisma/client";

export interface CreatePasswordResetInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export class PasswordResetTokenRepository {
  constructor(private readonly db: PrismaClient) {}

  create(data: CreatePasswordResetInput) {
    return this.db.passwordResetToken.create({ data });
  }

  findByHash(tokenHash: string) {
    return this.db.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  markUsed(id: string) {
    return this.db.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  }

  /** Invalidate any outstanding reset tokens for a user (e.g. before issuing a new one). */
  invalidateAllForUser(userId: string) {
    return this.db.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
