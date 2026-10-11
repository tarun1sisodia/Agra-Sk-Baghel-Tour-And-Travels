import type pg from "pg";
import type { UserRole } from "../../types/domain.js";

export interface AuditLogEntry {
  id?: string;
  actor_id: string;
  actor_role: UserRole;
  resource_type: string;
  resource_id: string;
  action: string;
  before_state?: unknown;
  after_state?: unknown;
  reason?: string | null;
  request_id: string;
}

export class FareAdminRepository {
  constructor(private pool: pg.Pool) {}

  async recordAudit(entry: AuditLogEntry, client?: pg.PoolClient): Promise<string> {
    const q = `
      INSERT INTO admin_audit_logs (
        id, actor_id, actor_role, resource_type, resource_id, action,
        before_state, after_state, reason, request_id
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
      RETURNING id
    `;
    const params = [
      entry.actor_id,
      entry.actor_role,
      entry.resource_type,
      entry.resource_id,
      entry.action,
      entry.before_state ? JSON.stringify(entry.before_state) : null,
      entry.after_state ? JSON.stringify(entry.after_state) : null,
      entry.reason ?? null,
      entry.request_id,
    ];
    const res = client ? await client.query(q, params) : await this.pool.query(q, params);
    return res.rows[0].id;
  }

  async getAuditLogs(limit = 100): Promise<any[]> {
    const res = await this.pool.query(
      "SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT $1",
      [limit]
    );
    return res.rows;
  }

  async getPool(): Promise<pg.Pool> {
    return this.pool;
  }
}
