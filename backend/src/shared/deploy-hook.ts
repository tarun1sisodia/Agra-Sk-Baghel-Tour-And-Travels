// backend/src/shared/deploy-hook.ts
// Shared frontend deploy hook trigger for Cloudflare Pages rebuilds.
// A successful database publish is not the same as a customer deployment.

import { getCorrelationId } from "./request-context.js";

export type DeployHookInput = {
  reason?: string;
  correlationId?: string;
  entityType?: string;
  entityId?: string;
  slug?: string;
  sourceVersion?: number | string;
};

export type ReleaseState =
  | "database_saved"
  | "publish_committed"
  | "release_queued"
  | "release_building"
  | "release_deployed"
  | "release_failed";

export type DeployHookResult = {
  status: "hook_missing" | "queued" | "hook_failed" | "verified";
  releaseState: Extract<ReleaseState, "publish_committed" | "release_queued" | "release_failed" | "release_deployed">;
  correlationId: string | null;
  reason: string | null;
  entityType: string | null;
  entityId: string | null;
  slug: string | null;
  sourceVersion: number | string | null;
  httpStatus: number | null;
  message: string;
  attemptedAt: string;
};

export type ReleaseAttemptRecord = DeployHookResult & {
  deployHookConfigured: boolean;
};

let latestReleaseAttempt: ReleaseAttemptRecord | null = null;

function normalizeInput(reasonOrInput?: string | DeployHookInput): DeployHookInput {
  if (typeof reasonOrInput === "string") {
    return { reason: reasonOrInput };
  }
  return reasonOrInput ?? {};
}

export function recordAttempt(result: DeployHookResult): DeployHookResult {
  latestReleaseAttempt = {
    ...result,
    deployHookConfigured: result.status !== "hook_missing",
  };
  const logPayload = {
    correlationId: result.correlationId,
    reason: result.reason,
    entityType: result.entityType,
    entityId: result.entityId,
    slug: result.slug,
    sourceVersion: result.sourceVersion,
    releaseState: result.releaseState,
    deployHookStatus: result.status,
    httpStatus: result.httpStatus,
  };
  if (result.status === "queued" || result.status === "verified") {
    console.info("[catalog-release]", logPayload);
  } else {
    console.warn("[catalog-release]", { ...logPayload, message: result.message });
  }
  return result;
}

export function getLatestReleaseAttempt(): ReleaseAttemptRecord | null {
  return latestReleaseAttempt;
}

export function resetLatestReleaseAttempt(): void {
  latestReleaseAttempt = null;
}

export async function triggerFrontendRebuild(reasonOrInput?: string | DeployHookInput): Promise<DeployHookResult> {
  const input = normalizeInput(reasonOrInput);
  const correlationId = input.correlationId ?? getCorrelationId() ?? null;
  const attemptedAt = new Date().toISOString();
  const base = {
    correlationId,
    reason: input.reason ?? null,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    slug: input.slug ?? null,
    sourceVersion: input.sourceVersion ?? null,
    attemptedAt,
  };

  const hook = (process.env.CLOUDFLARE_DEPLOY_HOOK_URL || process.env.PAGES_DEPLOY_HOOK_URL)?.trim();
  if (!hook) {
    return recordAttempt({
      ...base,
      status: "hook_missing",
      releaseState: "publish_committed",
      httpStatus: null,
      message: "CLOUDFLARE_DEPLOY_HOOK_URL or PAGES_DEPLOY_HOOK_URL is not set. Database publish can succeed, but the customer site will not auto-rebuild.",
    });
  }

  try {
    const response = await fetch(hook, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(correlationId ? { "x-correlation-id": correlationId } : {}),
      },
      body: JSON.stringify({
        reason: input.reason,
        correlationId,
        entityType: input.entityType,
        entityId: input.entityId,
        slug: input.slug,
        sourceVersion: input.sourceVersion,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return recordAttempt({
        ...base,
        status: "hook_failed",
        releaseState: "release_failed",
        httpStatus: response.status,
        message: `Deploy hook returned HTTP ${response.status}. Content is published in the database; customer deployment is not confirmed.`,
      });
    }
    return recordAttempt({
      ...base,
      status: "queued",
      releaseState: "release_queued",
      httpStatus: response.status,
      message: "Deploy hook accepted the rebuild request. Deployment completion is not yet verified.",
    });
  } catch (error) {
    return recordAttempt({
      ...base,
      status: "hook_failed",
      releaseState: "release_failed",
      httpStatus: null,
      message: `Deploy hook request failed: ${error instanceof Error ? error.message : "unknown error"}. Content is published in the database; customer deployment is not confirmed.`,
    });
  }
}
