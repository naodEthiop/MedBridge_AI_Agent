// src/lib/db/mcpAudit.ts
// MCP Query Audit Logger
// LOG all queries for observability

import { supabaseMCP } from './supabaseMCP';

interface AuditLog {
  id: string;
  queryType: 'query' | 'insert' | 'update' | 'delete' | 'rpc';
  table?: string;
  tenantId: string;
  userId: string;
  executionTime: number;
  success: boolean;
  error?: string;
  payloadHash?: string;
  timestamp: string;
  metadata: any;
}

class MCPAuditLogger {
  private logs: AuditLog[] = [];
  private maxLogsInMemory = 1000;

  /**
   * Log a database operation
   */
  async logOperation(operation: {
    type: 'query' | 'insert' | 'update' | 'delete' | 'rpc';
    table?: string;
    tenantId: string;
    userId: string;
    startTime: number;
    success: boolean;
    error?: string;
    payload?: any;
  }): Promise<void> {
    const executionTime = Date.now() - operation.startTime;

    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      queryType: operation.type,
      table: operation.table,
      tenantId: operation.tenantId,
      userId: operation.userId,
      executionTime,
      success: operation.success,
      error: operation.error,
      payloadHash: operation.payload ? this.hashPayload(operation.payload) : undefined,
      timestamp: new Date().toISOString(),
      metadata: {
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version
      }
    };

    // Store in memory (for development)
    this.logs.push(log);
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift(); // Remove oldest
    }

    // Persist to database (in production, would use a separate audit table)
    try {
      await supabaseMCP.insert('audit_logs', {
        tenant_id: operation.tenantId,
        operation_type: operation.type,
        table_name: operation.table,
        user_id: operation.userId,
        execution_time_ms: executionTime,
        success: operation.success,
        error_message: operation.error,
        payload_hash: log.payloadHash,
        metadata: log.metadata
      });
    } catch (persistError) {
      console.error('[MCPAudit] Failed to persist audit log:', persistError);
      // Don't throw - audit failure shouldn't break the operation
    }

    // Emit event
    this.emitAuditEvent(log);

    // Log to console for development
    console.log(`[MCPAudit] ${operation.type.toUpperCase()} ${operation.table || ''} - ${executionTime}ms - ${operation.success ? 'SUCCESS' : 'FAILED'}`);
  }

  /**
   * Get audit logs for a tenant
   */
  async getTenantLogs(tenantId: string, limit: number = 100): Promise<AuditLog[]> {
    // In production, query audit_logs table
    return this.logs.filter(log => log.tenantId === tenantId).slice(-limit);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(tenantId?: string): {
    totalQueries: number;
    avgExecutionTime: number;
    successRate: number;
    errorRate: number;
    slowestQueries: AuditLog[];
  } {
    const relevantLogs = tenantId
      ? this.logs.filter(log => log.tenantId === tenantId)
      : this.logs;

    const totalQueries = relevantLogs.length;
    const successfulQueries = relevantLogs.filter(log => log.success);
    const avgExecutionTime = totalQueries > 0
      ? relevantLogs.reduce((sum, log) => sum + log.executionTime, 0) / totalQueries
      : 0;
    const successRate = totalQueries > 0 ? (successfulQueries.length / totalQueries) * 100 : 0;
    const errorRate = 100 - successRate;

    const slowestQueries = [...relevantLogs]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    return {
      totalQueries,
      avgExecutionTime: Math.round(avgExecutionTime * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      slowestQueries
    };
  }

  /**
   * Check for suspicious activity
   */
  detectAnomalies(tenantId: string): {
    highErrorRate: boolean;
    slowQueries: AuditLog[];
    unusualPatterns: string[];
  } {
    const metrics = this.getPerformanceMetrics(tenantId);
    const recentLogs = this.logs.filter(log =>
      log.tenantId === tenantId &&
      new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    const highErrorRate = metrics.errorRate > 10; // >10% errors

    const slowQueries = recentLogs.filter(log => log.executionTime > 5000); // >5 seconds

    const unusualPatterns: string[] = [];
    // Check for rapid successive failures
    const recentFailures = recentLogs.filter(log => !log.success).length;
    if (recentFailures > recentLogs.length * 0.5) {
      unusualPatterns.push('High failure rate in recent operations');
    }

    return {
      highErrorRate,
      slowQueries,
      unusualPatterns
    };
  }

  private hashPayload(payload: any): string {
    // Simple hash for payload - in production use crypto
    const str = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private emitAuditEvent(log: AuditLog): void {
    // Emit to event bus (assuming global eventBus exists)
    if (typeof global !== 'undefined' && (global as any).eventBus) {
      (global as any).eventBus.emit('db:mcp_query_logged', log);
    }

    if (!log.success) {
      if (typeof global !== 'undefined' && (global as any).eventBus) {
        (global as any).eventBus.emit('db:mcp_query_failed', log);
      }
    }
  }
}

// Export singleton
export const mcpAudit = new MCPAuditLogger();

// Helper functions
export async function logQueryAudit(operation: Parameters<MCPAuditLogger['logOperation']>[0]): Promise<void> {
  await mcpAudit.logOperation(operation);
}

export function getAuditMetrics(tenantId?: string) {
  return mcpAudit.getPerformanceMetrics(tenantId);
}