import type { FastifyRequest } from "fastify";
import { Errors } from "../shared/errors.js";
import type { UserRole } from "../types/domain.js";

export function requireRole(request: FastifyRequest, roles: readonly UserRole[]): void {
  const user = request.user;
  if (!user) throw Errors.unauthorized();
  if (user.role === "super_admin") return;
  if (!roles.includes(user.role)) {
    throw Errors.forbidden("Insufficient role for this operations endpoint.");
  }
}

export const SUPER_ADMIN_ROLES = ["super_admin"] as const satisfies readonly UserRole[];
export const CONTENT_ROLES = ["super_admin", "content_editor"] as const satisfies readonly UserRole[];
export const REVIEW_ROLES = ["super_admin", "review_moderator"] as const satisfies readonly UserRole[];
export const DISPATCH_ROLES = ["super_admin", "dispatcher"] as const satisfies readonly UserRole[];
export const FINANCE_ROLES = ["super_admin", "finance_operator"] as const satisfies readonly UserRole[];
export const ADMIN_ROLES = [
  "super_admin",
  "content_editor",
  "review_moderator",
  "dispatcher",
  "finance_operator",
] as const satisfies readonly UserRole[];

/** Roles allowed to access operations-desk resources and previews. */
export function isOperationsRole(role: UserRole | undefined): boolean {
  return role !== undefined && ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}
