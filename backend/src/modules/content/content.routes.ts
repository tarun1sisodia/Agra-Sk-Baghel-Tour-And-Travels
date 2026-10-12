// backend/src/modules/content/content.routes.ts
import type { FastifyInstance } from "fastify";
import { requireRole, SUPER_ADMIN_ROLES } from "../../middlewares/roleGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { getLatestReleaseAttempt } from "../../shared/deploy-hook.js";
import type { createCancellationPoliciesService } from "../cancellation-policies/cancellation-policies.service.js";
import type { createMonumentsService } from "../monuments/monuments.service.js";
import type { createPetPolicyService } from "../pet-policy/pet-policy.service.js";
import type { createCompanyProfileService } from "../company-profile/company-profile.service.js";
import type { createDossierSignoffsService } from "../dossier-signoffs/dossier-signoffs.service.js";

export async function registerContentManifestRoutes(
  app: FastifyInstance,
  deps: {
    cancellationPoliciesService: ReturnType<typeof createCancellationPoliciesService>;
    monumentsService: ReturnType<typeof createMonumentsService>;
    petPolicyService: ReturnType<typeof createPetPolicyService>;
    companyProfileService: ReturnType<typeof createCompanyProfileService>;
    dossierSignoffsService: ReturnType<typeof createDossierSignoffsService>;
  }
): Promise<void> {
  // Combined content manifest for public / build consumption
  const manifestHandler = async (_request: any, reply: any) => {
    const [cancellationPolicies, monuments, petPolicy, companyProfile, dossierSignoffs] =
      await Promise.all([
        deps.cancellationPoliciesService.list(),
        deps.monumentsService.list(),
        deps.petPolicyService.get(),
        deps.companyProfileService.get(),
        deps.dossierSignoffsService.list(),
      ]);

    return sendSuccess(reply, {
      cancellationPolicies,
      monuments,
      petPolicy,
      companyProfile,
      dossierSignoffs,
    });
  };

  app.get("/api/v1/content/manifest", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: manifestHandler,
  });

  app.get("/content/manifest", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: manifestHandler,
  });

  app.get("/api/v1/content/release/latest", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: async (_request, reply) => {
      const latest = getLatestReleaseAttempt();
      return sendSuccess(reply, {
        available: Boolean(latest),
        release: latest
          ? {
              correlationId: latest.correlationId,
              releaseState: latest.releaseState,
              deployHookStatus: latest.status,
              deployHookConfigured: latest.deployHookConfigured,
              reason: latest.reason,
              entityType: latest.entityType,
              entityId: latest.entityId,
              slug: latest.slug,
              sourceVersion: latest.sourceVersion,
              attemptedAt: latest.attemptedAt,
              message: latest.message,
            }
          : null,
      });
    },
  });

  app.get("/api/v1/ops/admin/releases/latest", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: async (request, reply) => {
      requireRole(request, SUPER_ADMIN_ROLES);
      return sendSuccess(reply, getLatestReleaseAttempt());
    },
  });
}
