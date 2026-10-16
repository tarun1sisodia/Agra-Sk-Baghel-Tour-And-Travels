import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  PublicationWorker,
  type PublishEventRecord,
} from "../../src/modules/publishing/publication-worker.js";

class MockPublishPool {
  public events: Map<string, PublishEventRecord> = new Map();

  async query(sql: string, params: any[] = []): Promise<{ rows: any[] }> {
    const s = sql.toLowerCase();

    // 1. Claim due events
    if (s.includes("with due as") && s.includes("for update skip locked")) {
      const limit = params[0] ?? 5;
      const maxAttempts = params[1] ?? 5;
      const now = new Date();

      const claimed: PublishEventRecord[] = [];
      for (const ev of this.events.values()) {
        const nextAttempt = new Date(ev.next_attempt_at);
        const isPendingDue = ev.status === "pending" && nextAttempt <= now && ev.attempt_count < maxAttempts;
        const isStuckProcessing = ev.status === "processing" && (now.getTime() - nextAttempt.getTime() > 5 * 60 * 1000) && ev.attempt_count < maxAttempts;

        if (isPendingDue || isStuckProcessing) {
          ev.status = "processing";
          ev.attempt_count += 1;
          ev.next_attempt_at = new Date(now.getTime() + 60_000);
          claimed.push({ ...ev });
          if (claimed.length >= limit) break;
        }
      }
      return { rows: claimed };
    }

    // 2. Mark triggered
    if (s.includes("set status = 'triggered'")) {
      const id = params[0];
      const ref = params[1];
      const ev = this.events.get(id);
      if (ev) {
        ev.status = "triggered";
        ev.deployment_ref = ref;
        ev.last_error = null;
        ev.next_attempt_at = new Date(Date.now() + 15_000);
      }
      return { rows: ev ? [{ ...ev }] : [] };
    }

    // 3. Mark succeeded
    if (s.includes("set status = 'succeeded'")) {
      const id = params[0];
      const ev = this.events.get(id);
      if (ev) {
        ev.status = "succeeded";
        ev.processed_at = new Date();
        ev.last_error = null;
      }
      return { rows: ev ? [{ ...ev }] : [] };
    }

    // 4. Mark failed/pending on error (parametrized status)
    if (s.includes("update site_publish_events") && s.includes("set status = $2")) {
      const id = params[0];
      const status = params[1];
      const delaySeconds = params[2];
      const errorMsg = params[3];
      const ev = this.events.get(id);
      if (ev) {
        ev.status = status;
        ev.next_attempt_at = new Date(Date.now() + delaySeconds * 1000);
        ev.last_error = errorMsg;
      }
      return { rows: ev ? [{ ...ev }] : [] };
    }

    // 5. Select triggered events
    if (s.includes("select * from site_publish_events") && s.includes("status = 'triggered'")) {
      const limit = params[0] ?? 5;
      const now = new Date();
      const triggered: PublishEventRecord[] = [];
      for (const ev of this.events.values()) {
        if (ev.status === "triggered" && new Date(ev.next_attempt_at) <= now) {
          triggered.push({ ...ev });
          if (triggered.length >= limit) break;
        }
      }
      return { rows: triggered };
    }

    // 6. Retry event
    if (s.includes("set status = 'pending'") && s.includes("attempt_count = 0")) {
      const id = params[0];
      const ev = this.events.get(id);
      if (ev) {
        ev.status = "pending";
        ev.attempt_count = 0;
        ev.next_attempt_at = new Date();
        ev.last_error = null;
      }
      return { rows: ev ? [{ ...ev }] : [] };
    }

    // 7. Missing deploy hook failed
    if (s.includes("set status = 'failed'") && s.includes("pages_deploy_hook_url is not set")) {
      const id = params[0];
      const ev = this.events.get(id);
      if (ev) {
        ev.status = "failed";
        ev.last_error = "PAGES_DEPLOY_HOOK_URL is not set. Deployment cannot be triggered automatically.";
      }
      return { rows: ev ? [{ ...ev }] : [] };
    }

    return { rows: [] };
  }
}

describe("PublicationWorker (Section 12.17: PB-04 to PB-06)", () => {
  let pool: MockPublishPool;
  const SECRET_HOOK_URL = "https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/secret-uuid-12345";

  beforeEach(() => {
    pool = new MockPublishPool();
  });

  it("PB-04: Worker processes a pending event from pending -> processing -> triggered -> succeeded", async () => {
    pool.events.set("ev-1", {
      id: "ev-1",
      entity_type: "outstation_route",
      entity_id: "route-uuid-1",
      event_type: "published",
      status: "pending",
      attempt_count: 0,
      next_attempt_at: new Date(Date.now() - 1000),
      deployment_ref: null,
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, result: { id: "cf-deploy-987" } }),
      headers: new Headers(),
    });

    const worker = new PublicationWorker({
      pool: pool as any,
      deployHookUrl: SECRET_HOOK_URL,
      fetchFn: mockFetch as any,
      verifyFn: async () => true,
    });

    const res = await worker.processQueued();
    expect(res.claimed).toBe(1);

    const event = pool.events.get("ev-1");
    expect(event?.status).toBe("succeeded");
    expect(event?.deployment_ref).toBe("cf-deploy-987");
    expect(event?.attempt_count).toBe(1);
    expect(event?.processed_at).toBeInstanceOf(Date);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("PB-04b: Worker remains in triggered state when customerSiteUrl is missing and verifyFn is absent", async () => {
    pool.events.set("ev-no-site-url", {
      id: "ev-no-site-url",
      entity_type: "outstation_route",
      entity_id: "route-uuid-1",
      event_type: "published",
      status: "pending",
      attempt_count: 0,
      next_attempt_at: new Date(Date.now() - 1000),
      deployment_ref: null,
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, result: { id: "cf-deploy-no-site" } }),
      headers: new Headers(),
    });

    const worker = new PublicationWorker({
      pool: pool as any,
      deployHookUrl: SECRET_HOOK_URL,
      fetchFn: mockFetch as any,
      // No customerSiteUrl or verifyFn -> cannot verify, must stay triggered
    });

    await worker.processQueued();
    const event = pool.events.get("ev-no-site-url");
    expect(event?.status).toBe("triggered");
    expect(event?.processed_at).toBeNull();
  });

  it("PB-05: Build hook failure triggers exponential backoff and fails after limit", async () => {
    pool.events.set("ev-2", {
      id: "ev-2",
      entity_type: "outstation_route",
      entity_id: "route-uuid-2",
      event_type: "published",
      status: "pending",
      attempt_count: 0,
      next_attempt_at: new Date(Date.now() - 1000),
      deployment_ref: null,
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    });

    const failingFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: "Gateway error" }),
      headers: new Headers(),
    });

    const worker = new PublicationWorker({
      pool: pool as any,
      deployHookUrl: SECRET_HOOK_URL,
      fetchFn: failingFetch as any,
      maxAttempts: 2,
    });

    // Attempt 1: should stay pending with backoff
    await worker.processQueued();
    let ev = pool.events.get("ev-2");
    expect(ev?.status).toBe("pending");
    expect(ev?.attempt_count).toBe(1);
    expect(ev?.last_error).toContain("HTTP 503");

    // Advance time for attempt 2
    if (ev) ev.next_attempt_at = new Date(Date.now() - 1000);

    // Attempt 2: hits maxAttempts (2) -> moves to failed
    await worker.processQueued();
    ev = pool.events.get("ev-2");
    expect(ev?.status).toBe("failed");
    expect(ev?.attempt_count).toBe(2);
    expect(ev?.last_error).toContain("HTTP 503");
  });

  it("PB-06: Hook accepted but page not live: event remains triggered until verification passes", async () => {
    pool.events.set("ev-3", {
      id: "ev-3",
      entity_type: "outstation_route",
      entity_id: "route-uuid-3",
      event_type: "published",
      status: "pending",
      attempt_count: 0,
      next_attempt_at: new Date(Date.now() - 1000),
      deployment_ref: null,
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, result: { id: "cf-deploy-delayed" } }),
      headers: new Headers(),
    });

    let liveReady = false;
    const worker = new PublicationWorker({
      pool: pool as any,
      deployHookUrl: SECRET_HOOK_URL,
      fetchFn: mockFetch as any,
      verifyFn: async () => liveReady,
    });

    // First cycle: build is triggered, but verification returns false
    await worker.processQueued();
    let ev = pool.events.get("ev-3");
    expect(ev?.status).toBe("triggered");
    expect(ev?.deployment_ref).toBe("cf-deploy-delayed");
    expect(ev?.processed_at).toBeNull();

    // Verification passes in second cycle
    liveReady = true;
    if (ev) ev.next_attempt_at = new Date(Date.now() - 1000);
    await worker.processQueued();

    ev = pool.events.get("ev-3");
    expect(ev?.status).toBe("succeeded");
    expect(ev?.processed_at).toBeInstanceOf(Date);
  });

  it("retryEvent resets a failed event to pending with reset attempts", async () => {
    pool.events.set("ev-failed", {
      id: "ev-failed",
      entity_type: "outstation_route",
      entity_id: "route-uuid-4",
      event_type: "published",
      status: "failed",
      attempt_count: 5,
      next_attempt_at: new Date(),
      deployment_ref: null,
      last_error: "Timed out",
      created_at: new Date(),
      processed_at: null,
    });

    const worker = new PublicationWorker({
      pool: pool as any,
      deployHookUrl: SECRET_HOOK_URL,
    });

    const updated = await worker.retryEvent("ev-failed");
    expect(updated?.status).toBe("pending");
    expect(updated?.attempt_count).toBe(0);
    expect(updated?.last_error).toBeNull();
  });

  it("handles missing deployHookUrl gracefully without crashing", async () => {
    pool.events.set("ev-no-hook", {
      id: "ev-no-hook",
      entity_type: "outstation_route",
      entity_id: "route-uuid-5",
      event_type: "published",
      status: "pending",
      attempt_count: 0,
      next_attempt_at: new Date(Date.now() - 1000),
      deployment_ref: null,
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    });

    const worker = new PublicationWorker({
      pool: pool as any,
      deployHookUrl: "", // missing
    });

    await worker.processQueued();
    const ev = pool.events.get("ev-no-hook");
    expect(ev?.status).toBe("failed");
    expect(ev?.last_error).toContain("PAGES_DEPLOY_HOOK_URL is not set");
  });

  it("verifyDeployment: checks origin, detail page, cover image, and sitemap.xml on customer site", async () => {
    // Mock DB queries for entity lookup
    const customPool = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("FROM catalog_items WHERE id = $1")) {
          return { rows: [{ slug: "agra-taj-sunrise", title: "Agra Taj Sunrise", type: "package" }] };
        }
        if (sql.includes("FROM catalog_item_media WHERE catalog_item_id = $1")) {
          return { rows: [{ storage_path: "/assets/packages/taj-sunrise.webp" }] };
        }
        return { rows: [] };
      }),
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (new URL(url).pathname === "/") {
        return { ok: true, status: 200 };
      }
      if (url.endsWith("/en/packages/agra-taj-sunrise/")) {
        return {
          ok: true,
          status: 200,
          text: async () => "<html><head><title>Agra Taj Sunrise</title></head><body><h1>Agra Taj Sunrise</h1></body></html>",
        };
      }
      if (url.endsWith("/assets/packages/taj-sunrise.webp")) {
        return { ok: true, status: 200 };
      }
      if (url.endsWith("/sitemap.xml")) {
        return {
          ok: true,
          status: 200,
          text: async () => `<urlset><url><loc>https://agraskbagheltourandtravels.com/en/packages/agra-taj-sunrise/</loc></url></urlset>`,
        };
      }
      return { ok: false, status: 404 };
    });

    const worker = new PublicationWorker({
      pool: customPool as any,
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
    });

    const ev: PublishEventRecord = {
      id: "ev-verify-1",
      entity_type: "tour_package",
      entity_id: "pkg-123",
      event_type: "published",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-1",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };

    const verified = await worker.verifyDeployment(ev);
    expect(verified).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://agraskbagheltourandtravels.com/health",
      expect.anything()
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "https://agraskbagheltourandtravels.com/en/packages/agra-taj-sunrise/",
      expect.anything()
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "https://agraskbagheltourandtravels.com/assets/packages/taj-sunrise.webp",
      expect.anything()
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "https://agraskbagheltourandtravels.com/sitemap.xml",
      expect.anything()
    );
  });

  it("verifyDeployment: returns false if sitemap.xml does not contain the canonical URL", async () => {
    const customPool = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("FROM catalog_items WHERE id = $1")) {
          return { rows: [{ slug: "agra-taj-sunrise", title: "Agra Taj Sunrise", type: "package" }] };
        }
        return { rows: [] };
      }),
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/health")) return { ok: true, status: 200 };
      if (url.endsWith("/en/packages/agra-taj-sunrise/")) {
        return { ok: true, status: 200, text: async () => "<html>Agra Taj Sunrise</html>" };
      }
      if (url.endsWith("/sitemap.xml")) {
        // Sitemap missing the published canonical URL
        return { ok: true, status: 200, text: async () => "<urlset></urlset>" };
      }
      return { ok: false, status: 404 };
    });

    const worker = new PublicationWorker({
      pool: customPool as any,
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
    });

    const ev: PublishEventRecord = {
      id: "ev-verify-2",
      entity_type: "tour_package",
      entity_id: "pkg-123",
      event_type: "published",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-2",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };

    const verified = await worker.verifyDeployment(ev);
    expect(verified).toBe(false);
  });

  it("verifyDeployment: fails closed if entity cannot be resolved in database", async () => {
    const customPool = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/health")) return { ok: true, status: 200 };
      return { ok: true, status: 200 };
    });

    const worker = new PublicationWorker({
      pool: customPool as any,
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
    });

    const ev: PublishEventRecord = {
      id: "ev-unresolved",
      entity_type: "tour_package",
      entity_id: "non-existent-pkg",
      event_type: "published",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-3",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };

    const verified = await worker.verifyDeployment(ev);
    expect(verified).toBe(false);
  });

  it("verifyDeployment: resolves tour package from dedicated tour_packages table with full CDN image", async () => {
    const customPool = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("FROM tour_packages WHERE")) {
          return {
            rows: [
              {
                package_code: "golden-triangle-express",
                name: "Golden Triangle Express",
                image_url: "https://cdn.example.com/gt-cover.webp",
                gallery: [],
              },
            ],
          };
        }
        return { rows: [] };
      }),
    };

    const fetchedUrls: string[] = [];
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      fetchedUrls.push(url);
      if (url.endsWith("/health")) return { ok: true, status: 200 };
      if (url.endsWith("/en/packages/golden-triangle-express/")) {
        return { ok: true, status: 200, text: async () => "<html><title>Golden Triangle Express</title></html>" };
      }
      if (url === "https://cdn.example.com/gt-cover.webp") {
        return { ok: true, status: 200 };
      }
      if (url.endsWith("/sitemap.xml")) {
        return {
          ok: true,
          status: 200,
          text: async () => "<urlset><loc>https://agraskbagheltourandtravels.com/en/packages/golden-triangle-express/</loc></urlset>",
        };
      }
      return { ok: false, status: 404 };
    });

    const worker = new PublicationWorker({
      pool: customPool as any,
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
    });

    const ev: PublishEventRecord = {
      id: "ev-tp-1",
      entity_type: "tour_package",
      entity_id: "gt-uuid-1",
      event_type: "published",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-4",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };

    const verified = await worker.verifyDeployment(ev);
    expect(verified).toBe(true);
    expect(fetchedUrls).toContain("https://cdn.example.com/gt-cover.webp");
    expect(fetchedUrls).toContain("https://agraskbagheltourandtravels.com/en/packages/golden-triangle-express/");
  });

  it("verifyDeployment: resolves local package from local_sightseeing_packages table", async () => {
    const customPool = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("FROM local_sightseeing_packages WHERE")) {
          return {
            rows: [
              {
                package_code: "agra-half-day-sightseeing",
                name: "Agra Half Day Sightseeing",
              },
            ],
          };
        }
        return { rows: [] };
      }),
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/health")) return { ok: true, status: 200 };
      if (url.endsWith("/en/local-packages/agra-half-day-sightseeing/")) {
        return { ok: true, status: 200, text: async () => "<html>Agra Half Day Sightseeing</html>" };
      }
      if (url.endsWith("/sitemap.xml")) {
        return {
          ok: true,
          status: 200,
          text: async () => "<urlset><loc>https://agraskbagheltourandtravels.com/en/local-packages/agra-half-day-sightseeing/</loc></urlset>",
        };
      }
      return { ok: false, status: 404 };
    });

    const worker = new PublicationWorker({
      pool: customPool as any,
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
    });

    const ev: PublishEventRecord = {
      id: "ev-lp-1",
      entity_type: "local_package",
      entity_id: "lp-uuid-1",
      event_type: "published",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-5",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };

    const verified = await worker.verifyDeployment(ev);
    expect(verified).toBe(true);
  });

  it("verifyDeployment: resolves transfer route from transfer_routes table", async () => {
    const customPool = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("FROM transfer_routes WHERE")) {
          return {
            rows: [
              {
                route_code: "delhi-airport-to-agra",
                name: "Delhi Airport to Agra",
              },
            ],
          };
        }
        return { rows: [] };
      }),
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/health")) return { ok: true, status: 200 };
      if (url.endsWith("/en/transfers/delhi-airport-to-agra/")) {
        return { ok: true, status: 200, text: async () => "<html>Delhi Airport to Agra</html>" };
      }
      if (url.endsWith("/sitemap.xml")) {
        return {
          ok: true,
          status: 200,
          text: async () => "<urlset><loc>https://agraskbagheltourandtravels.com/en/transfers/delhi-airport-to-agra/</loc></urlset>",
        };
      }
      return { ok: false, status: 404 };
    });

    const worker = new PublicationWorker({
      pool: customPool as any,
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
    });

    const ev: PublishEventRecord = {
      id: "ev-tr-1",
      entity_type: "transfer",
      entity_id: "tr-uuid-1",
      event_type: "published",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-6",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };

    const verified = await worker.verifyDeployment(ev);
    expect(verified).toBe(true);
  });

  it("verifyDeployment: for archived event, returns true only when sitemap excludes it and detail page is 404", async () => {
    const customPool = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("FROM tour_packages WHERE")) {
          return {
            rows: [
              {
                package_code: "monsoon-heritage-special",
                name: "Monsoon Heritage Special",
              },
            ],
          };
        }
        return { rows: [] };
      }),
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/health")) return { ok: true, status: 200 };
      if (url.endsWith("/sitemap.xml")) {
        // Sitemap excludes the archived URL
        return { ok: true, status: 200, text: async () => "<urlset><loc>https://agraskbagheltourandtravels.com/en/packages/other/</loc></urlset>" };
      }
      if (url.endsWith("/en/packages/monsoon-heritage-special/")) {
        // Old URL returns 404
        return { ok: false, status: 404 };
      }
      return { ok: false, status: 404 };
    });

    const worker = new PublicationWorker({
      pool: customPool as any,
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
    });

    const ev: PublishEventRecord = {
      id: "ev-archive-success",
      entity_type: "tour_package",
      entity_id: "mhs-1",
      event_type: "archived",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-7",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };

    const verified = await worker.verifyDeployment(ev);
    expect(verified).toBe(true);
  });

  it("verifyDeployment: for archived event, returns false if sitemap still contains URL", async () => {
    const customPool = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("FROM tour_packages WHERE")) {
          return {
            rows: [
              {
                package_code: "monsoon-heritage-special",
                name: "Monsoon Heritage Special",
              },
            ],
          };
        }
        return { rows: [] };
      }),
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/health")) return { ok: true, status: 200 };
      if (url.endsWith("/sitemap.xml")) {
        // Sitemap STILL contains the archived URL
        return { ok: true, status: 200, text: async () => "<urlset><loc>https://agraskbagheltourandtravels.com/en/packages/monsoon-heritage-special/</loc></urlset>" };
      }
      if (url.endsWith("/en/packages/monsoon-heritage-special/")) {
        return { ok: false, status: 404 };
      }
      return { ok: false, status: 404 };
    });

    const worker = new PublicationWorker({
      pool: customPool as any,
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
    });

    const ev: PublishEventRecord = {
      id: "ev-archive-fail-sitemap",
      entity_type: "tour_package",
      entity_id: "mhs-1",
      event_type: "archived",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-8",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };

    const verified = await worker.verifyDeployment(ev);
    expect(verified).toBe(false);
  });

  it("verifyDeployment: for archived event, returns false if page returns 200 with active title", async () => {
    const customPool = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("FROM tour_packages WHERE")) {
          return {
            rows: [
              {
                package_code: "monsoon-heritage-special",
                name: "Monsoon Heritage Special",
              },
            ],
          };
        }
        return { rows: [] };
      }),
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/health")) return { ok: true, status: 200 };
      if (url.endsWith("/sitemap.xml")) {
        return { ok: true, status: 200, text: async () => "<urlset></urlset>" };
      }
      if (url.endsWith("/en/packages/monsoon-heritage-special/")) {
        // Stale 200 with active title!
        return { ok: true, status: 200, text: async () => "<html><h1>Monsoon Heritage Special</h1></html>" };
      }
      return { ok: false, status: 404 };
    });

    const worker = new PublicationWorker({
      pool: customPool as any,
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
    });

    const ev: PublishEventRecord = {
      id: "ev-archive-fail-page",
      entity_type: "tour_package",
      entity_id: "mhs-1",
      event_type: "archived",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-9",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };

    const verified = await worker.verifyDeployment(ev);
    expect(verified).toBe(false);
  });

  it("verifyDeployment: for archived event, returns false if sitemap returns HTTP 500", async () => {
    const customPool = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("FROM tour_packages WHERE")) {
          return {
            rows: [
              {
                package_code: "monsoon-heritage-special",
                name: "Monsoon Heritage Special",
              },
            ],
          };
        }
        return { rows: [] };
      }),
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/health")) return { ok: true, status: 200 };
      if (url.endsWith("/sitemap.xml")) {
        return { ok: false, status: 500, text: async () => "Internal Server Error" };
      }
      if (url.endsWith("/en/packages/monsoon-heritage-special/")) {
        return { ok: false, status: 404 };
      }
      return { ok: false, status: 404 };
    });

    const worker = new PublicationWorker({
      pool: customPool as any,
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
    });

    const ev: PublishEventRecord = {
      id: "ev-archive-500",
      entity_type: "tour_package",
      entity_id: "mhs-1",
      event_type: "archived",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-10",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };

    const verified = await worker.verifyDeployment(ev);
    expect(verified).toBe(false);
  });

  it("verifyDeployment: for archived event, returns false if sitemap fetch throws network error", async () => {
    const customPool = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("FROM tour_packages WHERE")) {
          return {
            rows: [
              {
                package_code: "monsoon-heritage-special",
                name: "Monsoon Heritage Special",
              },
            ],
          };
        }
        return { rows: [] };
      }),
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/health")) return { ok: true, status: 200 };
      if (url.endsWith("/sitemap.xml")) {
        throw new Error("Connection refused");
      }
      if (url.endsWith("/en/packages/monsoon-heritage-special/")) {
        return { ok: false, status: 404 };
      }
      return { ok: false, status: 404 };
    });

    const worker = new PublicationWorker({
      pool: customPool as any,
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
    });

    const ev: PublishEventRecord = {
      id: "ev-archive-net-err",
      entity_type: "tour_package",
      entity_id: "mhs-1",
      event_type: "archived",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-11",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };

    const verified = await worker.verifyDeployment(ev);
    expect(verified).toBe(false);
  });

  it("verifyDeployment: returns false if title does not match database record", async () => {
    const customPool = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("FROM tour_packages WHERE")) {
          return {
            rows: [
              {
                package_code: "taj-sunrise-tour",
                name: "Updated Sunrise Taj Tour",
                image_url: null,
                gallery: [],
              },
            ],
          };
        }
        return { rows: [] };
      }),
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/health")) return { ok: true, status: 200 };
      if (url.endsWith("/en/packages/taj-sunrise-tour/")) {
        // Serves old title
        return { ok: true, status: 200, text: async () => "<html><title>Old Taj Tour</title></html>" };
      }
      if (url.endsWith("/sitemap.xml")) {
        return {
          ok: true,
          status: 200,
          text: async () => "<urlset><loc>https://agraskbagheltourandtravels.com/en/packages/taj-sunrise-tour/</loc></urlset>",
        };
      }
      return { ok: false, status: 404 };
    });

    const worker = new PublicationWorker({
      pool: customPool as any,
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
    });

    const ev: PublishEventRecord = {
      id: "ev-title-mismatch",
      entity_type: "tour_package",
      entity_id: "pkg-1",
      event_type: "updated",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-12",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };

    const verified = await worker.verifyDeployment(ev);
    expect(verified).toBe(false);
  });

  it("verifyDeployment: returns false if cover image returns HTTP 404", async () => {
    const customPool = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("FROM tour_packages WHERE")) {
          return {
            rows: [
              {
                package_code: "taj-sunrise-tour",
                name: "Sunrise Taj Tour",
                image_url: "/assets/packages/broken-cover.webp",
                gallery: [],
              },
            ],
          };
        }
        return { rows: [] };
      }),
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/health")) return { ok: true, status: 200 };
      if (url.endsWith("/en/packages/taj-sunrise-tour/")) {
        return { ok: true, status: 200, text: async () => "<html><title>Sunrise Taj Tour</title></html>" };
      }
      if (url.endsWith("/assets/packages/broken-cover.webp")) {
        return { ok: false, status: 404 };
      }
      if (url.endsWith("/sitemap.xml")) {
        return {
          ok: true,
          status: 200,
          text: async () => "<urlset><loc>https://agraskbagheltourandtravels.com/en/packages/taj-sunrise-tour/</loc></urlset>",
        };
      }
      return { ok: false, status: 404 };
    });

    const worker = new PublicationWorker({
      pool: customPool as any,
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
    });

    const ev: PublishEventRecord = {
      id: "ev-img-fail",
      entity_type: "tour_package",
      entity_id: "pkg-1",
      event_type: "published",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-13",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };

    const verified = await worker.verifyDeployment(ev);
    expect(verified).toBe(false);
  });

  it("verifyDeployment: returns false if customer site /health check fails or throws", async () => {
    const customPool = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/health")) return { ok: false, status: 503 };
      return { ok: true, status: 200 };
    });

    const worker = new PublicationWorker({
      pool: customPool as any,
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
    });

    const ev: PublishEventRecord = {
      id: "ev-health-fail",
      entity_type: "tour_package",
      entity_id: "pkg-1",
      event_type: "published",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-14",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };

    const verified = await worker.verifyDeployment(ev);
    expect(verified).toBe(false);
  });

  it("verifyDeployment: resolves transfer route and outstation route to canonical detail URLs", async () => {
    const customPool = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes("FROM transfer_routes WHERE")) {
          return {
            rows: [
              {
                route_code: "agra-cantt-to-taj-ganj",
                name: "Agra Cantt to Taj Ganj Transfer",
              },
            ],
          };
        }
        if (sql.includes("FROM routes WHERE")) {
          return {
            rows: [
              {
                slug: "agra-to-delhi-taxi",
                corridor_name: "Agra to Delhi Taxi",
              },
            ],
          };
        }
        return { rows: [] };
      }),
    };

    const fetchedUrls: string[] = [];
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      fetchedUrls.push(url);
      if (url.endsWith("/health")) return { ok: true, status: 200 };
      if (url.endsWith("/en/transfers/agra-cantt-to-taj-ganj/")) {
        return { ok: true, status: 200, text: async () => "<html>Agra Cantt to Taj Ganj Transfer</html>" };
      }
      if (url.endsWith("/en/agra-to-delhi-taxi/")) {
        return { ok: true, status: 200, text: async () => "<html>Agra to Delhi Taxi</html>" };
      }
      if (url.endsWith("/sitemap.xml")) {
        return {
          ok: true,
          status: 200,
          text: async () => `
            <urlset>
              <loc>https://agraskbagheltourandtravels.com/en/transfers/agra-cantt-to-taj-ganj/</loc>
              <loc>https://agraskbagheltourandtravels.com/en/agra-to-delhi-taxi/</loc>
            </urlset>
          `,
        };
      }
      return { ok: false, status: 404 };
    });

    const worker = new PublicationWorker({
      pool: customPool as any,
      customerSiteUrl: "https://agraskbagheltourandtravels.com",
      fetchFn: mockFetch as any,
    });

    // Test transfer
    const transferEv: PublishEventRecord = {
      id: "ev-tr-canonical",
      entity_type: "transfer",
      entity_id: "tr-uuid-1",
      event_type: "published",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-15",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };
    const transferVerified = await worker.verifyDeployment(transferEv);
    expect(transferVerified).toBe(true);
    expect(fetchedUrls).toContain("https://agraskbagheltourandtravels.com/en/transfers/agra-cantt-to-taj-ganj/");

    // Test outstation route
    const routeEv: PublishEventRecord = {
      id: "ev-route-canonical",
      entity_type: "outstation_route",
      entity_id: "rt-uuid-1",
      event_type: "published",
      status: "triggered",
      attempt_count: 1,
      next_attempt_at: new Date(),
      deployment_ref: "cf-16",
      last_error: null,
      created_at: new Date(),
      processed_at: null,
    };
    const routeVerified = await worker.verifyDeployment(routeEv);
    expect(routeVerified).toBe(true);
    expect(fetchedUrls).toContain("https://agraskbagheltourandtravels.com/en/agra-to-delhi-taxi/");
  });
  it("resolves outstation routes using the canonical fare-system columns", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ code: "agra-to-delhi", origin_name: "Agra", destination_name: "Delhi", image_url: "/assets/routes/agra-delhi.webp", gallery: [] }],
    });
    const worker = new PublicationWorker({ pool: { query } as any, customerSiteUrl: "https://agraskbagheltourandtravels.com" });
    const event: PublishEventRecord = {
      id: "ev-current-outstation-schema", entity_type: "outstation_route", entity_id: "route-uuid-1",
      event_type: "published", status: "triggered", attempt_count: 1, next_attempt_at: new Date(),
      deployment_ref: "deployment-1", last_error: null, created_at: new Date(), processed_at: null,
    };
    const resolved = await worker.resolveEntityData(event);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).toContain("FROM outstation_routes");
    expect(query.mock.calls[0][0]).toContain("origin_name");
    expect(query.mock.calls[0][0]).toContain("destination_name");
    expect(query.mock.calls[0][0]).not.toContain("FROM routes");
    expect(resolved).toMatchObject({
      slug: "agra-to-delhi", expectedPath: "/en/agra-to-delhi/",
      expectedTitle: "Agra to Delhi", expectedImage: "/assets/routes/agra-delhi.webp",
    });
  });

});
