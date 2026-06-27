import type { PrismaClient, Role } from "../generated/prisma/client";

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
  role?: Role;
}

export class UserRepository {
  constructor(private readonly db: PrismaClient) {}

  findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }

  create(data: CreateUserInput) {
    return this.db.user.create({ data });
  }

  updateLastLogin(id: string) {
    return this.db.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }

  updatePassword(id: string, passwordHash: string) {
    return this.db.user.update({ where: { id }, data: { passwordHash } });
  }
}
