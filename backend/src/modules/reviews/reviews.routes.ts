import type { FastifyInstance, FastifyRequest } from "fastify";
import { ReviewsService } from "./reviews.service.js";
import { AppError } from "../../shared/errors.js";
import { z } from "zod";

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

export function registerReviewsRoutes(app: FastifyInstance, reviewsService: ReviewsService) {
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
}
