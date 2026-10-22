import { afterEach, describe, expect, it } from "vitest";
import { createTestApp } from "../helpers.js";
import { registerReviewsRoutes } from "../../src/modules/reviews/reviews.routes.js";
import { ReviewsService, type ReviewsServiceDeps } from "../../src/modules/reviews/reviews.service.js";
import type {
  ReviewImageEntity,
  ReviewsRepository,
  ReviewLinkEntity,
  ReviewSubmissionEntity,
} from "../../src/modules/reviews/reviews.repository.js";

class RouteReviewsRepository {
  readonly links = new Map<string, ReviewLinkEntity>();
  readonly submissions = new Map<string, ReviewSubmissionEntity>();
  readonly images = new Map<string, ReviewImageEntity>();
  readonly publishEvents: Array<{ entityId: string; eventType: string }> = [];

  async createReviewLink(data: Parameters<ReviewsRepository["createReviewLink"]>[0]): Promise<ReviewLinkEntity> {
    const id = `link-${this.links.size + 1}`;
    const link: ReviewLinkEntity = {
      id,
      kind: data.kind,
      token_hash: data.token_hash,
      booking_id: data.booking_id ?? null,
      label: data.label ?? null,
      prefill: data.prefill ?? {},
      expires_at: data.expires_at ?? null,
      revoked_at: null,
      used_at: null,
      email_sent_at: null,
      email_last_error: null,
      created_by: data.created_by ?? null,
      created_at: new Date().toISOString(),
    };
    this.links.set(id, link);
    return link;
  }

  async getReviewLinkByHash(tokenHash: string): Promise<ReviewLinkEntity | null> {
    return [...this.links.values()].find((link) => link.token_hash === tokenHash) ?? null;
  }

  async getReviewLinkById(id: string): Promise<ReviewLinkEntity | null> {
    return this.links.get(id) ?? null;
  }

  async markLinkUsed(id: string): Promise<void> {
    const link = this.links.get(id);
    if (link) link.used_at = new Date().toISOString();
  }

  async createSubmission(data: Parameters<ReviewsRepository["createSubmission"]>[0]): Promise<ReviewSubmissionEntity> {
    const id = `submission-${this.submissions.size + 1}`;
    const submission: ReviewSubmissionEntity = {
      id,
      link_id: data.link_id,
      booking_id: data.booking_id ?? null,
      display_name: data.display_name,
      rating: data.rating ?? null,
      review_text: data.review_text,
      tour_name: data.tour_name ?? null,
      route_text: data.route_text ?? null,
      social_platform: data.social_platform ?? null,
      social_username: data.social_username ?? null,
      consent_public: data.consent_public,
      status: "pending",
      show_on_homepage: false,
      show_in_gallery: false,
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: null,
      created_at: new Date().toISOString(),
    };
    this.submissions.set(id, submission);
    return submission;
  }

  async getSubmissionById(id: string): Promise<ReviewSubmissionEntity | null> {
    return this.submissions.get(id) ?? null;
  }

  async updateSubmission(id: string, changes: Record<string, unknown>): Promise<ReviewSubmissionEntity> {
    const submission = this.submissions.get(id);
    if (!submission) throw new Error(`Missing submission ${id}`);
    for (const [key, value] of Object.entries(changes)) {
      if (value !== undefined) (submission as unknown as Record<string, unknown>)[key] = value;
    }
    submission.reviewed_at = new Date().toISOString();
    return submission;
  }

  async getPublicReviews(): Promise<Array<ReviewSubmissionEntity & { is_verified: boolean }>> {
    return [...this.submissions.values()]
      .filter((submission) => submission.status === "approved" && submission.consent_public && submission.show_on_homepage)
      .map((submission) => ({ ...submission, is_verified: Boolean(submission.booking_id) }));
  }

  async getPublicGallery(): Promise<Array<ReviewImageEntity & { reviewer_name: string; review_text: string }>> {
    return [...this.images.values()]
      .filter((image) => image.status === "approved")
      .flatMap((image) => {
        const submission = this.submissions.get(image.submission_id);
        return submission?.status === "approved" && submission.consent_public && submission.show_in_gallery
          ? [{ ...image, reviewer_name: submission.display_name, review_text: submission.review_text }]
          : [];
      });
  }

  async listAdminSubmissions(): Promise<Array<ReviewSubmissionEntity & { images: ReviewImageEntity[] }>> {
    return [...this.submissions.values()].map((submission) => ({ ...submission, images: [] }));
  }

  async enqueuePublishEvent(entityId: string, eventType: string): Promise<void> {
    this.publishEvents.push({ entityId, eventType });
  }
}

class RouteAuditRepository {
  readonly entries: unknown[] = [];

  async recordAudit(entry: unknown): Promise<string> {
    this.entries.push(entry);
    return `audit-${this.entries.length}`;
  }
}

async function buildReviewRouteFixture() {
  const repository = new RouteReviewsRepository();
  const audit = new RouteAuditRepository();
  const service = new ReviewsService({
    reviewsRepo: repository as unknown as ReviewsRepository,
    bookingsRepo: { getById: async () => null } as unknown as ReviewsServiceDeps["bookingsRepo"],
    auditRepo: audit as unknown as ReviewsServiceDeps["auditRepo"],
    resendApiKey: "",
    customerSiteUrl: "https://agraskbagheltourandtravels.com",
  });
  const { app } = await createTestApp();
  registerReviewsRoutes(app, service);
  return { app, repository, audit, service };
}

describe("registered review route consent behavior", () => {
  const apps: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    while (apps.length) await apps.pop()!.close();
  });

  it("GET /api/v1/public/reviews exposes only approved reviews with public consent", async () => {
    const fixture = await buildReviewRouteFixture();
    apps.push(fixture.app);

    const pending = await fixture.service.createQrLink("pending");
    await fixture.service.submitReview(pending.token, {
      display_name: "Pending reviewer",
      review_text: "Still waiting for moderation",
      consent_public: true,
    });

    const privateLink = await fixture.service.createQrLink("private");
    const privateSubmission = await fixture.service.submitReview(privateLink.token, {
      display_name: "Private reviewer",
      review_text: "This should remain private",
      consent_public: false,
    });

    const publicLink = await fixture.service.createQrLink("public");
    const publicSubmission = await fixture.service.submitReview(publicLink.token, {
      display_name: "Public reviewer",
      review_text: "Approved for the homepage",
      consent_public: true,
    });

    await fixture.service.moderateSubmission(
      privateSubmission.id,
      { status: "approved" },
      { id: "moderator-1", role: "review_moderator" },
      "route-private",
    );
    await fixture.service.moderateSubmission(
      publicSubmission.id,
      { status: "approved", show_on_homepage: true },
      { id: "moderator-1", role: "review_moderator" },
      "route-public",
    );

    const response = await fixture.app.inject({ method: "GET", url: "/api/v1/public/reviews" });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.reviews.map((review: { id: string }) => review.id)).toEqual([publicSubmission.id]);
    expect(body.reviews[0]).toMatchObject({
      display_name: "Public reviewer",
      review_text: "Approved for the homepage",
    });
    expect(body.reviews[0]).not.toHaveProperty("consent_public");
    expect(body.reviews[0]).not.toHaveProperty("show_on_homepage");
  });

  it("PATCH /api/v1/admin/review-submissions/:id refuses homepage publication without consent", async () => {
    const fixture = await buildReviewRouteFixture();
    apps.push(fixture.app);
    const link = await fixture.service.createQrLink("no consent");
    const submission = await fixture.service.submitReview(link.token, {
      display_name: "Private reviewer",
      review_text: "Do not publish this review",
      consent_public: false,
    });

    const response = await fixture.app.inject({
      method: "PATCH",
      url: `/api/v1/admin/review-submissions/${submission.id}`,
      headers: { authorization: "Bearer test-review_moderator" },
      payload: { status: "approved", show_on_homepage: true },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: "VALIDATION_ERROR",
      message: expect.stringContaining("without customer consent"),
    });
    expect(fixture.repository.submissions.get(submission.id)).toMatchObject({
      status: "pending",
      show_on_homepage: false,
    });
    expect(fixture.audit.entries).toHaveLength(0);
  });

  it("POST /api/v1/ops/admin/reviews/:id/publish returns the consent error and leaves audit unchanged", async () => {
    const fixture = await buildReviewRouteFixture();
    apps.push(fixture.app);
    const link = await fixture.service.createQrLink("publish guard");
    const submission = await fixture.service.submitReview(link.token, {
      display_name: "Private reviewer",
      review_text: "Consent is required before publishing",
      consent_public: false,
    });

    const response = await fixture.app.inject({
      method: "POST",
      url: `/api/v1/ops/admin/reviews/${submission.id}/publish`,
      headers: { authorization: "Bearer test-super_admin" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: "VALIDATION_ERROR",
      message: expect.stringContaining("without customer consent"),
    });
    expect(fixture.audit.entries).toHaveLength(0);
    expect(fixture.repository.publishEvents).toHaveLength(0);
  });
});
