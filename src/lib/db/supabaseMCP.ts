import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type QueryFilters = {
  where?: Record<string, unknown>;
  match?: Record<string, unknown>;
  neq?: Record<string, unknown>;
  in?: Record<string, unknown[]>;
  or?: string;
  limit?: number;
  offset?: number;
  orderBy?: 
    | string 
    | { column: string; ascending?: boolean };
};

interface InsertData {
  [key: string]: unknown;
}

interface UpdateData {
  [key: string]: unknown;
}

function extractTenantId(filters: QueryFilters): string | null {
  if (filters.match?.tenant_id) return filters.match.tenant_id as string;
  if (filters.where?.tenant_id) return filters.where.tenant_id as string;
  return null;
}

function requireTenantId(filters: QueryFilters): string {
  const tenantId = extractTenantId(filters);
  if (!tenantId) {
    throw new Error("TENANT_REQUIRED: tenant_id filter is required for all MCP operations.");
  }
  return tenantId;
}

function normalizeOrder(orderBy: any) {
  if (!orderBy) return null;

  if (typeof orderBy === "string") {
    return { column: orderBy, ascending: true };
  }

  return {
    column: orderBy.column,
    ascending: orderBy.ascending ?? true,
  };
}

async function queryViaSupabaseAdmin(table: string, filters: QueryFilters): Promise<Record<string, unknown>[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("[MCP] Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
  const offset = Math.max(filters.offset ?? 0, 0);
  const tenantId = requireTenantId(filters);

  let q = admin.from(table).select("*");
  q = q.eq("tenant_id", tenantId);

  if (filters.match) {
    for (const [k, v] of Object.entries(filters.match)) {
      if (k !== "tenant_id" && v !== undefined) q = q.eq(k, v);
    }
  } else if (filters.where) {
    for (const [k, v] of Object.entries(filters.where)) {
      if (k !== "tenant_id" && v !== undefined) q = q.eq(k, v);
    }
  }
  if (filters.neq) {
    for (const [k, v] of Object.entries(filters.neq)) {
      if (v !== undefined) q = q.neq(k, v);
    }
  }
  if (filters.in) {
    for (const [k, v] of Object.entries(filters.in)) {
      if (v !== undefined) q = q.in(k, v);
    }
  }
  if (filters.or) {
    q = q.or(filters.or);
  }

  const order = normalizeOrder(filters.orderBy);
  if (order) {
    q = q.order(order.column, { ascending: order.ascending });
  }
  q = q.range(offset, offset + limit - 1);
  const { data, error } = await q;
  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }
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
    if (typeof data.tenant_id !== "string" || !data.tenant_id) {
      throw new Error("TENANT_REQUIRED: tenant_id is required on insert.");
    }
    const admin = createSupabaseAdminClient();
    if (!admin) throw new Error("[MCP] insert requires service role.");
    const { data: row, error } = await admin.from(table).insert(data).select().maybeSingle();
    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }
    return row;
  }

  async update(table: string, id: string, data: UpdateData): Promise<unknown> {
    if (typeof data.tenant_id !== "string" || !data.tenant_id) {
      throw new Error("TENANT_REQUIRED: tenant_id is required on update.");
    }
    const admin = createSupabaseAdminClient();
    if (!admin) throw new Error("[MCP] update requires service role.");
    const { data: row, error } = await admin
      .from(table)
      .update(data)
      .eq("id", id)
      .eq("tenant_id", data.tenant_id)
      .select()
      .maybeSingle();
    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }
    return row;
  }

  async delete(table: string, id: string): Promise<unknown> {
    const admin = createSupabaseAdminClient();
    if (!admin) throw new Error("[MCP] delete requires service role.");
    const { data: row, error } = await admin.from(table).delete().eq("id", id).select().maybeSingle();
    if (error) {
      throw new Error(`Database delete failed: ${error.message}`);
    }
    return row;
  }

  async rpc(functionName: string, params: Record<string, unknown> = {}): Promise<unknown> {
    void functionName;
    void params;
    throw new Error("[MCP] RPC is not implemented.");
  }
}

const projectId = process.env.SUPABASE_PROJECT_ID?.trim() || "default";
export const supabaseMCP = new SupabaseMCP(projectId);