import type { PrismaClient } from "../generated/prisma/client";

export interface CreateMediaInput {
  key: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  folderId?: string | null;
  uploadedById?: string | null;
}

export interface ListMediaOptions {
  skip?: number;
  take?: number;
  folderId?: string | null;
}

export class MediaRepository {
  constructor(private readonly db: PrismaClient) {}

  create(data: CreateMediaInput) {
    return this.db.media.create({ data });
  }

  findById(id: string) {
    return this.db.media.findUnique({ where: { id } });
  }

  findByKey(key: string) {
    return this.db.media.findUnique({ where: { key } });
  }

  async list({ skip = 0, take = 20, folderId }: ListMediaOptions = {}) {
    const where = folderId === undefined ? {} : { folderId };
    const [items, total] = await Promise.all([
      this.db.media.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      this.db.media.count({ where }),
    ]);
    return { items, total };
  }

  delete(id: string) {
    return this.db.media.delete({ where: { id } });
  }
}
