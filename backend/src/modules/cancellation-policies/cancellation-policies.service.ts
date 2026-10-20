// backend/src/modules/cancellation-policies/cancellation-policies.service.ts
import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { triggerFrontendRebuild } from "../../shared/deploy-hook.js";
import type { UpdateCancellationPolicyInput } from "./cancellation-policies.schema.js";

export function createCancellationPoliciesService(deps: { db: Repositories; clock: Clock }) {
  return {
    async list() {
      return deps.db.cancellationPolicies.list();
    },

    async get(id: string) {
      const items = await deps.db.cancellationPolicies.list();
      const found = items.find((item) => item.id === id);
      if (!found) {
        throw Errors.notFound("CANCELLATION_POLICY_NOT_FOUND", "Cancellation policy not found.");
      }
      return found;
    },

    async update(id: string, input: UpdateCancellationPolicyInput) {
      const current = await this.get(id);
      const now = toIso(deps.clock.now());

      const updated = await deps.db.cancellationPolicies.update({
        ...current,
        noticePeriodText: input.notice_period_text ?? current.noticePeriodText,
        feeRetainedPercent: input.fee_retained_percent ?? current.feeRetainedPercent,
        refundPercent: input.refund_percent ?? current.refundPercent,
        ruleText: input.rule_text ?? current.ruleText,
        refundTimelineNote: input.refund_timeline_note ?? current.refundTimelineNote,
        updatedAt: now,
      });

      // Enqueue to Publishing Events Outbox for durable tracking and customer site delivery
      try {
        await deps.db.publishEvents.enqueue({
          entityType: "cancellation_policy",
          entityId: id,
          eventType: "updated",
        });
      } catch {
        // Graceful fallback if enqueue encounters issues
      }

      await triggerFrontendRebuild();
      return updated;
    },
  };
}
