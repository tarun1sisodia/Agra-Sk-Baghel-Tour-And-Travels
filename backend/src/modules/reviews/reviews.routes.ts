import type { FastifyInstance, FastifyRequest } from "fastify";
import { ReviewsService } from "./reviews.service.js";
import { AppError } from "../../shared/errors.js";
import { z } from "zod";
import type { MediaStorage } from "../catalog/media.storage.js";
import { mimeTypeForPath } from "../catalog/media.storage.js";

function getActor(req: FastifyRequest) {
  const user = (req as any).user;
  if (!user) {
    throw new AppError("FORBIDDEN", "Authentication required", 401);
  }
  return { id: user.id || "00000000-0000-0000-0000-000000000001", role: user.role };
}

const SubmissionInputSchema = z.object({
  display_name: z.string().min(1),
  rating: z.number().int().min(1).max(5).optional(),
  review_text: z.string().min(1),
  tour_name: z.string().optional(),
  route_text: z.string().optional(),
  social_platform: z.enum(["instagram", "facebook", "youtube", "x", "linkedin"]).optional(),
  social_username: z.string().optional(),
  consent_public: z.boolean(),
  photos: z
    .array(
      z.object({
        storage_key: z.string().min(1),
        width: z.number().int().optional(),
        height: z.number().int().optional(),
        alt_text: z.string().optional(),
      })
    )
    .max(5)
    .optional(),
});

export function registerReviewsRoutes(app: FastifyInstance, reviewsService: ReviewsService, mediaStorage?: MediaStorage | null) {
  // Public reviews
  const getPublicReviewsHandler = async (_req: any, reply: any) => {
    const reviews = await reviewsService.getPublicReviews();
    return reply.send({ success: true, reviews });
  };
  app.get("/public/reviews", getPublicReviewsHandler);
  app.get("/api/v1/public/reviews", getPublicReviewsHandler);

  // Public gallery
  const getPublicGalleryHandler = async (_req: any, reply: any) => {
    const gallery = await reviewsService.getPublicGallery();
    return reply.send({ success: true, gallery });
  };
  app.get("/public/gallery", getPublicGalleryHandler);
  app.get("/api/v1/public/gallery", getPublicGalleryHandler);

  const reviewMediaHandler = async (req: FastifyRequest<{ Params: { id: string } }>, reply: any) => {
    if (!mediaStorage) return reply.status(404).send({ error: "MEDIA_NOT_FOUND" });
    const image = await reviewsService.getReviewImageById(req.params.id);
    if (!image || image.status !== "approved") return reply.status(404).send({ error: "MEDIA_NOT_FOUND" });
    if (!image.storage_key.startsWith("reviews/") || image.storage_key.includes("..")) return reply.status(404).send({ error: "MEDIA_NOT_FOUND" });
    try {
      const buffer = await mediaStorage.download(image.storage_key);
      reply.header("content-type", mimeTypeForPath(image.storage_key) ?? "image/jpeg").header("cache-control", "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, stale-if-error=604800, immutable").header("x-content-type-options", "nosniff");
      return reply.send(buffer);
    } catch { return reply.status(404).send({ error: "MEDIA_NOT_FOUND" }); }
  };
  app.get("/public/review-media/:id", reviewMediaHandler);
  app.get("/api/v1/public/review-media/:id", reviewMediaHandler);

  // Review link lookup
  const getLinkHandler = async (req: FastifyRequest<{ Params: { token: string } }>, reply: any) => {
    try {
      const res = await reviewsService.getLinkByToken(req.params.token);
      return reply.send({ success: true, ...res });
    } catch (err: any) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({ error: err.code, message: err.message });
      }
      throw err;
    }
  };
  app.get("/reviews/links/:token", getLinkHandler);
  app.get("/api/v1/reviews/links/:token", getLinkHandler);

  // Upload review photo. The review token is only used to authorize the
  // namespace; the client never chooses an arbitrary storage location.
  const uploadPhotoHandler = async (req: FastifyRequest<{ Params: { token: string } }>, reply: any) => {
    try {
      const body = z.object({ dataBase64: z.string().min(16).max(7_000_000), mimeType: z.string().min(1).max(64) }).parse(req.body);
      const result = await reviewsService.uploadPhoto(req.params.token, body);
      return reply.status(201).send({ success: true, photo: result });
    } catch (err: any) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.code, message: err.message });
      throw err;
    }
  };
  app.post("/reviews/links/:token/photos", uploadPhotoHandler);
  app.post("/api/v1/reviews/links/:token/photos", uploadPhotoHandler);

  // Submit review
  const submitReviewHandler = async (req: FastifyRequest<{ Params: { token: string } }>, reply: any) => {
    let parsed: any;
    try {
      parsed = SubmissionInputSchema.parse(req.body);
    } catch (err: any) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: err.message,
        issues: err.issues,
      });
    }

    try {
      const submission = await reviewsService.submitReview(req.params.token, parsed);
      return reply.status(201).send({ success: true, submission });
    } catch (err: any) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({ error: err.code, message: err.message });
      }
      throw err;
    }
  };
  app.post("/reviews/links/:token/submissions", submitReviewHandler);
  app.post("/api/v1/reviews/links/:token/submissions", submitReviewHandler);

  // Admin QR link creation
  const createQrLinkHandler = async (req: any, reply: any) => {
    const actor = getActor(req);
    if (actor.role !== "super_admin" && actor.role !== "review_moderator") {
      throw new AppError("FORBIDDEN", "Review moderator role required", 403);
    }
    const body = req.body as { label?: string; prefill?: Record<string, any> };
    const res = await reviewsService.createQrLink(body?.label, body?.prefill, actor.id);
    return reply.status(201).send({ success: true, ...res });
  };
  app.post("/admin/review-links", createQrLinkHandler);
  app.post("/api/v1/admin/review-links", createQrLinkHandler);

  // Admin booking review request email
  const createBookingLinkHandler = async (req: FastifyRequest<{ Params: { id: string } }>, reply: any) => {
    const actor = getActor(req);
    if (actor.role !== "super_admin" && actor.role !== "review_moderator") {
      throw new AppError("FORBIDDEN", "Review moderator role required", 403);
    }
    const res = await reviewsService.createBookingLink(req.params.id, actor.id);
    return reply.status(201).send({ success: true, ...res });
  };
  app.post("/admin/bookings/:id/review-request", createBookingLinkHandler);
  app.post("/api/v1/admin/bookings/:id/review-request", createBookingLinkHandler);

  // Admin review submissions listing (canonical + compatibility alias)
  const listAdminSubmissionsHandler = async (req: FastifyRequest, reply: any) => {
    const actor = getActor(req);
    const query = req.query as { status?: string; limit?: string; offset?: string };
    try {
      const submissions = await reviewsService.listAdminSubmissions(
        {
          status: query?.status,
          limit: query?.limit ? Number(query.limit) : undefined,
          offset: query?.offset ? Number(query.offset) : undefined,
        },
        actor
      );
      return reply.send({
        success: true,
        submissions,
        data: { items: submissions },
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({ error: err.code, message: err.message });
      }
      throw err;
    }
  };
  app.get("/admin/review-submissions", listAdminSubmissionsHandler);
  app.get("/api/v1/admin/review-submissions", listAdminSubmissionsHandler);
  app.get("/api/v1/ops/admin/reviews", listAdminSubmissionsHandler);

  // Admin moderation
  const moderateSubmissionHandler = async (req: FastifyRequest<{ Params: { id: string } }>, reply: any) => {
    const actor = getActor(req);
    const action = req.body as any;
    try {
      const updated = await reviewsService.moderateSubmission(req.params.id, action, actor, req.id);
      return reply.send({ success: true, submission: updated });
    } catch (err: any) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({ error: err.code, message: err.message });
      }
      throw err;
    }
  };
  app.patch("/admin/review-submissions/:id", moderateSubmissionHandler);
  app.patch("/api/v1/admin/review-submissions/:id", moderateSubmissionHandler);

  // Ops compatibility actions: /api/v1/ops/admin/reviews/:id/:action
  const opsActionHandler = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: any,
    action: "approve" | "reject" | "publish" | "archive" | "unpublish"
  ) => {
    const actor = getActor(req);
    const { id } = req.params;
    const body = (req.body as any) || {};

    let modAction: any = {};
    if (action === "approve") {
      modAction = { status: "approved" };
    } else if (action === "reject") {
      modAction = {
        status: "rejected",
        rejection_reason: body.reason || "Rejected during staff moderation.",
      };
    } else if (action === "publish") {
      modAction = { status: "approved", show_on_homepage: true };
    } else if (action === "archive" || action === "unpublish") {
      modAction = { show_on_homepage: false };
    }

    try {
      const updated = await reviewsService.moderateSubmission(id, modAction, actor, req.id);
      return reply.send({
        success: true,
        data: {
          id: updated.id,
          status: updated.status,
          show_on_homepage: updated.show_on_homepage,
        },
        submission: updated,
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({ error: err.code, message: err.message });
      }
      throw err;
    }
  };

  app.post("/api/v1/ops/admin/reviews/:id/approve", (req: any, reply: any) =>
    opsActionHandler(req, reply, "approve")
  );
  app.post("/api/v1/ops/admin/reviews/:id/reject", (req: any, reply: any) =>
    opsActionHandler(req, reply, "reject")
  );
  app.post("/api/v1/ops/admin/reviews/:id/publish", (req: any, reply: any) =>
    opsActionHandler(req, reply, "publish")
  );
  app.post("/api/v1/ops/admin/reviews/:id/archive", (req: any, reply: any) =>
    opsActionHandler(req, reply, "archive")
  );
  app.post("/api/v1/ops/admin/reviews/:id/unpublish", (req: any, reply: any) =>
    opsActionHandler(req, reply, "unpublish")
  );
}
