// src/lib/db/mcpSecurity.ts
// MCP Security Enforcement Layer
// Enforces tenant isolation, role-based DB access, query sanitization, PHI protection

import { createDBGateway } from './dbGateway';

interface SecurityContext {
  tenantId: string;
  userId: string;
  role: 'patient' | 'doctor' | 'admin';
  permissions: string[];
}

interface SecurityCheck {
  operation: 'query' | 'insert' | 'update' | 'delete' | 'rpc';
  table: string;
  data?: any;
  filters?: any;
}

export class MCPSecurityEnforcer {
  private context: SecurityContext;
  private gateway: any;

  constructor(securityContext: SecurityContext) {
    this.context = securityContext;
    this.gateway = createDBGateway({
      tenantId: securityContext.tenantId,
      userId: securityContext.userId,
      role: securityContext.role
    });
  }

  /**
   * Enforce security before database operation
   */
  async enforceSecurity(check: SecurityCheck): Promise<SecurityCheck> {
    console.log(`[MCPSecurity] Enforcing security for ${check.operation} on ${check.table}`);

    // Always enforce tenant isolation
    this.enforceTenantIsolation(check);

    // Enforce role-based access
    this.enforceRoleBasedAccess(check);

    // Sanitize query inputs
    this.sanitizeInputs(check);

    // Protect PHI data
    this.protectPHI(check);

    return check;
  }

  /**
   * Enforce tenant isolation at security layer
   */
  private enforceTenantIsolation(check: SecurityCheck): void {
    if (!this.context.tenantId) {
      throw new Error('TENANT_ISOLATION_VIOLATION: No tenant ID provided');
    }

    // Additional tenant isolation checks
    if (check.filters?.tenant_id && check.filters.tenant_id !== this.context.tenantId) {
      throw new Error('TENANT_ISOLATION_VIOLATION: Attempted cross-tenant access');
    }

    if (check.data?.tenant_id && check.data.tenant_id !== this.context.tenantId) {
      throw new Error('TENANT_ISOLATION_VIOLATION: Attempted to set different tenant ID');
    }
  }

  /**
   * Enforce role-based database access
   */
  private enforceRoleBasedAccess(check: SecurityCheck): void {
    const { role, permissions } = this.context;

    // Define access rules by role and table
    const accessRules = {
      patient: {
        allowedTables: ['patients', 'appointments', 'medical_reports', 'labs', 'medical_timeline', 'messages'],
        allowedOperations: ['query'],
        restrictions: {
          patients: 'own_records_only',
          appointments: 'own_records_only',
          medical_reports: 'own_records_only',
          labs: 'own_records_only',
          medical_timeline: 'own_records_only',
          messages: 'own_messages_only'
        }
      },
      doctor: {
        allowedTables: ['patients', 'doctors', 'appointments', 'medical_reports', 'labs', 'medical_timeline', 'messages', 'health_centers'],
        allowedOperations: ['query', 'insert', 'update'],
        restrictions: {
          patients: 'assigned_patients_only',
          appointments: 'own_appointments_only',
          medical_reports: 'own_reports_only'
        }
      },
      admin: {
        allowedTables: ['*'], // All tables
        allowedOperations: ['query', 'insert', 'update', 'delete', 'rpc'],
        restrictions: {} // No restrictions
      }
    };

    const roleRules = accessRules[role];
    if (!roleRules) {
      throw new Error(`ACCESS_DENIED: Unknown role '${role}'`);
    }

    // Check table access
    if (!roleRules.allowedTables.includes('*') && !roleRules.allowedTables.includes(check.table)) {
      throw new Error(`ACCESS_DENIED: Role '${role}' cannot access table '${check.table}'`);
    }

    // Check operation access
    if (!roleRules.allowedOperations.includes(check.operation)) {
      throw new Error(`ACCESS_DENIED: Role '${role}' cannot perform '${check.operation}' on '${check.table}'`);
    }

    // Apply role-specific restrictions
    this.applyRoleRestrictions(check, roleRules.restrictions);
  }

  private applyRoleRestrictions(check: SecurityCheck, restrictions: any): void {
    const restriction = restrictions[check.table];

    switch (restriction) {
      case 'own_records_only':
        if (this.context.role === 'patient') {
          this.addPatientFilter(check);
        }
        break;

      case 'assigned_patients_only':
        if (this.context.role === 'doctor') {
          this.addDoctorPatientFilter(check);
        }
        break;

      case 'own_appointments_only':
        if (this.context.role === 'doctor') {
          this.addDoctorAppointmentFilter(check);
        }
        break;

      case 'own_reports_only':
        if (this.context.role === 'doctor') {
          this.addDoctorReportFilter(check);
        }
        break;

      case 'own_messages_only':
        this.addMessageFilter(check);
        break;
    }
  }

  private addPatientFilter(check: SecurityCheck): void {
    // Patients can only see their own records
    const patientFilter = `user_id = '${this.context.userId}'`;

    if (check.filters?.where) {
      check.filters.where = `(${check.filters.where}) AND ${patientFilter}`;
    } else {
      check.filters = { ...check.filters, where: patientFilter };
    }
  }

  private addDoctorPatientFilter(check: SecurityCheck): void {
    // Doctors can only see patients assigned to them
    const doctorFilter = `primary_doctor_id = '${this.getDoctorId()}'`;

    if (check.filters?.where) {
      check.filters.where = `(${check.filters.where}) AND ${doctorFilter}`;
    } else {
      check.filters = { ...check.filters, where: doctorFilter };
    }
  }

  private addDoctorAppointmentFilter(check: SecurityCheck): void {
    // Doctors can only see their own appointments
    const appointmentFilter = `doctor_id = '${this.getDoctorId()}'`;

    if (check.filters?.where) {
      check.filters.where = `(${check.filters.where}) AND ${appointmentFilter}`;
    } else {
      check.filters = { ...check.filters, where: appointmentFilter };
    }
  }

  private addDoctorReportFilter(check: SecurityCheck): void {
    // Doctors can only see reports they created
    const reportFilter = `doctor_id = '${this.getDoctorId()}'`;

    if (check.filters?.where) {
      check.filters.where = `(${check.filters.where}) AND ${reportFilter}`;
    } else {
      check.filters = { ...check.filters, where: reportFilter };
    }
  }

  private addMessageFilter(check: SecurityCheck): void {
    // Users can only see messages they sent or received
    const messageFilter = `sender_id = '${this.context.userId}' OR receiver_id = '${this.context.userId}'`;

    if (check.filters?.where) {
      check.filters.where = `(${check.filters.where}) AND ${messageFilter}`;
    } else {
      check.filters = { ...check.filters, where: messageFilter };
    }
  }

  private getDoctorId(): string {
    // In a real implementation, this would look up the doctor ID from the user ID
    // For now, assume it's the same or stored in context
    return this.context.userId.replace('user-', 'doc-');
  }

  /**
   * Sanitize query inputs to prevent injection
   */
  private sanitizeInputs(check: SecurityCheck): void {
    // Basic sanitization - in production, use proper SQL escaping
    const sanitizeString = (str: string): string => {
      if (typeof str !== 'string') return str;
      // Remove potentially dangerous characters
      return str.replace(/['";\\]/g, '');
    };

    if (check.filters?.where) {
      check.filters.where = sanitizeString(check.filters.where);
    }

    if (check.data) {
      for (const [key, value] of Object.entries(check.data)) {
        if (typeof value === 'string') {
          check.data[key] = sanitizeString(value);
        }
      }
    }
  }

  /**
   * Protect PHI (Protected Health Information)
   */
  private protectPHI(check: SecurityCheck): void {
    const phiTables = ['patients', 'medical_reports', 'labs', 'medical_timeline'];
    const phiFields = ['ssn', 'full_name', 'dob', 'phone', 'email', 'address', 'medical_history'];

    if (phiTables.includes(check.table)) {
      // Log PHI access for audit
      console.log(`[MCPSecurity] PHI access: ${this.context.role} accessing ${check.table}`);

      // In production, additional PHI protection measures would be implemented:
      // - Encryption at rest
      // - Access logging
      // - Data minimization
      // - Purpose limitation
    }

    // Mask sensitive data in responses (would be implemented in the response layer)
    if (check.operation === 'query' && this.context.role === 'patient') {
      // Patients might not see certain sensitive fields from other patients
      // Implementation would filter response data
    }
  }

  /**
   * Check if operation is allowed
   */
  isOperationAllowed(operation: string, table: string): boolean {
    try {
      this.enforceSecurity({ operation: operation as any, table });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get effective permissions for current context
   */
  getEffectivePermissions(): string[] {
    // Return permissions based on role and context
    const basePermissions = {
      patient: ['read_own_data', 'read_own_appointments', 'read_own_messages'],
      doctor: ['read_assigned_patients', 'write_medical_reports', 'manage_appointments'],
      admin: ['*']
    };

    return basePermissions[this.context.role] || [];
  }
}

// Export enforcer
export const mcpSecurity = new MCPSecurityEnforcer({} as any); // Will be initialized with proper context

// Factory function
export function createMCPSecurityEnforcer(securityContext: SecurityContext): MCPSecurityEnforcer {
  return new MCPSecurityEnforcer(securityContext);
}

// Helper to create security context
export function createSecurityContext(tenantId: string, userId: string, role: 'patient' | 'doctor' | 'admin'): SecurityContext {
  const permissions = {
    patient: ['read_own_data'],
    doctor: ['read_patient_data', 'write_medical_data'],
    admin: ['*']
  };

  return {
    tenantId,
    userId,
    role,
    permissions: permissions[role]
  };
}