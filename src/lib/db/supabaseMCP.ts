// src/lib/db/supabaseMCP.ts
// Core Supabase MCP Server connection layer
// ALL database operations MUST route through this layer

import { mcp_io_github_pge_query_database } from 'mcp-io-github-pge';
import { mcp_com_supabase__execute_sql } from 'mcp-com-supabase';

interface QueryFilters {
  where?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
}

interface InsertData {
  [key: string]: any;
}

interface UpdateData {
  [key: string]: any;
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
    const { where = '', limit = 100, offset = 0, orderBy = '' } = filters;

    let query = `SELECT * FROM ${table}`;
    if (where) query += ` WHERE ${where}`;
    if (orderBy) query += ` ORDER BY ${orderBy}`;
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
      throw new Error(`Database query failed: ${error.message}`);
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
      throw new Error(`Database insert failed: ${error.message}`);
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
      throw new Error(`Database update failed: ${error.message}`);
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
      throw new Error(`Database delete failed: ${error.message}`);
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
      throw new Error(`Database RPC failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export const supabaseMCP = new SupabaseMCP(process.env.SUPABASE_PROJECT_ID!);