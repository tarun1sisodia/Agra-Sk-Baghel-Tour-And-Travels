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
});
