// src/lib/db/demoMode.ts
// Demo Data Mode (Controlled MCP Seeding)
// Enable safe demo environment inside MCP layer

import { createDBGateway } from './dbGateway';

interface DemoConfig {
  enabled: boolean;
  tenantId: string;
  userId: string;
  role: string;
}

class DemoModeManager {
  private config: DemoConfig | null = null;

  /**
   * Enable demo mode
   */
  enable(config: DemoConfig): void {
    if (process.env.DEMO_MODE !== 'true') {
      throw new Error('Demo mode can only be enabled when DEMO_MODE=true');
    }

    this.config = config;
    console.log('[DemoMode] Enabled for tenant:', config.tenantId);
  }

  /**
   * Disable demo mode
   */
  disable(): void {
    this.config = null;
    console.log('[DemoMode] Disabled');
  }

  /**
   * Check if demo mode is active
   */
  isEnabled(): boolean {
    return this.config !== null && process.env.DEMO_MODE === 'true';
  }

  /**
   * Get demo gateway (only if enabled)
   */
  getDemoGateway() {
    if (!this.isEnabled() || !this.config) {
      throw new Error('Demo mode not enabled');
    }

    return createDBGateway({
      tenantId: this.config.tenantId,
      userId: this.config.userId,
      role: this.config.role
    });
  }

  /**
   * Mark data as demo
   */
  markAsDemo(data: any): any {
    return {
      ...data,
      isDemo: true,
      demoCreatedAt: new Date().toISOString()
    };
  }

  /**
   * Check if data is demo
   */
  isDemoData(data: any): boolean {
    return data.isDemo === true;
  }

  /**
   * Filter out demo data from production queries
   */
  addDemoFilter(whereClause: string = ''): string {
    const demoFilter = 'isDemo IS NOT true';
    return whereClause ? `(${whereClause}) AND ${demoFilter}` : demoFilter;
  }

  /**
   * Ensure demo data never enters critical systems
   */
  validateDemoSafety(operation: string, table: string): void {
    if (!this.isEnabled()) return;

    const forbiddenTables = [
      'billing',
      'insurance',
      'ehr_sync',
      'hl7_exports',
      'fhir_exports'
    ];

    if (forbiddenTables.includes(table)) {
      throw new Error(`DEMO_SAFETY_VIOLATION: Demo mode cannot access ${table} for ${operation}`);
    }
  }

  /**
   * Get allowed demo entities
   */
  getAllowedDemoEntities(): string[] {
    return [
      'patients',
      'doctors',
      'appointments',
      'labs',
      'health_centers',
      'medical_reports',
      'chat_history',
      'medical_timeline',
      'messages'
    ];
  }
}

// Export singleton
export const demoMode = new DemoModeManager();

// Environment variable check
export function isDemoModeEnabled(): boolean {
  return process.env.DEMO_MODE === 'true';
}

// Demo tenant configuration
export const DEMO_TENANT_CONFIG = {
  tenantId: 'demo-tenant-001',
  userId: 'demo-user-001',
  role: 'admin'
};