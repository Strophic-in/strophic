import type { PrismaClient } from "../generated/prisma/client";

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  family: string;
  expiresAt: Date;
  userAgent?: string | null;
  ip?: string | null;
}

export class RefreshTokenRepository {
  constructor(private readonly db: PrismaClient) {}

  create(data: CreateRefreshTokenInput) {
    return this.db.refreshToken.create({ data });
  }

  findByHash(tokenHash: string) {
    return this.db.refreshToken.findUnique({ where: { tokenHash } });
  }

  /**
   * Atomically rotate: revoke the old token ONLY IF it is still un-revoked, then
   * issue the replacement. The conditional revoke (updateMany guarded by
   * `revokedAt: null`) prevents a read-then-write race where two concurrent
   * requests with the same token both mint a new one. Returns `null` if the old
   * token was already revoked/rotated (caller should treat as an invalid session).
   */
  rotate(oldId: string, replacement: CreateRefreshTokenInput) {
    return this.db.$transaction(async (tx) => {
      const revoked = await tx.refreshToken.updateMany({
        where: { id: oldId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (revoked.count === 0) return null;
      const created = await tx.refreshToken.create({ data: replacement });
      await tx.refreshToken.update({ where: { id: oldId }, data: { replacedById: created.id } });
      return created;
    });
  }

  revoke(id: string) {
    return this.db.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  /** Reuse detected → revoke the whole rotation chain. */
  revokeFamily(family: string) {
    return this.db.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllForUser(userId: string) {
    return this.db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Housekeeping: drop expired/long-revoked rows. */
  deleteExpired(now: Date = new Date()) {
    return this.db.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } });
  }
}
