import { AwsClient } from "aws4fetch";
import type { StorageConfig } from "../env";
import { BadRequestError } from "../lib/errors";

/**
 * Object storage via the S3-compatible API (Supabase Storage), signed with
 * aws4fetch. The AWS SDK is intentionally avoided — it isn't portable to edge
 * runtimes and is far heavier than a SigV4 fetch wrapper.
 */
export class StorageService {
  private readonly client?: AwsClient;

  constructor(private readonly config: StorageConfig) {
    if (config.accessKeyId && config.secretAccessKey) {
      this.client = new AwsClient({
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        region: config.region,
        service: "s3",
      });
    }
  }

  private ready(): { client: AwsClient; endpoint: string } {
    if (!this.client || !this.config.endpoint) {
      throw new BadRequestError("Storage is not configured");
    }
    return { client: this.client, endpoint: this.config.endpoint };
  }

  /** Generate a short-lived presigned PUT URL the browser can upload directly to. */
  async presignPut(opts: { key: string; contentType: string; expiresSeconds?: number }): Promise<string> {
    const { client, endpoint } = this.ready();
    const expires = opts.expiresSeconds ?? 600;
    const objectUrl = `${endpoint}/${this.config.bucket}/${opts.key}?X-Amz-Expires=${expires}`;
    // allHeaders ensures Content-Type is bound into the signature (aws4fetch treats
    // content-type as unsignable by default), so the upload's MIME can't be swapped.
    const signed = await client.sign(objectUrl, {
      method: "PUT",
      headers: { "content-type": opts.contentType },
      aws: { signQuery: true, allHeaders: true },
    });
    return signed.url;
  }

  /** The public (CDN) URL for a stored object. */
  publicUrl(key: string): string {
    const base = this.config.publicUrl?.replace(/\/+$/, "") ?? "";
    return `${base}/${key}`;
  }
}
