// src/lib/db/supabaseMCP.ts — data plane: Supabase service role when configured; no silent empty mocks in production.

import { createSupabaseAdminClient } from "@/lib/supabase/server";

interface QueryFilters {
  where?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
}

interface InsertData {
  [key: string]: unknown;
}

interface UpdateData {
  [key: string]: unknown;
}

function extractTenantId(where: string): string | null {
  const m = where.match(/tenant_id\s*=\s*'([^']+)'/);
  return m?.[1] ?? null;
}

/** Parses `(id = 'x' OR user_id = 'x')` inner clause for patient lookup. */
function extractIdOrUserPair(where: string): { id: string } | null {
  const inner = where.replace(/\s*AND\s*tenant_id\s*=\s*'[^']+'\s*$/i, "").trim();
  const m = inner.match(/^\(?id\s*=\s*'([^']+)'\s+OR\s+user_id\s*=\s*'\1'\)?$/i);
  if (m) return { id: m[1] };
  return null;
}

function parseOrder(orderBy: string): { column: string; ascending: boolean } | null {
  const parts = orderBy.trim().split(/\s+/);
  if (parts.length < 1) return null;
  const column = parts[0];
  const dir = (parts[1] || "ASC").toUpperCase();
  return { column, ascending: dir !== "DESC" };
}

async function queryViaSupabaseAdmin(table: string, filters: QueryFilters): Promise<Record<string, unknown>[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    const msg =
      "[MCP] Real reads require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role). Mock empty results are disabled in production.";
    if (process.env.NODE_ENV === "production") {
      throw new Error(msg);
    }
    console.error(msg);
    return [];
  }

  const where = filters.where?.trim() ?? "";
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
  const offset = Math.max(filters.offset ?? 0, 0);
  const tenantId = extractTenantId(where);

  const pair = extractIdOrUserPair(where);
  if (pair) {
    const started = Date.now();
    let q1 = admin.from(table).select("*").eq("id", pair.id).limit(1);
    if (tenantId) q1 = q1.eq("tenant_id", tenantId);
    const r1 = await q1.maybeSingle();
    if (r1.error) {
      console.error(`[MCP][Supabase] get-by-id failed`, r1.error.message);
      throw new Error(`Database query failed: ${r1.error.message}`);
    }
    if (r1.data) {
      console.info(`[MCP][Supabase] query ok table=${table} rows=1 ${Date.now() - started}ms`);
      return [r1.data as Record<string, unknown>];
    }
    let q2 = admin.from(table).select("*").eq("user_id", pair.id).limit(1);
    if (tenantId) q2 = q2.eq("tenant_id", tenantId);
    const r2 = await q2.maybeSingle();
    if (r2.error) {
      console.error(`[MCP][Supabase] get-by-user_id failed`, r2.error.message);
      throw new Error(`Database query failed: ${r2.error.message}`);
    }
    console.info(`[MCP][Supabase] query ok table=${table} rows=${r2.data ? 1 : 0} ${Date.now() - started}ms`);
    return r2.data ? [r2.data as Record<string, unknown>] : [];
  }

  let q = admin.from(table).select("*");

  if (tenantId) {
    q = q.eq("tenant_id", tenantId);
  }

  if (filters.orderBy) {
    const po = parseOrder(filters.orderBy);
    if (po) {
      q = q.order(po.column, { ascending: po.ascending });
    }
  }

  q = q.range(offset, offset + limit - 1);

  const started = Date.now();
  const { data, error } = await q;
  const ms = Date.now() - started;
  if (error) {
    console.error(`[MCP][Supabase] query failed table=${table} ${ms}ms`, error.message, { where });
    throw new Error(`Database query failed: ${error.message}`);
  }
  console.info(`[MCP][Supabase] query ok table=${table} rows=${data?.length ?? 0} ${ms}ms`);
  return (data ?? []) as Record<string, unknown>[];
}

export class SupabaseMCP {
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  async query(table: string, filters: QueryFilters = {}): Promise<Record<string, unknown>[]> {
    void this.projectId;
    return queryViaSupabaseAdmin(table, filters);
  }

  async insert(table: string, data: InsertData): Promise<unknown> {
    const admin = createSupabaseAdminClient();
    if (!admin) {
      throw new Error("[MCP] insert requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.");
    }
    const started = Date.now();
    const { data: row, error } = await admin.from(table).insert(data as Record<string, unknown>).select().maybeSingle();
    const ms = Date.now() - started;
    if (error) {
      console.error(`[MCP][Supabase] insert failed table=${table} ${ms}ms`, error.message);
      throw new Error(`Database insert failed: ${error.message}`);
    }
    console.info(`[MCP][Supabase] insert ok table=${table} ${ms}ms`);
    return row;
  }

  async update(table: string, id: string, data: UpdateData): Promise<unknown> {
    const admin = createSupabaseAdminClient();
    if (!admin) {
      throw new Error("[MCP] update requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.");
    }
    const started = Date.now();
    const { data: row, error } = await admin.from(table).update(data).eq("id", id).select().maybeSingle();
    const ms = Date.now() - started;
    if (error) {
      console.error(`[MCP][Supabase] update failed table=${table} id=${id} ${ms}ms`, error.message);
      throw new Error(`Database update failed: ${error.message}`);
    }
    console.info(`[MCP][Supabase] update ok table=${table} ${ms}ms`);
    return row;
  }

  async delete(table: string, id: string): Promise<unknown> {
    const admin = createSupabaseAdminClient();
    if (!admin) {
      throw new Error("[MCP] delete requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.");
    }
    const { data: row, error } = await admin.from(table).delete().eq("id", id).select().maybeSingle();
    if (error) {
      console.error(`[MCP][Supabase] delete failed table=${table}`, error.message);
      throw new Error(`Database delete failed: ${error.message}`);
    }
    return row;
  }

  async rpc(functionName: string, params: Record<string, unknown> = {}): Promise<unknown> {
    void functionName;
    void params;
    throw new Error("[MCP] RPC path is not implemented on the Supabase data plane. Use SQL migrations or a typed RPC.");
  }
}

const projectId = process.env.SUPABASE_PROJECT_ID?.trim() || "default";

export const supabaseMCP = new SupabaseMCP(projectId);
