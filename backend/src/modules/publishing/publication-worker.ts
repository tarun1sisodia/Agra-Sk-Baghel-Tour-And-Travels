import type pg from "pg";
import type { Logger } from "pino";
import { recordAttempt } from "../../shared/deploy-hook.js";

export interface PublishEventRecord {
  id: string;
  entity_type: "outstation_route" | "local_package" | "transfer" | "tour_package" | "review";
  entity_id: string;
  event_type: "published" | "updated" | "archived" | "slug_changed" | "price_changed" | "review_approved";
  status: "pending" | "processing" | "triggered" | "succeeded" | "failed" | "superseded";
  attempt_count: number;
  next_attempt_at: string | Date;
  deployment_ref: string | null;
  last_error: string | null;
  created_at: string | Date;
  processed_at: string | Date | null;
}

export interface PublicationWorkerOptions {
  pool: pg.Pool;
  deployHookUrl?: string;
  customerSiteUrl?: string;
  cfAccountId?: string;
  cfApiToken?: string;
  cfProjectName?: string;
  logger?: Logger | { info: (...args: any[]) => void; warn: (...args: any[]) => void; error: (...args: any[]) => void; debug?: (...args: any[]) => void };
  fetchFn?: typeof fetch;
  verifyFn?: (event: PublishEventRecord) => Promise<boolean>;
  maxAttempts?: number;
}

function maskUrl(rawUrl?: string): string {
  if (!rawUrl) return "<none>";
  try {
    const u = new URL(rawUrl);
    return `${u.protocol}//${u.host}${u.pathname.slice(0, 15)}...[redacted]`;
  } catch {
    return "[redacted]";
  }
}

export class PublicationWorker {
  private pool: pg.Pool;
  private deployHookUrl?: string;
  private customerSiteUrl?: string;
  private cfAccountId?: string;
  private cfApiToken?: string;
  private cfProjectName?: string;
  private logger: { info: (...args: any[]) => void; warn: (...args: any[]) => void; error: (...args: any[]) => void; debug?: (...args: any[]) => void };
  private fetchFn: typeof fetch;
  private verifyFn?: (event: PublishEventRecord) => Promise<boolean>;
  private maxAttempts: number;

  constructor(opts: PublicationWorkerOptions) {
    this.pool = opts.pool;
    this.deployHookUrl = opts.deployHookUrl;
    this.customerSiteUrl = opts.customerSiteUrl;
    this.cfAccountId = opts.cfAccountId ?? process.env.CLOUDFLARE_ACCOUNT_ID;
    this.cfApiToken = opts.cfApiToken ?? process.env.CLOUDFLARE_API_TOKEN;
    this.cfProjectName = opts.cfProjectName ?? process.env.CLOUDFLARE_PAGES_PROJECT_CUSTOMER ?? "skbagheltravels-customer";
    this.logger = opts.logger ?? console;
    this.fetchFn = opts.fetchFn ?? fetch;
    this.verifyFn = opts.verifyFn;
    this.maxAttempts = opts.maxAttempts ?? 5;
  }

  async claimDueEvents(limit = 5): Promise<PublishEventRecord[]> {
    const res = await this.pool.query(
      `
      WITH due AS (
        SELECT id
        FROM site_publish_events
        WHERE (
          (status = 'pending' AND next_attempt_at <= NOW() AND attempt_count < $2)
          OR
          (status = 'processing' AND next_attempt_at <= NOW() - interval '5 minutes' AND attempt_count < $2)
        )
        ORDER BY created_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE site_publish_events e
      SET status = 'processing',
          attempt_count = e.attempt_count + 1,
          next_attempt_at = NOW() + interval '1 minute'
      FROM due
      WHERE e.id = due.id
      RETURNING e.*;
      `,
      [limit, this.maxAttempts]
    );
    return res.rows;
  }

  async resolveEntityData(event: PublishEventRecord): Promise<{
    expectedPath: string | null;
    expectedTitle: string | null;
    expectedImage: string | null;
    expectedFare: number | null;
    slug: string | null;
  }> {
    let expectedPath: string | null = null;
    let expectedTitle: string | null = null;
    let expectedImage: string | null = null;
    let expectedFare: number | null = null;
    let slug: string | null = null;

    if (!this.pool) {
      return { expectedPath, expectedTitle, expectedImage, expectedFare, slug };
    }

    if (event.entity_type === "tour_package") {
      let tpRes = await this.pool.query(
        "SELECT code, name, image_url, gallery, base_price_inr, fleet_prices FROM tour_packages WHERE id::text = $1 OR code = $1",
        [event.entity_id]
      ).catch(() => ({ rows: [] }));

      if (tpRes.rows.length === 0 || !tpRes.rows[0]?.code) {
        const fallback = await this.pool.query(
          "SELECT package_code, name, image_url, gallery, base_price_inr, fleet_prices FROM tour_packages WHERE id::text = $1 OR package_code = $1",
          [event.entity_id]
        ).catch(() => ({ rows: [] }));
        if (fallback.rows.length > 0) {
          tpRes = fallback;
        }
      }

      if (tpRes.rows.length > 0) {
        const row = tpRes.rows[0];
        slug = row.code || row.package_code;
        expectedPath = `/en/packages/${slug}/`;
        expectedTitle = row.name;
        expectedImage = row.image_url || (Array.isArray(row.gallery) ? row.gallery[0]?.url : null) || null;
        expectedFare = Number(row.base_price_inr ?? row.fleet_prices?.sedan ?? null) || null;
      } else {
        const catRes = await this.pool.query(
          "SELECT slug, title, type, price_inr FROM catalog_items WHERE id = $1 OR slug = $1",
          [event.entity_id]
        ).catch(() => ({ rows: [] }));

        if (catRes.rows.length > 0) {
          const row = catRes.rows[0];
          slug = row.slug;
          const prefix = row.type === "tour" ? "local-packages" : "packages";
          expectedPath = `/en/${prefix}/${row.slug}/`;
          expectedTitle = row.title;
          expectedFare = Number(row.price_inr ?? null) || null;

          const mediaRes = await this.pool.query(
            "SELECT storage_path FROM catalog_item_media WHERE catalog_item_id = $1 AND sort_order = 0 AND status != 'archived' LIMIT 1",
            [event.entity_id]
          ).catch(() => ({ rows: [] }));
          if (mediaRes.rows.length > 0) {
            expectedImage = mediaRes.rows[0].storage_path;
          }
        }
      }
    } else if (event.entity_type === "local_package") {
      let lpRes = await this.pool.query(
        "SELECT code, name, image_url, gallery, base_price_inr, fleet_prices FROM local_packages WHERE id::text = $1 OR code = $1",
        [event.entity_id]
      ).catch(() => ({ rows: [] }));

      if (lpRes.rows.length === 0 || !lpRes.rows[0]?.code) {
        const fallback = await this.pool.query(
          "SELECT package_code, name, image_url, gallery, base_price_inr, fleet_prices FROM local_sightseeing_packages WHERE id::text = $1 OR package_code = $1",
          [event.entity_id]
        ).catch(() => ({ rows: [] }));
        if (fallback.rows.length > 0) {
          lpRes = fallback;
        }
      }

      if (lpRes.rows.length > 0) {
        const row = lpRes.rows[0];
        slug = row.code || row.package_code;
        expectedPath = `/en/local-packages/${slug}/`;
        expectedTitle = row.name;
        expectedImage = row.image_url || (Array.isArray(row.gallery) ? row.gallery[0]?.url : null) || null;
        expectedFare = Number(row.base_price_inr ?? row.fleet_prices?.sedan ?? null) || null;
      } else {
        const catRes = await this.pool.query(
          "SELECT slug, title, price_inr FROM catalog_items WHERE id = $1 OR slug = $1",
          [event.entity_id]
        ).catch(() => ({ rows: [] }));

        if (catRes.rows.length > 0) {
          slug = catRes.rows[0].slug;
          expectedPath = `/en/local-packages/${catRes.rows[0].slug}/`;
          expectedTitle = catRes.rows[0].title;
          expectedFare = Number(catRes.rows[0].price_inr ?? null) || null;

          const mediaRes = await this.pool.query(
            "SELECT storage_path FROM catalog_item_media WHERE catalog_item_id = $1 AND sort_order = 0 AND status != 'archived' LIMIT 1",
            [event.entity_id]
          ).catch(() => ({ rows: [] }));
          if (mediaRes.rows.length > 0) {
            expectedImage = mediaRes.rows[0].storage_path;
          }
        }
      }
    } else if (event.entity_type === "transfer") {
      let trRes = await this.pool.query(
        "SELECT code, name, fleet_prices FROM transfers WHERE id::text = $1 OR code = $1",
        [event.entity_id]
      ).catch(() => ({ rows: [] }));

      if (trRes.rows.length === 0 || !trRes.rows[0]?.code) {
        const fallback = await this.pool.query(
          "SELECT route_code, name, fleet_prices FROM transfer_routes WHERE id::text = $1 OR route_code = $1",
          [event.entity_id]
        ).catch(() => ({ rows: [] }));
        if (fallback.rows.length > 0) {
          trRes = fallback;
        }
      }

      if (trRes.rows.length > 0) {
        const row = trRes.rows[0];
        slug = row.code || row.route_code;
        expectedPath = `/en/transfers/${slug}/`;
        expectedTitle = row.name;
        expectedFare = Number(row.fleet_prices?.sedan ?? null) || null;
      } else {
        const catRes = await this.pool.query(
          "SELECT slug, title, price_inr FROM catalog_items WHERE id = $1 OR slug = $1",
          [event.entity_id]
        ).catch(() => ({ rows: [] }));

        if (catRes.rows.length > 0) {
          slug = catRes.rows[0].slug;
          expectedPath = `/en/transfers/${catRes.rows[0].slug}/`;
          expectedTitle = catRes.rows[0].title;
          expectedFare = Number(catRes.rows[0].price_inr ?? null) || null;
        }
      }
    } else if (event.entity_type === "outstation_route") {
      // The legacy routes table and slug/source_city columns were removed.
      // Resolve against the active canonical fare-system schema.
      const routeRes = await this.pool.query(
        `SELECT code, origin_name, destination_name, image_url, gallery, fares_inr
         FROM outstation_routes
         WHERE id::text = $1 OR code = $1
         LIMIT 1`,
        [event.entity_id]
      ).catch(() => ({ rows: [] }));

      if (routeRes.rows.length > 0) {
        const row = routeRes.rows[0];
        slug = row.code;
        expectedPath = `/en/${row.code}/`;
        expectedTitle = `${row.origin_name} to ${row.destination_name}`;
        expectedImage = row.image_url || (Array.isArray(row.gallery) ? row.gallery[0]?.url : null) || null;
        expectedFare = Number(row.fares_inr?.sedan ?? null) || null;
      } else {
        const catRes = await this.pool.query(
          "SELECT slug, title, price_inr FROM catalog_items WHERE id = $1 OR slug = $1",
          [event.entity_id]
        ).catch(() => ({ rows: [] }));

        if (catRes.rows.length > 0) {
          slug = catRes.rows[0].slug;
          expectedPath = `/en/${catRes.rows[0].slug}/`;
          expectedTitle = catRes.rows[0].title;
          expectedFare = Number(catRes.rows[0].price_inr ?? null) || null;
        }
      }
    } else if (event.entity_type === "review") {
      expectedPath = "/en/";
      let revRes = await this.pool.query(
        "SELECT display_name FROM review_submissions WHERE id::text = $1",
        [event.entity_id]
      ).catch(() => ({ rows: [] }));
      if (revRes.rows.length === 0) {
        revRes = await this.pool.query(
          "SELECT display_name FROM reviews WHERE id::text = $1",
          [event.entity_id]
        ).catch(() => ({ rows: [] }));
      }
      if (revRes.rows.length > 0) {
        expectedTitle = revRes.rows[0].display_name;
      }
    }

    return { expectedPath, expectedTitle, expectedImage, expectedFare, slug };
  }

  async processEvent(event: PublishEventRecord): Promise<void> {
    const deployHook = this.deployHookUrl?.trim();
    const hasCfApi = Boolean(this.cfApiToken && this.cfAccountId);

    if (!deployHook && !hasCfApi) {
      await this.pool.query(
        `
        UPDATE site_publish_events
        SET status = 'failed',
            last_error = 'PAGES_DEPLOY_HOOK_URL is not set. Deployment cannot be triggered automatically.',
            processed_at = NULL
        WHERE id = $1
        `,
        [event.id]
      );
      recordAttempt({
        status: "hook_missing",
        releaseState: "publish_committed",
        correlationId: event.id,
        reason: `${event.entity_type}-${event.event_type}`,
        entityType: event.entity_type,
        entityId: event.entity_id,
        slug: null,
        sourceVersion: null,
        httpStatus: null,
        message: "PAGES_DEPLOY_HOOK_URL is not set. Deployment cannot be triggered automatically.",
        attemptedAt: new Date().toISOString(),
      });
      this.logger.warn({ eventId: event.id }, "publication worker skipped: deploy hook not configured");
      return;
    }

    try {
      let deploymentRef: string | null = null;
      let responseStatus = 200;

      if (deployHook) {
        this.logger.info(
          { eventId: event.id, entityType: event.entity_type, eventType: event.event_type, target: maskUrl(deployHook) },
          "dispatching deploy hook"
        );

        const response = await this.fetchFn(deployHook, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-correlation-id": event.id,
          },
          body: JSON.stringify({
            eventId: event.id,
            entityType: event.entity_type,
            entityId: event.entity_id,
            eventType: event.event_type,
          }),
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
          throw new Error(`Deploy hook returned HTTP ${response.status}`);
        }

        responseStatus = response.status;
        try {
          const json = (await response.json()) as any;
          deploymentRef = json?.result?.id || json?.id || null;
        } catch {
          // response might not be JSON
        }
        if (!deploymentRef) {
          deploymentRef = response.headers.get("cf-ray") || `cf-hook-${Date.now()}`;
        }
      } else {
        const cfDeployUrl = `https://api.cloudflare.com/client/v4/accounts/${this.cfAccountId}/pages/projects/${this.cfProjectName}/deployments`;
        this.logger.info(
          { eventId: event.id, entityType: event.entity_type, project: this.cfProjectName },
          "dispatching deployment via Cloudflare API"
        );

        const response = await this.fetchFn(cfDeployUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.cfApiToken}`,
            "content-type": "application/json",
            "x-correlation-id": event.id,
          },
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
          throw new Error(`Cloudflare deployments API returned HTTP ${response.status}`);
        }

        responseStatus = response.status;
        try {
          const json = (await response.json()) as any;
          deploymentRef = json?.result?.id || json?.id || null;
        } catch {}
        if (!deploymentRef) {
          deploymentRef = response.headers.get("cf-ray") || `cf-api-${Date.now()}`;
        }
      }

      // Move status to triggered
      await this.pool.query(
        `
        UPDATE site_publish_events
        SET status = 'triggered',
            deployment_ref = $2,
            last_error = NULL,
            next_attempt_at = NOW() + interval '15 seconds'
        WHERE id = $1
        `,
        [event.id, deploymentRef]
      );

      recordAttempt({
        status: "queued",
        releaseState: "release_queued",
        correlationId: event.id,
        reason: `${event.entity_type}-${event.event_type}`,
        entityType: event.entity_type,
        entityId: event.entity_id,
        slug: null,
        sourceVersion: null,
        httpStatus: responseStatus,
        message: "Deploy hook accepted the rebuild request. Deployment completion is not yet verified.",
        attemptedAt: new Date().toISOString(),
      });

      this.logger.info(
        { eventId: event.id, deploymentRef },
        "deploy hook accepted; publication status moved to triggered"
      );

      // Attempt immediate verification
      const verified = await this.verifyDeployment({ ...event, status: "triggered", deployment_ref: deploymentRef });
      if (verified) {
        await this.pool.query(
          `
          UPDATE site_publish_events
          SET status = 'succeeded',
              processed_at = NOW(),
              last_error = NULL
          WHERE id = $1
          `,
          [event.id]
        );
        recordAttempt({
          status: "queued",
          releaseState: "release_deployed",
          correlationId: event.id,
          reason: `${event.entity_type}-${event.event_type}`,
          entityType: event.entity_type,
          entityId: event.entity_id,
          slug: null,
          sourceVersion: null,
          httpStatus: 200,
          message: "Deployment verified live successfully.",
          attemptedAt: new Date().toISOString(),
        });
        this.logger.info({ eventId: event.id }, "deployment verification succeeded; event finalized");
      }
    } catch (err: any) {
      const isTerminal = event.attempt_count >= this.maxAttempts;
      const delaySeconds = Math.min(30 * Math.pow(2, Math.max(0, event.attempt_count - 1)), 1800);
      const errorMessage = err?.message ? String(err.message).slice(0, 500) : "Deploy hook failed";

      await this.pool.query(
        `
        UPDATE site_publish_events
        SET status = $2,
            next_attempt_at = NOW() + ($3 || ' seconds')::interval,
            last_error = $4
        WHERE id = $1
        `,
        [event.id, isTerminal ? "failed" : "pending", delaySeconds, errorMessage]
      );

      recordAttempt({
        status: "hook_failed",
        releaseState: "release_failed",
        correlationId: event.id,
        reason: `${event.entity_type}-${event.event_type}`,
        entityType: event.entity_type,
        entityId: event.entity_id,
        slug: null,
        sourceVersion: null,
        httpStatus: null,
        message: errorMessage,
        attemptedAt: new Date().toISOString(),
      });

      this.logger.error(
        { eventId: event.id, attempts: event.attempt_count, isTerminal, err: errorMessage },
        "deploy hook execution failed"
      );
    }
  }

  async verifyDeployment(event: PublishEventRecord): Promise<boolean> {
    if (this.verifyFn) {
      return this.verifyFn(event);
    }

    if (!this.customerSiteUrl?.trim()) {
      this.logger.warn(
        { eventId: event.id },
        "verifyDeployment cannot proceed: customerSiteUrl is not configured."
      );
      return false;
    }

    let siteBase: URL;
    try {
      siteBase = new URL(this.customerSiteUrl.trim());
    } catch {
      this.logger.error(
        { eventId: event.id, url: this.customerSiteUrl },
        "verifyDeployment failed: invalid customerSiteUrl"
      );
      return false;
    }

    // If Cloudflare API credentials are configured, verify the deployment has finished
    if (this.cfApiToken && this.cfAccountId && this.cfProjectName) {
      try {
        const cfStatusUrl = `https://api.cloudflare.com/client/v4/accounts/${this.cfAccountId}/pages/projects/${this.cfProjectName}/deployments?per_page=5`;
        const cfRes = await this.fetchFn(cfStatusUrl, {
          headers: {
            Authorization: `Bearer ${this.cfApiToken}`,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(10_000),
        });
        if (cfRes.ok) {
          const cfData = (await cfRes.json()) as any;
          const deployments = cfData?.result;
          if (Array.isArray(deployments) && deployments.length > 0) {
            const latest = deployments[0];
            const stageStatus = latest?.latest_stage?.status || latest?.status;
            if (stageStatus && stageStatus !== "success" && stageStatus !== "active") {
              this.logger.debug?.({ eventId: event.id, stageStatus }, "Cloudflare Pages deployment is not yet finished");
              return false;
            }
          }
        }
      } catch (err: any) {
        this.logger.debug?.({ eventId: event.id, err: err?.message }, "Cloudflare API status check encountered network error");
      }
    }

    // Check release.json if available
    try {
      const releaseRes = await this.fetchFn(`${siteBase.origin}/release.json`, {
        method: "GET",
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      });
      if (releaseRes.ok) {
        const releaseData = (await releaseRes.json()) as { builtAt?: string };
        if (releaseData?.builtAt) {
          const builtTime = new Date(releaseData.builtAt).getTime();
          const eventTime = new Date(event.created_at).getTime();
          if (builtTime < eventTime - 15_000) {
            this.logger.debug?.(
              { eventId: event.id, builtAt: releaseData.builtAt, createdAt: event.created_at },
              "Customer site release.json is older than publish event"
            );
            return false;
          }
        }
      }
    } catch {
      // non-blocking if release.json not present
    }

    // The customer site is static/SSG and intentionally has no API-style /health endpoint.
    try {
      const originRes = await this.fetchFn(`${siteBase.origin}/`, {
        method: "GET",
        headers: { accept: "text/html" },
        signal: AbortSignal.timeout(5000),
      });
      if (!originRes.ok) {
        this.logger.debug?.({ eventId: event.id, status: originRes.status }, "Customer site origin responded with error");
        return false;
      }
    } catch (err: any) {
      this.logger.debug?.({ eventId: event.id, err: err?.message }, "Customer site origin check failed");
      return false;
    }

    // 2. Canonical route, media, and sitemap verification
    try {
      const { expectedPath, expectedTitle, expectedImage, expectedFare, slug } = await this.resolveEntityData(event);

      // Fail-closed requirement: if an entity or canonical URL cannot be resolved,
      // never return true.
      if (!expectedPath) {
        this.logger.warn(
          { eventId: event.id, entityType: event.entity_type, entityId: event.entity_id },
          "verifyDeployment failed: entity or canonical path could not be resolved from database"
        );
        return false;
      }

      if (event.event_type === "archived") {
        // 1. Verify sitemap excludes the archived item (sitemap MUST return HTTP 200)
        let sitemapRes: Response;
        try {
          sitemapRes = await this.fetchFn(`${siteBase.origin}/sitemap.xml`, {
            method: "GET",
            signal: AbortSignal.timeout(10_000),
          });
        } catch (err: any) {
          this.logger.debug?.({ eventId: event.id, err: err?.message }, "Sitemap.xml fetch failed for archive verification");
          return false;
        }

        if (sitemapRes.status !== 200) {
          this.logger.debug?.({ eventId: event.id, status: sitemapRes.status }, "Sitemap.xml did not return 200 for archive verification");
          return false;
        }

        const sitemapXml = await sitemapRes.text();
        if (sitemapXml.includes(expectedPath)) {
          this.logger.debug?.({ eventId: event.id, expectedPath }, "Sitemap still contains archived URL");
          return false;
        }

        // 2. Verify detail page is no longer active (404, 410, redirect, or 404/unavailable page)
        let pageRes: Response;
        try {
          pageRes = await this.fetchFn(`${siteBase.origin}${expectedPath}`, {
            method: "GET",
            headers: { accept: "text/html" },
            signal: AbortSignal.timeout(10_000),
          });
        } catch (err: any) {
          this.logger.debug?.({ eventId: event.id, err: err?.message }, "Page fetch failed for archive verification");
          return false;
        }

        if (pageRes.status === 404 || pageRes.status === 410 || (pageRes.status >= 300 && pageRes.status < 400)) {
          return true;
        }
        if (pageRes.status === 200) {
          const html = await pageRes.text();
          const isNotFoundOrUnavailable =
            html.includes("404") ||
            html.includes("Not Found") ||
            html.includes("not available") ||
            html.includes("Service Not Found") ||
            html.includes("Uncharted route");
          if (!isNotFoundOrUnavailable || (expectedTitle && html.includes(expectedTitle))) {
            this.logger.debug?.({ eventId: event.id, path: expectedPath }, "Archived item still served as active HTTP 200 page");
            return false;
          }
          return true;
        }
        return false;
      }

      if (
        event.event_type === "published" ||
        event.event_type === "updated" ||
        event.event_type === "slug_changed" ||
        event.event_type === "price_changed" ||
        event.event_type === "review_approved"
      ) {
        // Verify customer-facing detail page returns HTTP 200
        let pageRes: Response;
        try {
          pageRes = await this.fetchFn(`${siteBase.origin}${expectedPath}`, {
            method: "GET",
            headers: { accept: "text/html" },
            signal: AbortSignal.timeout(10_000),
          });
        } catch (err: any) {
          this.logger.debug?.({ eventId: event.id, path: expectedPath, err: err?.message }, "Canonical detail page fetch failed");
          return false;
        }

        if (pageRes.status !== 200) {
          this.logger.debug?.({ eventId: event.id, path: expectedPath, status: pageRes.status }, "Canonical detail page not live (HTTP 200 required)");
          return false;
        }

        if (expectedTitle) {
          const html = await pageRes.text();
          if (!html.includes(expectedTitle)) {
            this.logger.debug?.({ eventId: event.id, expectedTitle }, "Detail page does not yet reflect published title");
            return false;
          }
        }

        // Verify cover image availability if applicable (handles full CDN URLs as well as relative paths)
        if (expectedImage) {
          let imageUrl: string;
          if (expectedImage.startsWith("http://") || expectedImage.startsWith("https://")) {
            imageUrl = expectedImage;
          } else {
            const imgPath = expectedImage.startsWith("/") ? expectedImage : `/${expectedImage}`;
            imageUrl = `${siteBase.origin}${imgPath}`;
          }

          let imgRes: Response;
          try {
            imgRes = await this.fetchFn(imageUrl, {
              method: "GET",
              signal: AbortSignal.timeout(5000),
            });
          } catch (err: any) {
            this.logger.debug?.({ eventId: event.id, imageUrl, err: err?.message }, "Cover image fetch failed");
            return false;
          }

          if (imgRes.status !== 200 && imgRes.status !== 304) {
            this.logger.debug?.({ eventId: event.id, imageUrl, status: imgRes.status }, "Cover image not reachable");
            return false;
          }
        }

        // Verify sitemap.xml presence (for route/package/transfer pages)
        if (event.entity_type !== "review") {
          let sitemapRes: Response;
          try {
            sitemapRes = await this.fetchFn(`${siteBase.origin}/sitemap.xml`, {
              method: "GET",
              signal: AbortSignal.timeout(10_000),
            });
          } catch (err: any) {
            this.logger.debug?.({ eventId: event.id, err: err?.message }, "Sitemap.xml fetch failed");
            return false;
          }

          if (sitemapRes.status !== 200) {
            this.logger.debug?.({ eventId: event.id, status: sitemapRes.status }, "Sitemap.xml not accessible");
            return false;
          }
          const sitemapXml = await sitemapRes.text();
          const cleanPath = expectedPath.replace(/\/$/, "");
          if (!sitemapXml.includes(expectedPath) && !sitemapXml.includes(cleanPath)) {
            this.logger.debug?.({ eventId: event.id, expectedPath }, "Sitemap does not include canonical detail page");
            return false;
          }
        }

        // Verify price accuracy for price_changed events
        if (event.event_type === "price_changed" && expectedFare) {
          let priceMatched = false;
          // 1. Check routes-manifest.json if slug is present
          if (slug) {
            try {
              const manifestRes = await this.fetchFn(`${siteBase.origin}/routes-manifest.json`, {
                method: "GET",
                signal: AbortSignal.timeout(5000),
              });
              if (manifestRes.ok) {
                const manifestData = (await manifestRes.json()) as Record<string, { fs?: number }>;
                if (manifestData[slug] && manifestData[slug].fs === expectedFare) {
                  priceMatched = true;
                }
              }
            } catch {
              // manifest fetch is optional fallback
            }
          }

          // 2. Check detail page HTML for the expected fare or formatted Indian currency
          if (!priceMatched) {
            try {
              const html = await pageRes.text();
              const fareFormatted = new Intl.NumberFormat("en-IN").format(expectedFare);
              if (html.includes(String(expectedFare)) || html.includes(fareFormatted)) {
                priceMatched = true;
              }
            } catch {
              // page text read error
            }
          }

          if (!priceMatched) {
            this.logger.debug?.(
              { eventId: event.id, expectedFare, path: expectedPath },
              "Detail page or manifest does not yet reflect updated price"
            );
            return false;
          }
        }

        return true;
      }

      // Unrecognized event_type fails closed
      this.logger.warn({ eventId: event.id, eventType: event.event_type }, "Unrecognized event_type in verifyDeployment; failing closed");
      return false;
    } catch (err: any) {
      this.logger.debug?.({ eventId: event.id, err: err?.message }, "verifyDeployment exception encountered");
      return false;
    }
  }

  async verifyTriggeredEvents(limit = 5): Promise<number> {
    const res = await this.pool.query(
      `
      SELECT * FROM site_publish_events
      WHERE status = 'triggered'
        AND next_attempt_at <= NOW()
      ORDER BY created_at ASC
      LIMIT $1
      `,
      [limit]
    );

    let verifiedCount = 0;
    for (const event of res.rows as PublishEventRecord[]) {
      const verified = await this.verifyDeployment(event);
      if (verified) {
        await this.pool.query(
          `
          UPDATE site_publish_events
          SET status = 'succeeded',
              processed_at = NOW(),
              last_error = NULL
          WHERE id = $1
          `,
          [event.id]
        );
        verifiedCount++;
      } else {
        const createdAt = new Date(event.created_at).getTime();
        const elapsedMinutes = (Date.now() - createdAt) / (1000 * 60);
        if (elapsedMinutes >= 15) {
          await this.pool.query(
            `
            UPDATE site_publish_events
            SET status = 'failed',
                last_error = 'Deployment verification timed out after 15 minutes'
            WHERE id = $1
            `,
            [event.id]
          );
        } else {
          await this.pool.query(
            `
            UPDATE site_publish_events
            SET next_attempt_at = NOW() + interval '30 seconds'
            WHERE id = $1
            `,
            [event.id]
          );
        }
      }
    }
    return verifiedCount;
  }

  async processQueued(): Promise<{ claimed: number; verified: number }> {
    const claimedEvents = await this.claimDueEvents();
    for (const event of claimedEvents) {
      await this.processEvent(event);
    }
    const verified = await this.verifyTriggeredEvents();
    return { claimed: claimedEvents.length, verified };
  }

  async retryEvent(id: string): Promise<PublishEventRecord | null> {
    const res = await this.pool.query(
      `
      UPDATE site_publish_events
      SET status = 'pending',
          attempt_count = 0,
          next_attempt_at = NOW(),
          last_error = NULL
      WHERE id = $1
      RETURNING *;
      `,
      [id]
    );
    return res.rows[0] ?? null;
  }
}
