import { generateId } from "@strophic/auth";
import type { Media, Repositories } from "@strophic/database";
import { MAX_UPLOAD_BYTES } from "@strophic/validation";
import type { AppConfig } from "../../env";
import { BadRequestError, NotFoundError } from "../../lib/errors";
import type { StorageService } from "../../services/storage.service";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

function sanitizeFolder(folder?: string): string | undefined {
  if (!folder) return undefined;
  const clean = folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "");
  return clean.length > 0 ? clean : undefined;
}

export interface PresignResult {
  key: string;
  uploadUrl: string;
  publicUrl: string;
}

export class MediaService {
  constructor(
    private readonly deps: { repos: Repositories; storage: StorageService; config: AppConfig },
  ) {}

  /** Validate, derive a server-side key, and return a presigned PUT URL. */
  async createPresignedUpload(input: {
    filename: string;
    contentType: string;
    size: number;
    folder?: string;
  }): Promise<PresignResult> {
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
  persist(
    input: {
      key: string;
      contentType: string;
      size: number;
      alt?: string;
      width?: number;
      height?: number;
    },
    uploadedById: string,
  ): Promise<Media> {
    return this.deps.repos.media.create({
      key: input.key,
      url: this.deps.storage.publicUrl(input.key),
      mimeType: input.contentType,
      size: input.size,
      alt: input.alt ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      uploadedById,
    });
  }

  list(opts: { skip: number; take: number }) {
    return this.deps.repos.media.list(opts);
  }

  async remove(id: string): Promise<void> {
    const media = await this.deps.repos.media.findById(id);
    if (!media) throw new NotFoundError("Media not found");
    await this.deps.repos.media.delete(id);
    // Deleting the underlying storage object is handled in the Phase 4 media library.
  }
}
