import type { PoolConfig } from "pg";

/**
 * Defensive Database Connection Pool Configuration (Phase H2 · Technique 8)
 *
 * Implements hyper-scale connection pool tuning based on Shopify & GitHub patterns:
 * - Compatible with PgBouncer Transaction Mode (port 6543) and direct PostgreSQL (port 5432).
 * - Bounded pool size preventing PostgreSQL memory exhaustion (5–10 MB RAM per socket).
 * - Aggressive timeouts preventing runaway queries and deadlock starvations.
 * - TCP KeepAlive preventing silent connection drops behind cloud load balancers.
 */

export interface PoolConfigOptions {
  max?: number;
  min?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  statementTimeoutMillis?: number;
  queryTimeoutMillis?: number;
  keepAlive?: boolean;
  keepAliveInitialDelayMillis?: number;
}

export function parsePositiveInt(val: string | undefined, fallback: number): number {
  if (!val) return fallback;
  const parsed = Number.parseInt(val, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function createPoolConfig(
  databaseUrl: string,
  overrides: PoolConfigOptions = {},
): PoolConfig {
  const max = overrides.max ?? parsePositiveInt(process.env.DATABASE_POOL_MAX, 10);
  const min = overrides.min ?? parsePositiveInt(process.env.DATABASE_POOL_MIN, 2);
  const idleTimeoutMillis =
    overrides.idleTimeoutMillis ??
    parsePositiveInt(process.env.DATABASE_POOL_IDLE_TIMEOUT_MS, 30_000);
  const connectionTimeoutMillis =
    overrides.connectionTimeoutMillis ??
    parsePositiveInt(process.env.DATABASE_POOL_CONN_TIMEOUT_MS, 3_000);
  const statementTimeoutMillis =
    overrides.statementTimeoutMillis ??
    parsePositiveInt(process.env.DATABASE_STATEMENT_TIMEOUT_MS, 5_000);
  const queryTimeoutMillis =
    overrides.queryTimeoutMillis ??
    parsePositiveInt(process.env.DATABASE_QUERY_TIMEOUT_MS, 6_000);
  const keepAlive = overrides.keepAlive ?? true;
  const keepAliveInitialDelayMillis =
    overrides.keepAliveInitialDelayMillis ??
    parsePositiveInt(process.env.DATABASE_KEEPALIVE_DELAY_MS, 10_000);

  return {
    connectionString: databaseUrl,
    max,
    min,
    idleTimeoutMillis,
    connectionTimeoutMillis,
    statement_timeout: statementTimeoutMillis,
    query_timeout: queryTimeoutMillis,
    keepAlive,
    keepAliveInitialDelayMillis,
  };
}
