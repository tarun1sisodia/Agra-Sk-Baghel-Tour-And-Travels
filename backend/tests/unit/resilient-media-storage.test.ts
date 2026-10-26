import { describe, it, expect, vi } from "vitest";
import { createResilientDualMediaStorage, type MediaStorage } from "../../src/modules/catalog/media.storage.js";

describe("ResilientDualMediaStorage", () => {
  it("downloads from primary when primary succeeds", async () => {
    const primaryDownload = vi.fn().mockResolvedValue(Buffer.from("primary content"));
    const secondaryDownload = vi.fn();

    const primary: MediaStorage = {
      bucket: "cf-r2",
      backend: "s3",
      upload: vi.fn(),
      download: primaryDownload,
      remove: vi.fn(),
    };
    const secondary: MediaStorage = {
      bucket: "supabase",
      backend: "supabase-sdk",
      upload: vi.fn(),
      download: secondaryDownload,
      remove: vi.fn(),
    };

    const dual = createResilientDualMediaStorage(primary, secondary, {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    });

    const result = await dual.download("test/image.webp");
    expect(result.toString()).toBe("primary content");
    expect(primaryDownload).toHaveBeenCalledWith("test/image.webp");
    expect(secondaryDownload).not.toHaveBeenCalled();
  });

  it("fails over to secondary when primary download throws an error", async () => {
    const primaryDownload = vi.fn().mockRejectedValue(new Error("Primary R2 404 Not Found"));
    const secondaryDownload = vi.fn().mockResolvedValue(Buffer.from("secondary backup content"));
    const primaryUpload = vi.fn().mockResolvedValue(undefined);

    const primary: MediaStorage = {
      bucket: "cf-r2",
      backend: "s3",
      upload: primaryUpload,
      download: primaryDownload,
      remove: vi.fn(),
    };
    const secondary: MediaStorage = {
      bucket: "supabase",
      backend: "supabase-sdk",
      upload: vi.fn(),
      download: secondaryDownload,
      remove: vi.fn(),
    };

    const dual = createResilientDualMediaStorage(primary, secondary, {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    });

    const result = await dual.download("test/image.webp");
    expect(result.toString()).toBe("secondary backup content");
    expect(primaryDownload).toHaveBeenCalledWith("test/image.webp");
    expect(secondaryDownload).toHaveBeenCalledWith("test/image.webp");

    // Verifies opportunistic self-healing backfill to primary
    expect(primaryUpload).toHaveBeenCalledWith(expect.objectContaining({
      path: "test/image.webp",
      buffer: Buffer.from("secondary backup content"),
    }));
  });

  it("dual-writes on upload: writes to both primary and secondary", async () => {
    const primaryUpload = vi.fn().mockResolvedValue(undefined);
    const secondaryUpload = vi.fn().mockResolvedValue(undefined);

    const primary: MediaStorage = {
      bucket: "cf-r2",
      backend: "s3",
      upload: primaryUpload,
      download: vi.fn(),
      remove: vi.fn(),
    };
    const secondary: MediaStorage = {
      bucket: "supabase",
      backend: "supabase-sdk",
      upload: secondaryUpload,
      download: vi.fn(),
      remove: vi.fn(),
    };

    const dual = createResilientDualMediaStorage(primary, secondary, {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    });

    await dual.upload({
      path: "test/new-photo.webp",
      buffer: Buffer.from("image bytes"),
      mimeType: "image/webp",
    });

    expect(primaryUpload).toHaveBeenCalledWith({
      path: "test/new-photo.webp",
      buffer: Buffer.from("image bytes"),
      mimeType: "image/webp",
    });
    expect(secondaryUpload).toHaveBeenCalledWith({
      path: "test/new-photo.webp",
      buffer: Buffer.from("image bytes"),
      mimeType: "image/webp",
    });
  });

  it("succeeds upload to secondary even if primary fails", async () => {
    const primaryUpload = vi.fn().mockRejectedValue(new Error("R2 503 Service Unavailable"));
    const secondaryUpload = vi.fn().mockResolvedValue(undefined);

    const primary: MediaStorage = {
      bucket: "cf-r2",
      backend: "s3",
      upload: primaryUpload,
      download: vi.fn(),
      remove: vi.fn(),
    };
    const secondary: MediaStorage = {
      bucket: "supabase",
      backend: "supabase-sdk",
      upload: secondaryUpload,
      download: vi.fn(),
      remove: vi.fn(),
    };

    const dual = createResilientDualMediaStorage(primary, secondary, {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    });

    await expect(
      dual.upload({
        path: "test/new-photo.webp",
        buffer: Buffer.from("image bytes"),
        mimeType: "image/webp",
      })
    ).resolves.not.toThrow();

    expect(secondaryUpload).toHaveBeenCalled();
  });
});
