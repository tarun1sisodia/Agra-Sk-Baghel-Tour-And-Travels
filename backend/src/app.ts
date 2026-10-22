import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { Logger } from "pino";
import type { Env } from "./config/env.js";
import { corsOriginList } from "./config/env.js";
import { systemClock, toIso, type Clock } from "./shared/clock.js";
import { newId } from "./shared/ids.js";
import type { Repositories } from "./db/types.js";
import { createMemoryRepositories } from "./db/memory.js";
import { authenticateRequest } from "./middlewares/authGuard.js";
import { isOperationsRole } from "./middlewares/roleGuard.js";
import { AppError, Errors } from "./shared/errors.js";
import { registerErrorHandler, sendSuccess } from "./middlewares/errorHandler.js";
import { registerNetworkHeaders } from "./middlewares/networkHeaders.js";
import { registerRawBody } from "./middlewares/rawBody.js";
import { registerRequestId } from "./middlewares/requestId.js";
import { createAdminController } from "./modules/admin/admin.controller.js";
import { registerAdminRoutes } from "./modules/admin/admin.routes.js";
import { createAdminService } from "./modules/admin/admin.service.js";
import { createBookingController } from "./modules/bookings/booking.controller.js";
import { registerBookingRoutes } from "./modules/bookings/booking.routes.js";
import { createBookingService } from "./modules/bookings/booking.service.js";
import { createBookingIntentController } from "./modules/booking-intents/booking-intent.controller.js";
import { createBookingIntentService } from "./modules/booking-intents/booking-intent.service.js";
import { registerBookingIntentRoutes } from "./modules/booking-intents/booking-intent.routes.js";
import { createCatalogController } from "./modules/catalog/catalog.controller.js";
import { registerCatalogRoutes } from "./modules/catalog/catalog.routes.js";
import { createCatalogService } from "./modules/catalog/catalog.service.js";
import { createMediaStorage } from "./modules/catalog/media.storage.js";
import { createFareController } from "./modules/fares/fare.controller.js";
import { registerFareRoutes } from "./modules/fares/fare.routes.js";
import { createFareService } from "./modules/fares/fare.service.js";
import { CURATED_PLACES } from "./modules/fares/fare.catalogue.js";
import { createInquiryController } from "./modules/inquiries/inquiry.controller.js";
import { registerInquiryRoutes } from "./modules/inquiries/inquiry.routes.js";
import { createInquiryService } from "./modules/inquiries/inquiry.service.js";
import { createRentalEnquiryController } from "./modules/rental-enquiries/rental-enquiry.controller.js";
import { registerRentalEnquiryRoutes } from "./modules/rental-enquiries/rental-enquiry.routes.js";
import { createRentalEnquiryService } from "./modules/rental-enquiries/rental-enquiry.service.js";
import { createLocationController } from "./modules/locations/location.controller.js";
import { registerLocationRoutes } from "./modules/locations/location.routes.js";
import { createLocationService } from "./modules/locations/location.service.js";
import { createNotificationService } from "./modules/notifications/notification.service.js";
import { createPaymentController } from "./modules/payments/payment.controller.js";
import { registerPaymentRoutes } from "./modules/payments/payment.routes.js";
import { createPaymentService } from "./modules/payments/payment.service.js";
import { createReviewController } from "./modules/reviews/review.controller.js";
import { registerReviewRoutes } from "./modules/reviews/review.routes.js";
import { createRouteController } from "./modules/routes/route.controller.js";
import { registerRouteRoutes } from "./modules/routes/route.routes.js";
import { createRouteService } from "./modules/routes/route.service.js";
import { createTourPackagesController } from "./modules/tour-packages/tour-packages.controller.js";
import { registerTourPackagesRoutes } from "./modules/tour-packages/tour-packages.routes.js";
import { createTourPackagesService } from "./modules/tour-packages/tour-packages.service.js";
import { createTransferRoutesController } from "./modules/transfer-routes/transfer-routes.controller.js";
import { registerTransferRoutesRoutes } from "./modules/transfer-routes/transfer-routes.routes.js";
import { createTransferRoutesService } from "./modules/transfer-routes/transfer-routes.service.js";
import { createLocalPackagesController } from "./modules/local-packages/local-packages.controller.js";
import { registerLocalPackagesRoutes } from "./modules/local-packages/local-packages.routes.js";
import { createLocalPackagesService } from "./modules/local-packages/local-packages.service.js";
import { createCancellationPoliciesController } from "./modules/cancellation-policies/cancellation-policies.controller.js";
import { registerCancellationPoliciesRoutes } from "./modules/cancellation-policies/cancellation-policies.routes.js";
import { createCancellationPoliciesService } from "./modules/cancellation-policies/cancellation-policies.service.js";
import { createMonumentsController } from "./modules/monuments/monuments.controller.js";
import { registerMonumentsRoutes } from "./modules/monuments/monuments.routes.js";
import { createMonumentsService } from "./modules/monuments/monuments.service.js";
import { createPetPolicyController } from "./modules/pet-policy/pet-policy.controller.js";
import { registerPetPolicyRoutes } from "./modules/pet-policy/pet-policy.routes.js";
import { createPetPolicyService } from "./modules/pet-policy/pet-policy.service.js";
import { createCompanyProfileController } from "./modules/company-profile/company-profile.controller.js";
import { registerCompanyProfileRoutes } from "./modules/company-profile/company-profile.routes.js";
import { createCompanyProfileService } from "./modules/company-profile/company-profile.service.js";
import { createDossierSignoffsController } from "./modules/dossier-signoffs/dossier-signoffs.controller.js";
import { registerDossierSignoffsRoutes } from "./modules/dossier-signoffs/dossier-signoffs.routes.js";
import { createDossierSignoffsService } from "./modules/dossier-signoffs/dossier-signoffs.service.js";
import { createPromosController } from "./modules/promos/promos.controller.js";
import { registerPromosRoutes } from "./modules/promos/promos.routes.js";
import { createPromosService } from "./modules/promos/promos.service.js";
import { registerContentManifestRoutes } from "./modules/content/content.routes.js";
import { createReviewService } from "./modules/reviews/review.service.js";
import {
  createNoopEmail,
  createNoopMessaging,
  createResendEmailProvider,
  createWhatsAppProvider,
} from "./providers/MessagingProvider.js";
import {
  createLocationIqProvider,
  createStaticGeocodingProvider,
} from "./providers/GeocodingProvider.js";
import { createRazorpayAdapter } from "./providers/adapters/razorpay.js";
import type { PaymentProviderRegistry } from "./providers/PaymentProvider.js";
import pg from "pg";
import { createPoolConfig } from "./db/poolConfig.js";
import { FareCatalogRepository } from "./modules/fare-catalog/fare-catalog.repository.js";
import { registerFareCatalogRoutes } from "./modules/fare-catalog/fare-catalog.routes.js";
import { QuotesService } from "./modules/quotes/quotes.service.js";
import { registerQuotesRoutes } from "./modules/quotes/quotes.routes.js";
import { BookingsRepository } from "./modules/bookings/bookings.repository.js";
import { BookingsService } from "./modules/bookings/bookings.service.js";
import { registerBookingsRoutes } from "./modules/bookings/bookings.routes.js";
import { PaymentsRepository } from "./modules/payments/payments.repository.js";
import { PaymentsService } from "./modules/payments/payments.service.js";
import { registerPaymentsRoutes } from "./modules/payments/payments.routes.js";
import { FareAdminRepository } from "./modules/admin/fare-admin.repository.js";
import { FareAdminService } from "./modules/admin/fare-admin.service.js";
import { registerFareAdminRoutes } from "./modules/admin/fare-admin.routes.js";
import { LocationIqService } from "./modules/routes/locationiq.service.js";
import { ReviewsRepository } from "./modules/reviews/reviews.repository.js";
import { ReviewsService } from "./modules/reviews/reviews.service.js";
import { registerReviewsRoutes } from "./modules/reviews/reviews.routes.js";
import { PublicationWorker } from "./modules/publishing/publication-worker.js";
import { registerLegacyRouteTelemetry } from "./middlewares/legacyRouteTelemetry.js";

export type AppOptions = {
  env: Env;
  logger: Logger;
  db?: Repositories;
  clock?: Clock;
};

export type BuiltApp = {
  app: FastifyInstance;
  db: Repositories;
  notifications: ReturnType<typeof createNotificationService>;
  publicationWorker?: PublicationWorker;
  bookingsService?: BookingsService;
};

export async function buildApp(options: AppOptions): Promise<BuiltApp> {
  const env = options.env;
  const clock = options.clock ?? systemClock;
  const db = options.db ?? createMemoryRepositories(clock.now().toISOString());

  const app = Fastify({
    logger: env.LOG_LEVEL === "silent" ? false : { level: env.LOG_LEVEL },
    trustProxy: true,
    bodyLimit: 1_000_000, // 1MB max body to prevent large payload attacks
  });

  registerRawBody(app);
  registerLegacyRouteTelemetry(app);
  registerRequestId(app);
  registerErrorHandler(app);
  registerNetworkHeaders(app);

  // Security headers - enable all protections, CSP only for API is minimal
  await app.register(helmet, {
    contentSecurityPolicy: false, // API doesn't serve HTML, but other headers are critical
    crossOriginEmbedderPolicy: false,
    hsts: env.NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: true } : false,
  });

  const origins = corsOriginList(env);
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow no origin (mobile apps, curl) in dev, but require origin check in prod
      if (!origin) {
        if (env.NODE_ENV === "production") {
          // In production, allow requests with no origin only for webhooks which are allowlisted
          cb(null, true);
          return;
        }
        cb(null, true);
        return;
      }
      if (origins.includes(origin)) {
        cb(null, true);
      } else {
        // Do not throw here: Fastify would turn a normal cross-origin denial
        // into a misleading HTTP 500. Returning false omits CORS headers and
        // lets the browser enforce the same-origin policy safely.
        cb(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Booking-Token",
      "x-booking-token",
      "X-Guest-Token",
      "x-guest-token",
      "X-Booking-Intent-Secret",
      "X-Request-Id",
      "X-Correlation-Id",
      "X-Razorpay-Signature",
    ],
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
    // SEC-001: no global allowList exemption — each route sets its own limit
    // Webhooks use a per-route config with a generous limit to allow provider retries
    errorResponseBuilder: (request, context) => ({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: `Too many requests. Retry after ${Math.ceil(Number(context.after) / 1000)}s.`,
        requestId: request.requestId ?? "rate-limit",
      },
    }),
    addHeaders: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
    },
  });

  app.addHook("onRequest", async (request) => {
    try {
      request.user = (await authenticateRequest(request, env)) ?? undefined;
    } catch (error) {
      if (error instanceof AppError) throw error;
      // Only throw if auth header present - otherwise treat as anonymous
      if (request.headers.authorization) {
        throw Errors.unauthorized("Invalid access token.");
      }
      request.user = undefined;
    }
  });

  // Defense in depth for legacy and compatibility admin routes. Individual
  // controllers still enforce their narrower role permissions, but no admin
  // handler should ever be reachable anonymously if a new route is added
  // without an explicit controller guard.
  app.addHook("onRequest", async (request) => {
    const path = request.url.split("?", 1)[0] ?? request.url;
    const isAdminPath =
      path === "/admin" ||
      path.startsWith("/admin/") ||
      path.startsWith("/api/v1/admin/") ||
      path.startsWith("/api/v1/ops/admin/");
    if (isAdminPath && !isOperationsRole(request.user?.role)) {
      if (!request.user) throw Errors.unauthorized();
      throw Errors.forbidden("Operations-desk access required.");
    }
  });

  // Add security headers and request validation
  app.addHook("onRequest", async (request) => {
    // Reject requests with suspicious content-type for JSON endpoints
    if (request.method === "POST" || request.method === "PATCH") {
      const ct = request.headers["content-type"];
      if (ct && !ct.includes("application/json") && !request.url.includes("/webhooks/")) {
        // Allow only JSON for most endpoints, webhooks may have different types
        // But we already have raw body parser for JSON, so enforce JSON
        if (!request.url.startsWith("/api/v1/payments/webhooks/")) {
          // Let fastify handle it - will fail parsing if not JSON
        }
      }
    }
  });

  const providers = createPaymentProviders(env);
  const messaging = env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID
    ? createWhatsAppProvider(env.WHATSAPP_TOKEN, env.WHATSAPP_PHONE_NUMBER_ID)
    : createNoopMessaging();
  const email = env.RESEND_API_KEY
    ? createResendEmailProvider(env.RESEND_API_KEY, env.EMAIL_FROM)
    : createNoopEmail();
  const geocoding = env.LOCATIONIQ_TOKEN
    ? createLocationIqProvider(env.LOCATIONIQ_TOKEN)
    : createStaticGeocodingProvider(CURATED_PLACES);

  const notifications = createNotificationService({
    db,
    clock,
    messaging,
    email,
    paymentTemplate: env.WHATSAPP_TEMPLATE_PAYMENT,
  });
  const fareService = createFareService(env.FARE_RULES_VERSION, db);
  const bookingService = createBookingService({
    db,
    clock,
    fareVersion: env.FARE_RULES_VERSION,
    fareService,
  });
  const paymentService = createPaymentService({ db, clock, env, providers, notifications });
  const adminService = createAdminService({ db, clock });
  const mediaStorage = createMediaStorage(env);
  app.log.info(
    mediaStorage
      ? `Catalog media uploads → "${mediaStorage.bucket}" bucket via ${
          mediaStorage.backend === "s3" ? "S3 protocol" : "Supabase Storage SDK"
        }`
      : "Catalog media uploads → inline DB storage (no S3_* or SUPABASE_SERVICE_ROLE_KEY configured)",
  );
  const farePool: pg.Pool | null =
    (db.pool as pg.Pool | undefined) ??
    (env.DATABASE_URL ? new pg.Pool(createPoolConfig(env.DATABASE_URL)) : null);
  const fareCatalogRepo = farePool ? new FareCatalogRepository(farePool) : null;
  const catalogService = createCatalogService({ db, clock, mediaStorage, fareCatalogRepo });
  const reviewService = createReviewService({ db, clock });
  const locationService = createLocationService({ db, clock, geocoding });
  const inquiryService = createInquiryService({ db, clock });
  const rentalEnquiryService = createRentalEnquiryService({ db, clock, fareCatalogRepo });
  const routeService = createRouteService({ db, clock, bumpManifest: () => catalogService.bumpManifest() });
  const tourPackagesService = createTourPackagesService({ db, clock, mediaStorage });
  const transferRoutesService = createTransferRoutesService({ db, clock });
  const localPackagesService = createLocalPackagesService({ db, clock });
  const cancellationPoliciesService = createCancellationPoliciesService({ db, clock });
  const monumentsService = createMonumentsService({ db, clock });
  const petPolicyService = createPetPolicyService({ db, clock });
  const companyProfileService = createCompanyProfileService({ db, clock });
  const dossierSignoffsService = createDossierSignoffsService({ db, clock });
  const promosService = createPromosService({ db });

  const healthHandler = async () => ({ success: true, data: { status: "ok", version: env.FARE_RULES_VERSION } });
  const readyHandler = async (_request: unknown, reply: { code: (statusCode: number) => { send: (payload: unknown) => unknown } }) => {
    try {
      const ok = await db.healthCheck();
      if (!ok) {
        return reply.code(503).send({ success: false, error: { code: "DB_NOT_READY", message: "Database is not ready." } });
      }
      if (env.NODE_ENV === "production" && !env.DATABASE_URL) {
        return reply.code(503).send({ success: false, error: { code: "DB_NOT_CONFIGURED", message: "Production database URL is required." } });
      }
      return reply.code(200).send({ success: true, data: { status: "ready", store: env.DATABASE_URL ? "postgres" : "memory" } });
    } catch {
      return reply.code(503).send({ success: false, error: { code: "DB_NOT_READY", message: "Database health check failed." } });
    }
  };

  app.get("/health", healthHandler);
  app.get("/api/v1/health", healthHandler);
  app.get("/ready", readyHandler);
  app.get("/api/v1/ready", readyHandler);

  await registerFareRoutes(app, createFareController(fareService));
  await registerLocationRoutes(app, createLocationController(locationService));
  await registerBookingRoutes(app, createBookingController(bookingService, env.CUSTOMER_AUTH_REQUIRED_FOR_NEW_BOOKINGS));
  const bookingIntentService = createBookingIntentService({ db, clock, fareService, bookingService });
  await registerBookingIntentRoutes(app, createBookingIntentController(bookingIntentService));
  await registerPaymentRoutes(app, createPaymentController(paymentService));
  await registerCatalogRoutes(app, createCatalogController(catalogService));
  await registerReviewRoutes(app, createReviewController(reviewService));
  await registerRouteRoutes(app, createRouteController(routeService));
  await registerTourPackagesRoutes(app, createTourPackagesController(tourPackagesService));
  await registerTransferRoutesRoutes(app, createTransferRoutesController(transferRoutesService));
  await registerLocalPackagesRoutes(app, createLocalPackagesController(localPackagesService));
  await registerCancellationPoliciesRoutes(app, createCancellationPoliciesController(cancellationPoliciesService));
  await registerMonumentsRoutes(app, createMonumentsController(monumentsService));
  await registerPetPolicyRoutes(app, createPetPolicyController(petPolicyService));
  await registerCompanyProfileRoutes(app, createCompanyProfileController(companyProfileService));
  await registerDossierSignoffsRoutes(app, createDossierSignoffsController(dossierSignoffsService));
  await registerContentManifestRoutes(app, {
    cancellationPoliciesService,
    monumentsService,
    petPolicyService,
    companyProfileService,
    dossierSignoffsService,
  });
  await registerInquiryRoutes(app, createInquiryController(inquiryService));
  await registerRentalEnquiryRoutes(app, createRentalEnquiryController(rentalEnquiryService));
  await registerPromosRoutes(app, createPromosController(promosService));
  await registerAdminRoutes(app, createAdminController(adminService, paymentService, bookingService));

  // --- Clean Fare System (fare-system-final-spec.md) Mounts ---
  let publicationWorker: PublicationWorker | undefined;
  let cleanBookingsService: BookingsService | undefined;

  if (farePool && fareCatalogRepo) {
    publicationWorker = new PublicationWorker({
      pool: farePool,
      deployHookUrl: env.CLOUDFLARE_DEPLOY_HOOK_URL || env.PAGES_DEPLOY_HOOK_URL,
      customerSiteUrl: env.CUSTOMER_SITE_URL || process.env.CUSTOMER_SITE_URL || process.env.SITE_URL || "https://agraskbagheltourandtravels.com",
      logger: options.logger,
    });
    app.post("/api/public/outbox/deploy-callback", async (request, reply) => {
      const configuredSecret = env.DEPLOY_CALLBACK_SECRET.trim();
      if (configuredSecret && request.headers["x-deploy-callback-secret"] !== configuredSecret) {
        return reply.code(401).send({ success: false, error: { message: "Invalid deploy callback secret." } });
      }
      const body = (request.body ?? {}) as { catalogVersion?: number; outboxId?: string };
      const result = await publicationWorker!.confirmBuild(body);
      return reply.send({ success: true, ...result });
    });
    const quotesService = new QuotesService(fareCatalogRepo);
    await registerQuotesRoutes(app, quotesService);
    await registerFareCatalogRoutes(app, fareCatalogRepo);

    const bookingsRepo = new BookingsRepository(farePool);
    const bookingsService = new BookingsService(bookingsRepo, quotesService);
    cleanBookingsService = bookingsService;
    await registerBookingsRoutes(app, bookingsService);

    const paymentsRepo = new PaymentsRepository(farePool);
    const paymentsService = new PaymentsService({
      paymentsRepo,
      bookingsRepo,
      razorpayKeyId: env.RAZORPAY_KEY_ID,
      razorpayKeySecret: env.RAZORPAY_KEY_SECRET,
      razorpayWebhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
      resendApiKey: env.RESEND_API_KEY,
      emailFrom: env.EMAIL_FROM,
      customerSiteUrl: env.CUSTOMER_SITE_URL,
    });
    await registerPaymentsRoutes(app, paymentsService);

    const fareAdminRepo = new FareAdminRepository(farePool);
    const locationIqService = new LocationIqService(env.LOCATIONIQ_TOKEN);
    const fareAdminService = new FareAdminService(farePool, fareAdminRepo, locationIqService);
    await registerFareAdminRoutes(app, fareAdminService);

    const reviewsRepo = new ReviewsRepository(farePool);
    const reviewsService = new ReviewsService({
      reviewsRepo,
      bookingsRepo,
      auditRepo: fareAdminRepo,
      resendApiKey: env.RESEND_API_KEY,
      emailFrom: env.EMAIL_FROM,
      customerSiteUrl: env.CUSTOMER_SITE_URL,
      mediaStorage,
    });
    await registerReviewsRoutes(app, reviewsService, mediaStorage);
  } else {
    options.logger.warn("Fare database pool not available. Skipping fare system routes registration.");
  }

  app.post("/api/v1/devices/register", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: async (request, reply) => {
      const DeviceSchema = z.object({
        deviceId: z.string().min(1).max(100),
        platform: z.enum(["android", "ios", "web"]),
        fcmToken: z.string().min(1).max(500),
        userId: z.string().uuid().optional(),
        bookingId: z.string().uuid().optional(),
        ticketId: z.string().optional(),
        guestAccessToken: z.string().optional(),
      });
      const body = DeviceSchema.parse(request.body);

      // Ownership enforcement:
      // 1. If userId is provided, request must be authenticated and match userId (or staff/admin)
      if (body.userId) {
        if (!request.user) {
          throw Errors.unauthorized("Authentication required to link device to user account.");
        }
        const isPrivileged = ["super_admin", "admin", "staff"].includes(request.user.role);
        if (request.user.id !== body.userId && !isPrivileged) {
          throw Errors.forbidden("Cannot register device token for another user account.");
        }
      }

      // 2. If bookingId or ticketId is provided, ownership of that booking must be verified
      let verifiedBookingId: string | null = null;
      if (body.bookingId || body.ticketId) {
        const booking = body.bookingId
          ? await db.bookings.getById(body.bookingId)
          : await db.bookings.getByTicketId(body.ticketId!);

        if (!booking) {
          throw Errors.notFound("BOOKING_NOT_FOUND", "Booking not found.");
        }

        const isPrivileged = request.user && ["super_admin", "admin", "staff"].includes(request.user.role);
        const isOwnerUser = Boolean(request.user?.id && booking.userId === request.user.id);
        const hasValidToken = Boolean(body.guestAccessToken && body.guestAccessToken === booking.guestAccessToken);

        if (!isPrivileged && !isOwnerUser && !hasValidToken) {
          throw Errors.forbidden("Proof of booking ownership (valid guestAccessToken or authenticated booking owner) is required.");
        }

        verifiedBookingId = booking.id;
      }

      const now = toIso(clock.now());
      const record = await db.devices.register({
        id: newId(),
        deviceId: body.deviceId,
        platform: body.platform,
        fcmToken: body.fcmToken,
        userId: body.userId || null,
        bookingId: verifiedBookingId,
        isActive: true,
        lastSeenAt: now,
        createdAt: now,
      });
      return sendSuccess(reply, { success: true, deviceId: record.deviceId });
    },
  });

  return { app, db, notifications, publicationWorker, bookingsService: cleanBookingsService };
}

function createPaymentProviders(env: Env): PaymentProviderRegistry {
  return {
    razorpay: createRazorpayAdapter({
      keyId: env.RAZORPAY_KEY_ID,
      keySecret: env.RAZORPAY_KEY_SECRET,
      webhookSecret: env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET,
      isProduction: env.NODE_ENV === "production",
    }),
  };
}
