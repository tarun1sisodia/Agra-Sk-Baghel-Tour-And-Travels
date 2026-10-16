import { apiFetch } from "@/lib/api";
import type { CatalogStatus, TourPackageItem } from "./tour-packages.types";

export interface TourPackageFilter {
  status?: CatalogStatus | "all";
  q?: string;
}

export async function fetchAdminTourPackages(filter?: TourPackageFilter): Promise<TourPackageItem[]> {
  const params = new URLSearchParams();
  if (filter?.status && filter.status !== "all") params.set("status", filter.status);
  if (filter?.q?.trim()) params.set("q", filter.q.trim());
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages${params.toString() ? `?${params}` : ""}`);
  if (!json?.data) {
    throw new Error(json?.error?.message || "Failed to fetch tour packages.");
  }
  return json.data.items ?? json.data;
}

export async function fetchAdminTourPackage(id: string): Promise<TourPackageItem> {
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages/${encodeURIComponent(id)}`);
  if (!json?.data) {
    throw new Error(json?.error?.message || "Failed to load tour package.");
  }
  return json.data;
}

export async function createAdminTourPackage(payload: Record<string, unknown>): Promise<TourPackageItem> {
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!json?.data) {
    throw new Error(json?.error?.message || "Failed to create tour package.");
  }
  return json.data;
}

export async function updateAdminTourPackage(id: string, payload: Record<string, unknown>): Promise<TourPackageItem> {
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!json?.data) {
    throw new Error(json?.error?.message || "Failed to update tour package.");
  }
  return json.data;
}

export async function publishAdminTourPackage(id: string): Promise<TourPackageItem> {
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages/${encodeURIComponent(id)}/publish`, {
    method: "POST",
    body: "{}",
  });
  if (!json?.data) {
    throw new Error(json?.error?.message || "Failed to publish tour package.");
  }
  return json.data;
}

export async function archiveAdminTourPackage(id: string): Promise<TourPackageItem> {
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages/${encodeURIComponent(id)}/archive`, {
    method: "POST",
    body: "{}",
  });
  if (!json?.data) {
    throw new Error(json?.error?.message || "Failed to archive tour package.");
  }
  return json.data;
}

export async function deleteAdminTourPackage(id: string): Promise<void> {
  await apiFetch(`/api/v1/ops/admin/tour-packages/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function checkTourPackageCode(code: string): Promise<{ available: boolean }> {
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages/check-code?code=${encodeURIComponent(code)}`);
  if (!json?.data || typeof json.data.available !== "boolean") {
    throw new Error(json?.error?.message || "Failed to check package code availability.");
  }
  return json.data;
}

export async function uploadTourPackageImage(payload: {
  dataBase64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/avif";
  altText?: string;
  caption?: string;
}): Promise<{ url: string; alt?: string; caption?: string }> {
  const json = await apiFetch(`/api/v1/ops/admin/tour-packages/upload-image`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!json?.data?.url) {
    throw new Error(json?.error?.message || "Upload failed: server did not return an image URL.");
  }
  return json.data;
}
