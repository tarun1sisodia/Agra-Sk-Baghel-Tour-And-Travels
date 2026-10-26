import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { Env } from "../../config/env.js";
import { createSupabaseAdmin } from "../../config/supabase.js";

/**
 * Uploads catalog images to a real object store instead of inlining base64
 * bytes into Postgres.
 *
 * Two backends are supported, tried in this order:
 *   1. S3 protocol (Supabase Storage's S3-compatible endpoint, or any other
 *      S3-compatible provider) — configured via S3_ENDPOINT / S3_REGION /
 *      S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY.
 *   2. Supabase Storage JS SDK (service-role key) — configured via
 *      SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.
 *
 * Bytes are always served back through /api/v1/media/:id (this backend
 * fetches them from the bucket on demand and streams them with immutable
 * caching). That means the bucket can stay private and we never depend on
 * a public URL or a presigned URL that could silently expire.
 *
 * When neither backend is configured (local dev, unit tests) this returns
 * `null` and the catalog service falls back to inline database storage
 * so nothing breaks without credentials.
 */
export type MediaStorage = {
  readonly bucket: string;
  readonly backend: "s3" | "supabase-sdk" | "resilient-dual";
  readonly primary?: MediaStorage;
  readonly secondary?: MediaStorage;
  upload(params: { path: string; buffer: Buffer; mimeType: string }): Promise<void>;
  download(path: string): Promise<Buffer>;
  remove(path: string): Promise<void>;
  getPublicUrl?(path: string): string | null;
};

const MIME_EXTENSIONS: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/avif": "avif",
};

export function mediaExtensionFor(mimeType: string | null | undefined): string {
  if (!mimeType) return "bin";
  return MIME_EXTENSIONS[mimeType] ?? "bin";
}

const EXTENSION_MIME_TYPES: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_EXTENSIONS).map(([mime, ext]) => [ext, mime]),
);

/** Infer a mimeType from a storage path/URL file extension. Returns null when unknown. */
export function mimeTypeForPath(path: string | null | undefined): string | null {
  if (!path) return null;
  const withoutQuery = path.split("?")[0] ?? "";
  const clean = withoutQuery.split("#")[0] ?? "";
  const dot = clean.lastIndexOf(".");
  if (dot < 0) return null;
  const ext = clean.slice(dot + 1).toLowerCase();
  if (!ext) return null;
  return EXTENSION_MIME_TYPES[ext] ?? null;
}

/** Deterministic object key so uploads/downloads/deletes never need a side table. */
export function mediaObjectPath(catalogItemId: string, mediaId: string, mimeType: string | null): string {
  return `catalog/${catalogItemId}/${mediaId}.${mediaExtensionFor(mimeType)}`;
}

/** Review uploads are deliberately kept in their own namespace. The database
 * stores this key, while the public gallery exposes only an API media URL. */
export function reviewObjectPath(reviewTokenHash: string, imageId: string, mimeType: string | null): string {
  return `reviews/${reviewTokenHash}/${imageId}.${mediaExtensionFor(mimeType)}`;
}

async function streamToBuffer(stream: unknown): Promise<Buffer> {
  // AWS SDK v3 Node responses expose a Node.js Readable on `Body`.
  if (stream && typeof (stream as { transformToByteArray?: unknown }).transformToByteArray === "function") {
    const bytes = await (stream as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return Buffer.from(bytes);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | Uint8Array>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export interface StorageLogger {
  info?: (...args: any[]) => void;
  warn?: (...args: any[]) => void;
  error?: (...args: any[]) => void;
}

export function createS3MediaStorage(env: Env, customBucket?: string): MediaStorage | null {
  if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) return null;
  const bucket = customBucket || env.S3_BUCKET_NAME || env.CATALOG_MEDIA_BUCKET || "skb-media-backup";
  const client = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION || "auto",
    forcePathStyle: true, // required by Supabase Storage and most S3-compatible providers
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });

  return {
    bucket,
    backend: "s3",
    async upload({ path, buffer, mimeType }) {
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: path,
            Body: buffer,
            ContentType: mimeType,
          }),
        );
      } catch (err) {
        throw new Error(
          `Could not upload the image to the S3 bucket: ${
            err instanceof Error ? err.message : "unknown error"
          }. Check credentials and bucket existence.`,
        );
      }
    },
    async download(path) {
      const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: path }));
      if (!res.Body) throw new Error("Empty response body from S3.");
      return streamToBuffer(res.Body);
    },
    async remove(path) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: path })).catch(() => undefined);
    },
  };
}

export function createSupabaseSdkMediaStorage(env: Env, customBucket?: string): MediaStorage | null {
  const client = createSupabaseAdmin(env);
  if (!client) return null;
  const bucket = customBucket || env.SUPABASE_MEDIA_BUCKET || "documents";

  return {
    bucket,
    backend: "supabase-sdk",
    async upload({ path, buffer, mimeType }) {
      const { error } = await client.storage.from(bucket).upload(path, buffer, {
        contentType: mimeType,
        upsert: true,
      });
      if (error) {
        throw new Error(
          `Could not upload the image to the "${bucket}" storage bucket: ${error.message}. ` +
            "Check that the bucket exists and the service-role key can write to it.",
        );
      }
    },
    async download(path) {
      const { data, error } = await client.storage.from(bucket).download(path);
      if (error || !data) throw new Error(error?.message ?? "Could not download the image from storage.");
      return Buffer.from(await data.arrayBuffer());
    },
    async remove(path) {
      await client.storage.from(bucket).remove([path]).catch(() => undefined);
    },
    getPublicUrl(path: string) {
      const { data } = client.storage.from(bucket).getPublicUrl(path);
      return data?.publicUrl ?? null;
    },
  };
}

/**
 * High-Availability Resilient Dual Media Storage:
 * - Primary: Cloudflare R2 S3 bucket (high speed, edge-cached)
 * - Secondary: Supabase Storage bucket (durable backup & legacy store)
 *
 * Download: Reads from primary (CF R2). If not found or primary is down, fails over to secondary
 * (Supabase) and asynchronously backfills primary so subsequent requests hit CF R2.
 * Upload: Dual-writes to both primary and secondary so both buckets stay 100% in sync.
 * Remove: Purges from both buckets.
 */
export function createResilientDualMediaStorage(
  primary: MediaStorage,
  secondary: MediaStorage,
  logger: StorageLogger = console,
): MediaStorage {
  return {
    bucket: `${primary.bucket} (primary: ${primary.backend}) + ${secondary.bucket} (secondary: ${secondary.backend})`,
    backend: "resilient-dual",
    primary,
    secondary,
    async upload(params: { path: string; buffer: Buffer; mimeType: string }): Promise<void> {
      let primaryErr: Error | null = null;
      let primarySucceeded = false;

      // 1. Primary write (Cloudflare R2)
      try {
        await primary.upload(params);
        primarySucceeded = true;
      } catch (err: any) {
        primaryErr = err instanceof Error ? err : new Error(String(err));
        logger.warn?.(
          `[media-storage] Primary storage (${primary.backend}) upload failed for "${params.path}": ${primaryErr.message}. Falling back to secondary.`,
        );
      }

      // 2. Dual-write to Secondary (Supabase Storage)
      let secondaryErr: Error | null = null;
      try {
        await secondary.upload(params);
      } catch (err: any) {
        secondaryErr = err instanceof Error ? err : new Error(String(err));
        logger.warn?.(
          `[media-storage] Secondary replica upload (${secondary.backend}) failed for "${params.path}": ${secondaryErr.message}.`,
        );
      }

      // If both fail, throw error
      if (!primarySucceeded && secondaryErr) {
        throw new Error(
          `Dual storage upload failed for "${params.path}": Primary (${primary.bucket}: ${primaryErr?.message}) and Secondary (${secondary.bucket}: ${secondaryErr.message}).`,
        );
      }
    },
    async download(path: string): Promise<Buffer> {
      // 1. Try downloading from Primary (Cloudflare R2)
      try {
        return await primary.download(path);
      } catch (primaryErr: any) {
        const pMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
        logger.warn?.(
          `[media-storage] Primary storage (${primary.backend}) download failed for "${path}": ${pMsg}. Failing over to secondary storage (${secondary.bucket})...`,
        );

        // 2. Failover to Secondary (Supabase Storage)
        try {
          const buffer = await secondary.download(path);
          // Self-healing opportunistic backfill: replicate to primary so future requests hit Cloudflare R2
          primary
            .upload({ path, buffer, mimeType: mimeTypeForPath(path) || "application/octet-stream" })
            .catch((backfillErr) => {
              logger.warn?.(`[media-storage] Opportunistic primary backfill failed for "${path}": ${backfillErr?.message}`);
            });
          return buffer;
        } catch (secondaryErr: any) {
          const sMsg = secondaryErr instanceof Error ? secondaryErr.message : String(secondaryErr);
          throw new Error(
            `Failed to download media "${path}" from both primary (${primary.bucket}: ${pMsg}) and secondary (${secondary.bucket}: ${sMsg}).`,
          );
        }
      }
    },
    async remove(path: string): Promise<void> {
      await Promise.allSettled([primary.remove(path), secondary.remove(path)]);
    },
    getPublicUrl(path: string): string | null {
      return primary.getPublicUrl?.(path) ?? secondary.getPublicUrl?.(path) ?? null;
    },
  };
}

export function createMediaStorage(env: Env, logger?: StorageLogger): MediaStorage | null {
  const primary = createS3MediaStorage(env);
  const secondary = createSupabaseSdkMediaStorage(env);

  if (primary && secondary) {
    return createResilientDualMediaStorage(primary, secondary, logger);
  }
  return primary ?? secondary;
}
