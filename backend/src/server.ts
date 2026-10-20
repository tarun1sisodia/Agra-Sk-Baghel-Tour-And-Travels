import { loadEnv } from "./config/env.js";
import { createLogger } from "./config/logger.js";
import { createRepositories } from "./db/client.js";
import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env);
  const { repos, mode } = await createRepositories(env);
  const { app, notifications, publicationWorker, bookingsService } = await buildApp({ env, logger, db: repos });

  // FIND-006: Lightweight background worker for queued notification retries
  const workerInterval = setInterval(async () => {
    try {
      await notifications.processQueued();
    } catch (err) {
      logger.error({ err }, "notification worker error");
    }
  }, 15_000);
  workerInterval.unref();

  // Background worker for site_publish_events (Cloudflare deployment outbox & verification)
  let publishInterval: NodeJS.Timeout | undefined;
  if (publicationWorker) {
    publishInterval = setInterval(async () => {
      try {
        await publicationWorker.processQueued();
      } catch (err) {
        logger.error({ err }, "publication worker error");
      }
    }, 15_000);
    publishInterval.unref();
  }

  // Background worker for auto-cancelling expired pending bookings (default 30 min)
  let expiryInterval: NodeJS.Timeout | undefined;
  if (bookingsService) {
    expiryInterval = setInterval(async () => {
      try {
        const cancelled = await bookingsService.expirePendingBookings(env.PAYMENT_PENDING_EXPIRY_MINUTES);
        if (cancelled.length > 0) {
          logger.info(
            { count: cancelled.length, bookingIds: cancelled.map((b) => b.id) },
            "auto-cancelled expired pending bookings"
          );
        }
      } catch (err) {
        logger.error({ err }, "booking expiry worker error");
      }
    }, 60_000);
    expiryInterval.unref();
  }

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "shutting down");
    clearInterval(workerInterval);
    if (publishInterval) clearInterval(publishInterval);
    if (expiryInterval) clearInterval(expiryInterval);
    await app.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));


  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  logger.info({ port: env.PORT, mode }, "SK Baghel API listening");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
