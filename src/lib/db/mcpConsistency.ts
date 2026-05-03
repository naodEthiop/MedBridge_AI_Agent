// src/lib/db/mcpConsistency.ts
// Data Consistency & Conflict Guard
// Timestamp-based resolution, prevent duplicate patients, prevent orphan records

import { supabaseMCP } from './supabaseMCP';
import { createDBGateway } from './dbGateway';

interface ConsistencyCheck {
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  tenantId: string;
}

interface ConflictResolution {
  resolved: boolean;
  action: 'merge' | 'overwrite' | 'reject' | 'create_new';
  reason: string;
  mergedData?: any;
}

export class MCPConsistencyGuard {
  private gateway: any;

  constructor(tenantContext: any) {
    this.gateway = createDBGateway(tenantContext);
  }

  /**
   * Check data consistency before operation
   */
  async checkConsistency(check: ConsistencyCheck): Promise<ConsistencyCheck> {
    console.log(`[MCPConsistency] Checking consistency for ${check.operation} on ${check.table}`);

    switch (check.table) {
      case 'patients':
        return await this.checkPatientConsistency(check);
      case 'appointments':
        return await this.checkAppointmentConsistency(check);
      case 'medical_reports':
        return await this.checkMedicalReportConsistency(check);
      case 'labs':
        return await this.checkLabConsistency(check);
      default:
        return check; // No special checks for other tables
    }
  }

  /**
   * Prevent duplicate patients
   */
  private async checkPatientConsistency(check: ConsistencyCheck): Promise<ConsistencyCheck> {
    if (check.operation === 'insert') {
      // Check for duplicate email
      const existingByEmail = await this.gateway.query('patients', {
        where: `email = '${check.data.email}'`,
        limit: 1
      });

      if (existingByEmail.length > 0) {
        throw new Error(`DUPLICATE_PATIENT: Patient with email ${check.data.email} already exists`);
      }

      // Check for duplicate phone
      if (check.data.phone) {
        const existingByPhone = await this.gateway.query('patients', {
          where: `phone = '${check.data.phone}'`,
          limit: 1
        });

        if (existingByPhone.length > 0) {
          throw new Error(`DUPLICATE_PATIENT: Patient with phone ${check.data.phone} already exists`);
        }
      }

      // Validate age (must be reasonable)
      const age = new Date().getFullYear() - new Date(check.data.dob).getFullYear();
      if (age < 0 || age > 150) {
        throw new Error(`INVALID_AGE: Patient age ${age} is not valid`);
      }
    }

    return check;
  }

  /**
   * Prevent orphan appointments
   */
  private async checkAppointmentConsistency(check: ConsistencyCheck): Promise<ConsistencyCheck> {
    // Verify patient exists
    const patientExists = await this.gateway.query('patients', {
      where: `id = '${check.data.patient_id}'`,
      limit: 1
    });

    if (patientExists.length === 0) {
      throw new Error(`ORPHAN_RECORD: Patient ${check.data.patient_id} does not exist`);
    }

    // Verify doctor exists
    const doctorExists = await this.gateway.query('doctors', {
      where: `id = '${check.data.doctor_id}'`,
      limit: 1
    });

    if (doctorExists.length === 0) {
      throw new Error(`ORPHAN_RECORD: Doctor ${check.data.doctor_id} does not exist`);
    }

    // Verify health center exists
    const healthCenterExists = await this.gateway.query('health_centers', {
      where: `id = '${check.data.health_center_id}'`,
      limit: 1
    });

    if (healthCenterExists.length === 0) {
      throw new Error(`ORPHAN_RECORD: Health center ${check.data.health_center_id} does not exist`);
    }

    // Check for scheduling conflicts
    if (check.operation === 'insert' || check.operation === 'update') {
      const conflicts = await this.gateway.query('appointments', {
        where: `doctor_id = '${check.data.doctor_id}' AND scheduled_at = '${check.data.scheduled_at}' AND status = 'scheduled' AND id != '${check.data.id || ''}'`,
        limit: 1
      });

      if (conflicts.length > 0) {
        throw new Error(`SCHEDULING_CONFLICT: Doctor ${check.data.doctor_id} has a conflicting appointment`);
      }
    }

    return check;
  }

  /**
   * Prevent orphan medical reports
   */
  private async checkMedicalReportConsistency(check: ConsistencyCheck): Promise<ConsistencyCheck> {
    // Verify patient exists
    const patientExists = await this.gateway.query('patients', {
      where: `id = '${check.data.patient_id}'`,
      limit: 1
    });

    if (patientExists.length === 0) {
      throw new Error(`ORPHAN_RECORD: Patient ${check.data.patient_id} does not exist`);
    }

    // Verify doctor exists
    const doctorExists = await this.gateway.query('doctors', {
      where: `id = '${check.data.doctor_id}'`,
      limit: 1
    });

    if (doctorExists.length === 0) {
      throw new Error(`ORPHAN_RECORD: Doctor ${check.data.doctor_id} does not exist`);
    }

    return check;
  }

  /**
   * Prevent orphan lab results
   */
  private async checkLabConsistency(check: ConsistencyCheck): Promise<ConsistencyCheck> {
    // Verify patient exists
    const patientExists = await this.gateway.query('patients', {
      where: `id = '${check.data.patient_id}'`,
      limit: 1
    });

    if (patientExists.length === 0) {
      throw new Error(`ORPHAN_RECORD: Patient ${check.data.patient_id} does not exist`);
    }

    return check;
  }

  /**
   * Resolve conflicts using timestamp-based resolution
   */
  async resolveConflict(table: string, existingRecord: any, newData: any): Promise<ConflictResolution> {
    console.log(`[MCPConsistency] Resolving conflict for ${table}`);

    // Use updated_at timestamps for resolution
    const existingTime = new Date(existingRecord.updated_at).getTime();
    const newTime = new Date(newData.updated_at || new Date()).getTime();

    if (newTime > existingTime) {
      return {
        resolved: true,
        action: 'overwrite',
        reason: 'Newer data overwrites older data'
      };
    } else if (newTime < existingTime) {
      return {
        resolved: true,
        action: 'reject',
        reason: 'Older data rejected in favor of existing data'
      };
    } else {
      // Same timestamp - check for actual differences
      const differences = this.findDifferences(existingRecord, newData);

      if (differences.length === 0) {
        return {
          resolved: true,
          action: 'reject',
          reason: 'No actual differences detected'
        };
      }

      // For patients, merge certain fields
      if (table === 'patients') {
        return this.mergePatientData(existingRecord, newData, differences);
      }

      return {
        resolved: true,
        action: 'create_new',
        reason: 'Conflicting data with same timestamp - creating new version'
      };
    }
  }

  private findDifferences(obj1: any, obj2: any): string[] {
    const differences: string[] = [];
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    for (const key of allKeys) {
      if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        differences.push(key);
      }
    }

    return differences;
  }

  private mergePatientData(existing: any, newData: any, differences: string[]): ConflictResolution {
    const merged = { ...existing };

    // Safe fields to merge
    const safeFields = ['phone', 'email', 'allergies', 'conditions', 'medical_history'];

    for (const field of differences) {
      if (safeFields.includes(field)) {
        // Merge arrays by combining unique values
        if (Array.isArray(existing[field]) && Array.isArray(newData[field])) {
          merged[field] = [...new Set([...existing[field], ...newData[field]])];
        } else {
          // For other fields, prefer non-null values
          merged[field] = newData[field] !== null && newData[field] !== undefined ? newData[field] : existing[field];
        }
      }
    }

    return {
      resolved: true,
      action: 'merge',
      reason: 'Patient data merged safely',
      mergedData: merged
    };
  }

  /**
   * Validate FK integrity
   */
  async validateForeignKeys(table: 'patients' | 'appointments' | 'medical_reports' | 'labs' | 'medical_timeline', data: any): Promise<void> {
    const relationships = {
      patients: ['primary_doctor_id'],
      appointments: ['patient_id', 'doctor_id', 'health_center_id'],
      medical_reports: ['patient_id', 'doctor_id'],
      labs: ['patient_id'],
      medical_timeline: ['patient_id']
    };

    const fkFields = relationships[table] || [];

    for (const fkField of fkFields) {
      const fkValue = data[fkField];
      if (!fkValue) continue;

      // Determine referenced table
      let refTable: string;
      if (fkField.includes('doctor')) refTable = 'doctors';
      else if (fkField.includes('patient')) refTable = 'patients';
      else if (fkField.includes('health_center')) refTable = 'health_centers';
      else continue;

      const exists = await this.gateway.query(refTable, {
        where: `id = '${fkValue}'`,
        limit: 1
      });

      if (exists.length === 0) {
        throw new Error(`FK_VIOLATION: ${fkField}='${fkValue}' does not exist in ${refTable}`);
      }
    }
  }
}

// Export guard
export const mcpConsistency = new MCPConsistencyGuard({} as any); // Will be initialized with proper context

// Factory function
export function createMCPConsistencyGuard(tenantContext: any): MCPConsistencyGuard {
  return new MCPConsistencyGuard(tenantContext);
}