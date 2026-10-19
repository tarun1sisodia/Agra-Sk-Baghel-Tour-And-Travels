import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadEnv } from "../src/config/env.js";
import {
  SEED_AUDIT_LOGS,
  SEED_BOOKINGS,
  SEED_CATALOG_ITEMS,
  SEED_CATALOG_MEDIA,
  SEED_DEVICES,
  SEED_FARE_RULES,
  SEED_INQUIRIES,
  SEED_LOCATION_CACHE,
  SEED_NOTIFICATION_JOBS,
  SEED_PAYMENTS,
  SEED_PROFILES,
  SEED_PROMO_CODES,
  SEED_REFUNDS,
  SEED_REVIEWS,
  SEED_WEBHOOKS,
} from "../src/db/seedData.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  process.loadEnvFile?.(path.join(root, ".env"));
} catch {
  // .env may not exist in test/CI
}

interface TableSeedReport {
  table: string;
  count: number;
}

export async function seedDatabase(connectionString: string): Promise<TableSeedReport[]> {
  const client = new pg.Client({ connectionString });
  await client.connect();

  const report: TableSeedReport[] = [];

  try {
    await client.query("BEGIN");

    // 1. auth.users (if schema/table exists)
    let authUsersCount = 0;
    try {
      const hasAuthUsers = await client.query(`
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
      `);
      if ((hasAuthUsers.rowCount ?? 0) > 0) {
        for (const p of SEED_PROFILES) {
          await client.query(
            `INSERT INTO auth.users (id, email, created_at)
             VALUES ($1, $2, $3)
             ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
            [p.id, p.email, p.createdAt],
          );
          authUsersCount++;
        }
      }
    } catch {
      // Non-Supabase standalone postgres without auth schema; ignore
    }
    report.push({ table: "auth.users", count: authUsersCount });

    // 2. profiles
    let profilesCount = 0;
    for (const p of SEED_PROFILES) {
      await client.query(
        `INSERT INTO profiles (id, full_name, phone, email, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           phone = EXCLUDED.phone,
           email = EXCLUDED.email,
           role = EXCLUDED.role,
           updated_at = EXCLUDED.updated_at`,
        [p.id, p.fullName, p.phone, p.email, p.role, p.createdAt, p.updatedAt],
      );
      profilesCount++;
    }
    report.push({ table: "profiles", count: profilesCount });

    // 3. fare_rules
    let fareRulesCount = 0;
    for (const f of SEED_FARE_RULES) {
      await client.query(
        `INSERT INTO fare_rules (id, version, config, effective_from, effective_to, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (version) DO UPDATE SET
           config = EXCLUDED.config,
           effective_from = EXCLUDED.effective_from,
           effective_to = EXCLUDED.effective_to,
           is_active = EXCLUDED.is_active`,
        [f.id, f.version, JSON.stringify(f.config), f.effectiveFrom, f.effectiveTo, f.isActive, f.createdAt],
      );
      fareRulesCount++;
    }
    report.push({ table: "fare_rules", count: fareRulesCount });

    // 4. promo_codes
    let promoCount = 0;
    for (const promo of SEED_PROMO_CODES) {
      await client.query(
        `INSERT INTO promo_codes (id, code, discount_amount, min_total, description, is_active, max_redemptions, redemption_count, valid_from, valid_to)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (code) DO UPDATE SET
           discount_amount = EXCLUDED.discount_amount,
           min_total = EXCLUDED.min_total,
           description = EXCLUDED.description,
           is_active = EXCLUDED.is_active,
           max_redemptions = EXCLUDED.max_redemptions,
           redemption_count = EXCLUDED.redemption_count,
           valid_from = EXCLUDED.valid_from,
           valid_to = EXCLUDED.valid_to`,
        [
          promo.id,
          promo.code,
          promo.discountAmount,
          promo.minTotal,
          promo.description,
          promo.isActive,
          promo.maxRedemptions,
          promo.redemptionCount,
          promo.validFrom,
          promo.validTo,
        ],
      );
      promoCount++;
    }
    report.push({ table: "promo_codes", count: promoCount });

    // 5. catalog_items
    let catalogCount = 0;
    for (const item of SEED_CATALOG_ITEMS) {
      await client.query(
        `INSERT INTO catalog_items (
           id, type, slug, title, short_description, description, status,
           duration_text, route_summary, starting_price_inr, version,
           created_by, updated_by, published_at, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           title = EXCLUDED.title,
           short_description = EXCLUDED.short_description,
           description = EXCLUDED.description,
           status = EXCLUDED.status,
           duration_text = EXCLUDED.duration_text,
           route_summary = EXCLUDED.route_summary,
           starting_price_inr = EXCLUDED.starting_price_inr,
           published_at = EXCLUDED.published_at,
           updated_at = EXCLUDED.updated_at`,
        [
          item.id,
          item.type,
          item.slug,
          item.title,
          item.shortDescription,
          item.description,
          item.status,
          item.durationText,
          item.routeSummary,
          item.startingPriceInr,
          item.version,
          item.createdBy,
          item.updatedBy,
          item.publishedAt,
          item.createdAt,
          item.updatedAt,
        ],
      );
      catalogCount++;
    }
    report.push({ table: "catalog_items", count: catalogCount });

    // 6. catalog_item_media
    let mediaCount = 0;
    for (const m of SEED_CATALOG_MEDIA) {
      await client.query(
        `INSERT INTO catalog_item_media (
           id, catalog_item_id, storage_path, media_type, alt_text, caption,
           sort_order, status, source_type, copyright_owner, created_by,
           approved_by, published_at, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
           storage_path = EXCLUDED.storage_path,
           alt_text = EXCLUDED.alt_text,
           caption = EXCLUDED.caption,
           sort_order = EXCLUDED.sort_order,
           status = EXCLUDED.status`,
        [
          m.id,
          m.catalogItemId,
          m.storagePath,
          m.mediaType,
          m.altText,
          m.caption,
          m.sortOrder,
          m.status,
          m.sourceType,
          m.copyrightOwner,
          m.createdBy,
          m.approvedBy,
          m.publishedAt,
          m.createdAt,
        ],
      );
      mediaCount++;
    }
    report.push({ table: "catalog_item_media", count: mediaCount });

    // 7. bookings
    let bookingsCount = 0;
    for (const b of SEED_BOOKINGS) {
      await client.query(
        `INSERT INTO bookings (
           id, ticket_id, user_id, guest_access_token, trip_type, vehicle_tier,
           origin_name, destination_name, pickup_address, drop_address,
           pickup_datetime, return_datetime, flight_train_number, distance_km,
           customer_name, customer_phone, customer_email, base_fare,
           night_allowance, driver_allowance, discount_amount, promo_code,
           total_fare, advance_amount, balance_amount, fare_rules_version,
           fare_snapshot, status, version, special_notes, package_id,
           created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10,
           $11, $12, $13, $14,
           $15, $16, $17, $18,
           $19, $20, $21, $22,
           $23, $24, $25, $26,
           $27, $28, $29, $30, $31,
           $32, $33
         )
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           version = EXCLUDED.version,
           total_fare = EXCLUDED.total_fare,
           advance_amount = EXCLUDED.advance_amount,
           balance_amount = EXCLUDED.balance_amount,
           special_notes = EXCLUDED.special_notes,
           updated_at = EXCLUDED.updated_at`,
        [
          b.id,
          b.ticketId,
          b.userId,
          b.guestAccessToken,
          b.tripType,
          b.vehicleTier,
          b.originName,
          b.destinationName,
          b.pickupAddress,
          b.dropAddress,
          b.pickupDatetime,
          b.returnDatetime,
          b.flightTrainNumber,
          b.distanceKm,
          b.customerName,
          b.customerPhone,
          b.customerEmail,
          b.baseFare,
          b.nightAllowance,
          b.driverAllowance,
          b.discountAmount,
          b.promoCode,
          b.totalFare,
          b.advanceAmount,
          b.balanceAmount,
          b.fareRulesVersion,
          JSON.stringify(b.fareSnapshot),
          b.status,
          b.version,
          b.specialNotes,
          b.packageId,
          b.createdAt,
          b.updatedAt,
        ],
      );
      bookingsCount++;
    }
    report.push({ table: "bookings", count: bookingsCount });

    // 8. payments
    let paymentsCount = 0;
    for (const p of SEED_PAYMENTS) {
      await client.query(
        `INSERT INTO payments (
           id, booking_id, provider, provider_order_id, provider_payment_id,
           checkout_session_id, checkout_url, public_client_token,
           amount_minor, currency, inr_amount_paise, status, payment_method,
           fee_minor, tax_minor, idempotency_key, webhook_event_id,
           reconciliation_status, failure_reason, verified_at, expires_at,
           created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, $8,
           $9, $10, $11, $12, $13,
           $14, $15, $16, $17,
           $18, $19, $20, $21,
           $22, $23
         )
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           provider_payment_id = EXCLUDED.provider_payment_id,
           reconciliation_status = EXCLUDED.reconciliation_status,
           verified_at = EXCLUDED.verified_at,
           updated_at = EXCLUDED.updated_at`,
        [
          p.id,
          p.bookingId,
          p.provider,
          p.providerOrderId,
          p.providerPaymentId,
          p.checkoutSessionId,
          p.checkoutUrl,
          p.publicClientToken,
          p.amountMinor,
          p.currency,
          p.inrAmountPaise,
          p.status,
          p.paymentMethod,
          p.feeMinor,
          p.taxMinor,
          p.idempotencyKey,
          p.webhookEventId,
          p.reconciliationStatus,
          p.failureReason,
          p.verifiedAt,
          p.expiresAt,
          p.createdAt,
          p.updatedAt,
        ],
      );
      paymentsCount++;
    }
    report.push({ table: "payments", count: paymentsCount });

    // 9. refunds
    let refundsCount = 0;
    for (const r of SEED_REFUNDS) {
      await client.query(
        `INSERT INTO refunds (
           id, payment_id, booking_id, provider_refund_id, amount_minor,
           currency, reason, status, idempotency_key, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           reason = EXCLUDED.reason`,
        [
          r.id,
          r.paymentId,
          r.bookingId,
          r.providerRefundId,
          r.amountMinor,
          r.currency,
          r.reason,
          r.status,
          r.idempotencyKey,
          r.createdAt,
        ],
      );
      refundsCount++;
    }
    report.push({ table: "refunds", count: refundsCount });

    // 10. reviews
    let reviewsCount = 0;
    for (const rev of SEED_REVIEWS) {
      await client.query(
        `INSERT INTO reviews (
           id, booking_id, catalog_item_id, customer_id, display_name,
           rating, review_text, status, verification_status, social_profile_url,
           social_platform, verification_notes, reviewed_by, reviewed_at,
           published_at, guest_access_token, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         ON CONFLICT (id) DO UPDATE SET
           rating = EXCLUDED.rating,
           review_text = EXCLUDED.review_text,
           status = EXCLUDED.status,
           verification_status = EXCLUDED.verification_status,
           reviewed_by = EXCLUDED.reviewed_by,
           reviewed_at = EXCLUDED.reviewed_at,
           published_at = EXCLUDED.published_at`,
        [
          rev.id,
          rev.bookingId,
          rev.catalogItemId,
          rev.customerId,
          rev.displayName,
          rev.rating,
          rev.reviewText,
          rev.status,
          rev.verificationStatus,
          rev.socialProfileUrl,
          rev.socialPlatform,
          rev.verificationNotes,
          rev.reviewedBy,
          rev.reviewedAt,
          rev.publishedAt,
          rev.guestAccessToken,
          rev.createdAt,
        ],
      );
      reviewsCount++;
    }
    report.push({ table: "reviews", count: reviewsCount });

    // 11. inquiries
    let inquiriesCount = 0;
    for (const inq of SEED_INQUIRIES) {
      await client.query(
        `INSERT INTO inquiries (
           id, name, phone, email, message, trip_interest, status, notes, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           notes = EXCLUDED.notes,
           updated_at = EXCLUDED.updated_at`,
        [
          inq.id,
          inq.name,
          inq.phone,
          inq.email,
          inq.message,
          inq.tripInterest,
          inq.status,
          inq.notes,
          inq.createdAt,
          inq.updatedAt,
        ],
      );
      inquiriesCount++;
    }
    report.push({ table: "inquiries", count: inquiriesCount });

    // 12. admin_audit_logs
    let auditCount = 0;
    for (const log of SEED_AUDIT_LOGS) {
      await client.query(
        `INSERT INTO admin_audit_logs (
           id, actor_id, actor_role, resource_type, resource_id, action,
           before_state, after_state, reason, request_id, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          log.id,
          log.actorId,
          log.actorRole,
          log.resourceType,
          log.resourceId,
          log.action,
          log.before ? JSON.stringify(log.before) : null,
          log.after ? JSON.stringify(log.after) : null,
          log.reason,
          log.requestId,
          log.createdAt,
        ],
      );
      auditCount++;
    }
    report.push({ table: "admin_audit_logs", count: auditCount });

    // 13. notification_jobs
    let notifCount = 0;
    for (const job of SEED_NOTIFICATION_JOBS) {
      await client.query(
        `INSERT INTO notification_jobs (
           id, booking_id, channel, template_key, dedupe_key, payload,
           status, attempt_count, provider_message_id, last_error, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (dedupe_key) DO UPDATE SET
           status = EXCLUDED.status,
           attempt_count = EXCLUDED.attempt_count,
           updated_at = EXCLUDED.updated_at`,
        [
          job.id,
          job.bookingId,
          job.channel,
          job.templateKey,
          job.dedupeKey,
          JSON.stringify(job.payload),
          job.status,
          job.attemptCount,
          job.providerMessageId,
          job.lastError,
          job.createdAt,
          job.updatedAt,
        ],
      );
      notifCount++;
    }
    report.push({ table: "notification_jobs", count: notifCount });

    // 14. device_registrations
    let devicesCount = 0;
    for (const dev of SEED_DEVICES) {
      await client.query(
        `INSERT INTO device_registrations (
           id, user_id, booking_id, device_id, platform, fcm_token, is_active, last_seen_at, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           fcm_token = EXCLUDED.fcm_token,
           is_active = EXCLUDED.is_active,
           last_seen_at = EXCLUDED.last_seen_at`,
        [
          dev.id,
          dev.userId,
          dev.bookingId,
          dev.deviceId,
          dev.platform,
          dev.fcmToken,
          dev.isActive,
          dev.lastSeenAt,
          dev.createdAt,
        ],
      );
      devicesCount++;
    }
    report.push({ table: "device_registrations", count: devicesCount });

    // 15. payment_webhook_events
    let webhooksCount = 0;
    for (const w of SEED_WEBHOOKS) {
      await client.query(
        `INSERT INTO payment_webhook_events (
           id, provider, event_id, event_type, payload, processed, received_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (provider, event_id) DO UPDATE SET
           processed = EXCLUDED.processed`,
        [w.id, w.provider, w.eventId, w.eventType, JSON.stringify(w.payload), w.processed, w.receivedAt],
      );
      webhooksCount++;
    }
    report.push({ table: "payment_webhook_events", count: webhooksCount });

    // 16. location_cache
    let locationCount = 0;
    for (const loc of SEED_LOCATION_CACHE) {
      await client.query(
        `INSERT INTO location_cache (cache_key, suggestions, stored_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (cache_key) DO UPDATE SET
           suggestions = EXCLUDED.suggestions,
           stored_at = EXCLUDED.stored_at`,
        [loc.key, JSON.stringify(loc.suggestions), loc.storedAt],
      );
      locationCount++;
    }
    report.push({ table: "location_cache", count: locationCount });

    await client.query("COMMIT");
    return report;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    process.stdout.write("\n===================================================================\n");
    process.stdout.write("ℹ️  NOTE: DATABASE_URL is not set in environment or backend/.env\n");
    process.stdout.write("-------------------------------------------------------------------\n");
    process.stdout.write("The backend includes an automatic in-memory seed dataset for all 16\n");
    process.stdout.write("tables, so you can test the admin panel immediately by starting:\n\n");
    process.stdout.write("  npm run dev:all   (or npm --prefix backend run dev)\n\n");
    process.stdout.write("To seed a live PostgreSQL or Supabase instance, add DATABASE_URL\n");
    process.stdout.write("to backend/.env and re-run: npm --prefix backend run seed\n");
    process.stdout.write("===================================================================\n\n");
    return;
  }

  process.stdout.write("Seeding all 16 tables in PostgreSQL database...\n");
  const report = await seedDatabase(env.DATABASE_URL);

  process.stdout.write("\n+--------------------------+---------------+\n");
  process.stdout.write("| Table Name               | Rows Seeded   |\n");
  process.stdout.write("+--------------------------+---------------+\n");
  for (const row of report) {
    const tablePadded = row.table.padEnd(24);
    const countPadded = String(row.count).padStart(13);
    process.stdout.write(`| ${tablePadded} | ${countPadded} |\n`);
  }
  process.stdout.write("+--------------------------+---------------+\n");
  process.stdout.write("✅ Database seed completed successfully.\n\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error: unknown) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
}
