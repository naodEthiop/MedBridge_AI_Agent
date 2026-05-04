// src/lib/db/dbGateway.ts
// MCP Database Gateway Wrapper
// Enforces structured access rules before hitting MCP server

import { supabaseMCP } from './supabaseMCP';
import { mcpSchemaValidator } from './mcpSchemaValidator';
import { QueryFilters } from "@/lib/db/supabaseMCP";

interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

interface InsertData {
  [key: string]: unknown;
}

interface UpdateData {
  [key: string]: unknown;
}

export class DBGateway {
  private tenantContext: TenantContext;

  constructor(tenantContext: TenantContext) {
    this.tenantContext = tenantContext;
  }

  /**
   * Validate schema before query
   */
  private async validateSchema(table: string): Promise<void> {
    const validation = await mcpSchemaValidator.validateTable(table);
    if (!validation.valid) {
      throw new Error(`Schema validation failed: ${validation.warnings.join(', ')}`);
    }
  }

  /**
   * Inject tenant isolation into query
   */
  private injectTenantIsolation(filters: QueryFilters): QueryFilters {
    const isolatedFilters = { ...filters };
    isolatedFilters.match = {
      ...(isolatedFilters.match || {}),
      tenant_id: this.tenantContext.tenantId
    };
    return isolatedFilters;
  }

  /**
   * Attach audit metadata to data
   */
  private attachAuditMetadata(data: InsertData | UpdateData): InsertData | UpdateData {
    return {
      ...data,
      updated_by: this.tenantContext.userId,
      updated_at: new Date().toISOString(),
      tenant_id: this.tenantContext.tenantId
    };
  }

  /**
   * Query with tenant isolation and validation
   */
  async query(table: string, filters: QueryFilters = {}): Promise<any[]> {
    if (!this.tenantContext.tenantId) {
      throw new Error('TENANT_REQUIRED: Tenant ID is required for all database operations');
    }

    await this.validateSchema(table);

    const tenantFilters = this.injectTenantIsolation(filters);

    // Log query for observability
    console.log(`[DBGateway] Query: ${table}, Tenant: ${this.tenantContext.tenantId}, Filters:`, tenantFilters);

    const safeFilters = {
      ...tenantFilters,
      orderBy: tenantFilters.orderBy
        ? {
            column:
              typeof tenantFilters.orderBy === "string"
                ? tenantFilters.orderBy
                : tenantFilters.orderBy.column,
            ascending:
              typeof tenantFilters.orderBy === "object"
                ? tenantFilters.orderBy.ascending ?? true
                : true,
          }
        : undefined,
    };

    return supabaseMCP.query(table, safeFilters);
  }

  /**
   * Insert with tenant isolation and audit
   */
  async insert(table: string, data: InsertData): Promise<any> {
    if (!this.tenantContext.tenantId) {
      throw new Error('TENANT_REQUIRED: Tenant ID is required for all database operations');
    }

    await this.validateSchema(table);

    const auditedData = this.attachAuditMetadata(data);

    // Log insert for observability
    console.log(`[DBGateway] Insert: ${table}, Tenant: ${this.tenantContext.tenantId}, Data:`, auditedData);

    return supabaseMCP.insert(table, auditedData);
  }

  /**
   * Update with tenant isolation and audit
   */
  async update(table: string, id: string, data: UpdateData): Promise<any> {
    if (!this.tenantContext.tenantId) {
      throw new Error('TENANT_REQUIRED: Tenant ID is required for all database operations');
    }

    await this.validateSchema(table);

    const auditedData = this.attachAuditMetadata(data);

    // Log update for observability
    console.log(`[DBGateway] Update: ${table}, ID: ${id}, Tenant: ${this.tenantContext.tenantId}, Data:`, auditedData);

    return supabaseMCP.update(table, id, auditedData);
  }

  /**
   * Delete with tenant isolation
   */
  async delete(table: string, id: string): Promise<any> {
    if (!this.tenantContext.tenantId) {
      throw new Error('TENANT_REQUIRED: Tenant ID is required for all database operations');
    }

    await this.validateSchema(table);

    // Log delete for observability
    console.log(`[DBGateway] Delete: ${table}, ID: ${id}, Tenant: ${this.tenantContext.tenantId}`);

    return supabaseMCP.delete(table, id);
  }

  /**
   * RPC with tenant context
   */
  async rpc(functionName: string, params: any = {}): Promise<any> {
    if (!this.tenantContext.tenantId) {
      throw new Error('TENANT_REQUIRED: Tenant ID is required for all database operations');
    }

    const tenantParams = {
      ...params,
      tenant_id: this.tenantContext.tenantId,
      user_id: this.tenantContext.userId
    };

    // Log RPC for observability
    console.log(`[DBGateway] RPC: ${functionName}, Tenant: ${this.tenantContext.tenantId}, Params:`, tenantParams);

    return supabaseMCP.rpc(functionName, tenantParams);
  }
}

// Factory function to create gateway with tenant context
export function createDBGateway(tenantContext: TenantContext): DBGateway {
  return new DBGateway(tenantContext);
}