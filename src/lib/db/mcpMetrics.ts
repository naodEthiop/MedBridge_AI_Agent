// src/lib/db/mcpMetrics.ts
// MCP Performance Monitor
// Track query latency, MCP server response time, error rate, tenant load

interface MetricPoint {
  timestamp: number;
  value: number;
  labels: Record<string, string>;
}

interface MetricsSnapshot {
  queryLatency: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
  };
  mcpResponseTime: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
  };
  errorRate: number;
  tenantLoad: Record<string, number>;
  totalQueries: number;
  uptime: number;
}

class MCPMetricsMonitor {
  private metrics: Map<string, MetricPoint[]> = new Map();
  private startTime: number = Date.now();
  private maxPointsPerMetric = 1000;

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, labels: Record<string, string> = {}): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const points = this.metrics.get(name)!;
    points.push({
      timestamp: Date.now(),
      value,
      labels
    });

    // Keep only recent points
    if (points.length > this.maxPointsPerMetric) {
      points.shift();
    }
  }

  /**
   * Record query execution time
   */
  recordQueryLatency(operationType: string, executionTime: number, tenantId: string): void {
    this.recordMetric('query_latency', executionTime, {
      operation: operationType,
      tenant_id: tenantId
    });
  }

  /**
   * Record MCP server response time
   */
  recordMCPResponseTime(responseTime: number, tenantId: string): void {
    this.recordMetric('mcp_response_time', responseTime, {
      tenant_id: tenantId
    });
  }

  /**
   * Record query error
   */
  recordQueryError(operationType: string, tenantId: string, errorType: string): void {
    this.recordMetric('query_error', 1, {
      operation: operationType,
      tenant_id: tenantId,
      error_type: errorType
    });
  }

  /**
   * Record successful query
   */
  recordQuerySuccess(operationType: string, tenantId: string): void {
    this.recordMetric('query_success', 1, {
      operation: operationType,
      tenant_id: tenantId
    });
  }

  /**
   * Get current metrics snapshot
   */
  getMetricsSnapshot(): MetricsSnapshot {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Get recent points (last hour)
    const recentPoints = (name: string) =>
      (this.metrics.get(name) || []).filter(p => p.timestamp > oneHourAgo);

    // Calculate percentiles
    const calculatePercentile = (values: number[], percentile: number): number => {
      if (values.length === 0) return 0;
      const sorted = values.sort((a, b) => a - b);
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };

    const queryLatencies = recentPoints('query_latency').map(p => p.value);
    const mcpResponseTimes = recentPoints('mcp_response_time').map(p => p.value);

    // Calculate tenant load
    const tenantLoad: Record<string, number> = {};
    recentPoints('query_success').forEach(point => {
      const tenantId = point.labels.tenant_id;
      tenantLoad[tenantId] = (tenantLoad[tenantId] || 0) + point.value;
    });

    // Calculate error rate
    const totalQueries = recentPoints('query_success').length + recentPoints('query_error').length;
    const errors = recentPoints('query_error').length;
    const errorRate = totalQueries > 0 ? (errors / totalQueries) * 100 : 0;

    return {
      queryLatency: {
        p50: calculatePercentile(queryLatencies, 50),
        p95: calculatePercentile(queryLatencies, 95),
        p99: calculatePercentile(queryLatencies, 99),
        avg: queryLatencies.length > 0 ? queryLatencies.reduce((a, b) => a + b, 0) / queryLatencies.length : 0
      },
      mcpResponseTime: {
        p50: calculatePercentile(mcpResponseTimes, 50),
        p95: calculatePercentile(mcpResponseTimes, 95),
        p99: calculatePercentile(mcpResponseTimes, 99),
        avg: mcpResponseTimes.length > 0 ? mcpResponseTimes.reduce((a, b) => a + b, 0) / mcpResponseTimes.length : 0
      },
      errorRate,
      tenantLoad,
      totalQueries,
      uptime: now - this.startTime
    };
  }

  /**
   * Get tenant-specific metrics
   */
  getTenantMetrics(tenantId: string): {
    queryCount: number;
    avgLatency: number;
    errorRate: number;
    recentErrors: MetricPoint[];
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const tenantQueryLatencies = (this.metrics.get('query_latency') || [])
      .filter(p => p.labels.tenant_id === tenantId && p.timestamp > oneHourAgo)
      .map(p => p.value);

    const tenantErrors = (this.metrics.get('query_error') || [])
      .filter(p => p.labels.tenant_id === tenantId && p.timestamp > oneHourAgo);

    const tenantSuccesses = (this.metrics.get('query_success') || [])
      .filter(p => p.labels.tenant_id === tenantId && p.timestamp > oneHourAgo);

    const totalTenantQueries = tenantErrors.length + tenantSuccesses.length;
    const errorRate = totalTenantQueries > 0 ? (tenantErrors.length / totalTenantQueries) * 100 : 0;
    const avgLatency = tenantQueryLatencies.length > 0
      ? tenantQueryLatencies.reduce((a, b) => a + b, 0) / tenantQueryLatencies.length
      : 0;

    return {
      queryCount: totalTenantQueries,
      avgLatency: Math.round(avgLatency * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      recentErrors: tenantErrors.slice(-10) // Last 10 errors
    };
  }

  /**
   * Check if metrics indicate performance issues
   */
  checkHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const metrics = this.getMetricsSnapshot();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check latency
    if (metrics.queryLatency.p95 > 5000) { // 5 seconds
      issues.push('High query latency (P95 > 5s)');
      recommendations.push('Consider query optimization or database indexing');
    }

    // Check error rate
    if (metrics.errorRate > 5) {
      issues.push(`High error rate: ${metrics.errorRate.toFixed(1)}%`);
      recommendations.push('Investigate error patterns and fix underlying issues');
    }

    // Check MCP response time
    if (metrics.mcpResponseTime.p95 > 2000) { // 2 seconds
      issues.push('Slow MCP server response time');
      recommendations.push('Check MCP server performance and network latency');
    }

    // Check tenant load imbalance
    const tenantLoads = Object.values(metrics.tenantLoad);
    if (tenantLoads.length > 1) {
      const avgLoad = tenantLoads.reduce((a, b) => a + b, 0) / tenantLoads.length;
      const maxLoad = Math.max(...tenantLoads);
      if (maxLoad > avgLoad * 2) {
        issues.push('Uneven tenant load distribution');
        recommendations.push('Consider load balancing or tenant-specific optimizations');
      }
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 2) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }

    return { status, issues, recommendations };
  }

  /**
   * Emit metrics update event
   */
  emitMetricsUpdate(): void {
    const metrics = this.getMetricsSnapshot();

    // Emit to event bus
    if (typeof global !== 'undefined' && (global as any).eventBus) {
      (global as any).eventBus.emit('db:mcp_metrics_updated', metrics);
    }
  }
}

// Export singleton
export const mcpMetrics = new MCPMetricsMonitor();

// Helper functions
export function recordQueryMetrics(operationType: string, executionTime: number, tenantId: string, success: boolean): void {
  mcpMetrics.recordQueryLatency(operationType, executionTime, tenantId);

  if (success) {
    mcpMetrics.recordQuerySuccess(operationType, tenantId);
  } else {
    mcpMetrics.recordQueryError(operationType, tenantId, 'unknown');
  }
}