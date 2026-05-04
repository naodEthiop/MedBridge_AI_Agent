import { createSupabaseAdminClient } from "@/lib/supabase/server";

// MCP tool imports - these will be replaced with actual MCP calls
// For now, using mock implementations for development
const mcp_io_github_pge_query_database = async (params: any) => {
  console.warn('[MCP MOCK] query_database called with:', params);
  // Mock implementation - return empty array for now
  return [];
};

const mcp_com_supabase__execute_sql = async (params: any) => {
  console.warn('[MCP MOCK] execute_sql called with:', params);
  // Mock implementation - return success for now
  return { success: true };
};

interface QueryFilters {
  match?: Record<string, any>;
  neq?: Record<string, any>;
  in?: Record<string, any[]>;
  or?: string;
  where?: string;
  limit?: number;
  offset?: number;
  orderBy?: { column: string; ascending: boolean };
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
    q = q.order(filters.orderBy.column, { ascending: filters.orderBy.ascending });
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

  /**
   * Execute a SELECT query through MCP server
   */
  async query(table: string, filters: QueryFilters = {}): Promise<any[]> {
    const { where = '', limit = 100, offset = 0, orderBy } = filters;

    let query = `SELECT * FROM ${table}`;
    if (where) query += ` WHERE ${where}`;
    if (orderBy) query += ` ORDER BY ${orderBy.column} ${orderBy.ascending ? 'ASC' : 'DESC'}`;
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    try {
      const result = await mcp_io_github_pge_query_database({
        query,
        limit,
        offset
      });
      return result; // Assuming result is array of rows
    } catch (error) {
      console.error('MCP Query failed:', error);
      throw new Error(`Database query failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Insert data through MCP server
   */
  async insert(table: string, data: InsertData): Promise<any> {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data).map(v => `'${v}'`).join(', '); // Simple escaping, in real impl use proper escaping
    const query = `INSERT INTO ${table} (${columns}) VALUES (${values}) RETURNING *`;

    try {
      const result = await mcp_com_supabase__execute_sql({
        project_id: this.projectId,
        query
      });
      return result;
    } catch (error) {
      console.error('MCP Insert failed:', error);
      throw new Error(`Database insert failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update data through MCP server
   */
  async update(table: string, id: string, data: UpdateData): Promise<any> {
    const updates = Object.entries(data).map(([k, v]) => `${k} = '${v}'`).join(', ');
    const query = `UPDATE ${table} SET ${updates} WHERE id = '${id}' RETURNING *`;

    try {
      const result = await mcp_com_supabase__execute_sql({
        project_id: this.projectId,
        query
      });
      return result;
    } catch (error) {
      console.error('MCP Update failed:', error);
      throw new Error(`Database update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete data through MCP server
   */
  async delete(table: string, id: string): Promise<any> {
    const query = `DELETE FROM ${table} WHERE id = '${id}' RETURNING *`;

    try {
      const result = await mcp_com_supabase__execute_sql({
        project_id: this.projectId,
        query
      });
      return result;
    } catch (error) {
      console.error('MCP Delete failed:', error);
      throw new Error(`Database delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute RPC function through MCP server
   */
  async rpc(functionName: string, params: any = {}): Promise<any> {
    const paramList = Object.entries(params).map(([k, v]) => `'${v}'`).join(', ');
    const query = `SELECT ${functionName}(${paramList})`;

    try {
      const result = await mcp_com_supabase__execute_sql({
        project_id: this.projectId,
        query
      });
      return result;
    } catch (error) {
      console.error('MCP RPC failed:', error);
      throw new Error(`Database RPC failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export singleton instance
export const supabaseMCP = new SupabaseMCP(process.env.SUPABASE_PROJECT_ID!);