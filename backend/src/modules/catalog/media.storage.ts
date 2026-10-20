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
  readonly backend: "s3" | "supabase-sdk";
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

function createS3MediaStorage(env: Env): MediaStorage | null {
  if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) return null;
  const bucket = env.CATALOG_MEDIA_BUCKET || "documents";
  const client = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION || "us-east-1",
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
          `Could not upload the image to the "${bucket}" S3 bucket at ${env.S3_ENDPOINT}: ${
            err instanceof Error ? err.message : "unknown error"
          }. Check the endpoint, region, access key and that the bucket exists.`,
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

function createSupabaseSdkMediaStorage(env: Env): MediaStorage | null {
  const client = createSupabaseAdmin(env);
  if (!client) return null;
  const bucket = env.CATALOG_MEDIA_BUCKET || "documents";

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

export function createMediaStorage(env: Env): MediaStorage | null {
  return createS3MediaStorage(env) ?? createSupabaseSdkMediaStorage(env);
}
