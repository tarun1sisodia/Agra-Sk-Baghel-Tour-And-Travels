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
  app.get("/public/reviews", async (_req, reply) => {
    const reviews = await reviewsService.getPublicReviews();
    return reply.send({ success: true, reviews });
  });

  // Public gallery
  app.get("/public/gallery", async (_req, reply) => {
    const gallery = await reviewsService.getPublicGallery();
    return reply.send({ success: true, gallery });
  });

  // Review link lookup
  app.get("/reviews/links/:token", async (req: FastifyRequest<{ Params: { token: string } }>, reply) => {
    try {
      const res = await reviewsService.getLinkByToken(req.params.token);
      return reply.send({ success: true, ...res });
    } catch (err: any) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({ error: err.code, message: err.message });
      }
      throw err;
    }
  });

  // Submit review
  app.post(
    "/reviews/links/:token/submissions",
    async (req: FastifyRequest<{ Params: { token: string } }>, reply) => {
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
    }
  );

  // Admin QR link creation
  app.post("/admin/review-links", async (req, reply) => {
    const actor = getActor(req);
    if (actor.role !== "super_admin" && actor.role !== "review_moderator") {
      throw new AppError("FORBIDDEN", "Review moderator role required", 403);
    }
    const body = req.body as { label?: string; prefill?: Record<string, any> };
    const res = await reviewsService.createQrLink(body?.label, body?.prefill, actor.id);
    return reply.status(201).send({ success: true, ...res });
  });

  // Admin booking review request email
  app.post(
    "/admin/bookings/:id/review-request",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const actor = getActor(req);
      if (actor.role !== "super_admin" && actor.role !== "review_moderator") {
        throw new AppError("FORBIDDEN", "Review moderator role required", 403);
      }
      const res = await reviewsService.createBookingLink(req.params.id, actor.id);
      return reply.status(201).send({ success: true, ...res });
    }
  );

  // Admin moderation
  app.patch(
    "/admin/review-submissions/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
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
    }
  );
}
