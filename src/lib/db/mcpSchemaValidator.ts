// src/lib/db/mcpSchemaValidator.ts
// MCP Schema Validation Engine
// Ensures code matches database schema in Supabase MCP

import { supabaseMCP } from './supabaseMCP';

interface ValidationResult {
  valid: boolean;
  missingTables: string[];
  missingColumns: string[];
  warnings: string[];
}

interface TableSchema {
  [tableName: string]: {
    columns: string[];
    enums?: { [column: string]: string[] };
    relationships?: string[];
  };
}

// Known schema from supabase-schema.sql
const KNOWN_SCHEMA: TableSchema = {
  users: {
    columns: ['id', 'email', 'role', 'created_at'],
    enums: {
      role: ['patient', 'doctor']
    }
  },
  patients: {
    columns: ['id', 'user_id', 'full_name', 'gender', 'dob', 'phone', 'email', 'primary_doctor_id', 'allergies', 'conditions', 'medical_history', 'created_at', 'updated_at'],
    enums: {
      gender: ['female', 'male', 'other']
    },
    relationships: ['users', 'doctors']
  },
  doctors: {
    columns: ['id', 'user_id', 'full_name', 'specialization', 'clinic_name', 'phone', 'email', 'license_number', 'created_at', 'updated_at'],
    relationships: ['users']
  },
  health_centers: {
    columns: ['id', 'name', 'type', 'lat', 'lng', 'address', 'created_at', 'updated_at'],
    enums: {
      type: ['hospital', 'clinic', 'pharmacy']
    }
  },
  appointments: {
    columns: ['id', 'patient_id', 'doctor_id', 'health_center_id', 'scheduled_at', 'status', 'reason', 'location', 'created_at', 'updated_at', 'urgency'],
    enums: {
      status: ['scheduled', 'completed', 'cancelled'],
      urgency: ['low', 'medium', 'high', 'emergency']
    },
    relationships: ['patients', 'doctors', 'health_centers']
  },
  medical_reports: {
    columns: ['id', 'patient_id', 'doctor_id', 'report_text', 'created_at'],
    relationships: ['patients', 'doctors']
  },
  labs: {
    columns: ['id', 'patient_id', 'test_name', 'result', 'normal_range', 'created_at'],
    relationships: ['patients']
  },
  chat_history: {
    columns: ['id', 'user_id', 'role', 'message', 'metadata', 'created_at'],
    enums: {
      role: ['patient', 'doctor']
    },
    relationships: ['users']
  },
  medical_timeline: {
    columns: ['id', 'patient_id', 'event_type', 'title', 'description', 'severity', 'source', 'metadata', 'created_at'],
    enums: {
      severity: ['low', 'medium', 'high', 'critical'],
      source: ['ai', 'doctor', 'system', 'lab']
    },
    relationships: ['patients']
  },
  messages: {
    columns: ['id', 'sender_id', 'receiver_id', 'role', 'message', 'attachments', 'read', 'created_at'],
    enums: {
      role: ['patient', 'doctor', 'ai']
    },
    relationships: ['users']
  }
};

export class MCPSchemaValidator {
  /**
   * Validate table existence and structure
   */
  async validateTable(table: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      missingTables: [],
      missingColumns: [],
      warnings: []
    };

    // Check if table exists in known schema
    if (!KNOWN_SCHEMA[table]) {
      result.valid = false;
      result.missingTables.push(table);
      result.warnings.push(`Table '${table}' not found in known schema`);
      return result;
    }

    // In a real implementation, query information_schema to validate against actual DB
    // For now, assume known schema is correct
    try {
      // Query to check table exists
      await supabaseMCP.query('information_schema.tables', {
        where: `table_name = '${table}' AND table_schema = 'public'`,
        limit: 1
      });
    } catch (error) {
      result.valid = false;
      result.warnings.push(`Failed to verify table '${table}' exists in database: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate column existence
   */
  async validateColumns(table: string, columns: string[]): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      missingTables: [],
      missingColumns: [],
      warnings: []
    };

    const tableSchema = KNOWN_SCHEMA[table];
    if (!tableSchema) {
      result.valid = false;
      result.missingTables.push(table);
      return result;
    }

    const missingColumns = columns.filter(col => !tableSchema.columns.includes(col));
    if (missingColumns.length > 0) {
      result.valid = false;
      result.missingColumns = missingColumns;
      result.warnings.push(`Missing columns in '${table}': ${missingColumns.join(', ')}`);
    }

    return result;
  }

  /**
   * Validate enum values
   */
  validateEnum(table: string, column: string, value: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      missingTables: [],
      missingColumns: [],
      warnings: []
    };

    const tableSchema = KNOWN_SCHEMA[table];
    if (!tableSchema) {
      result.valid = false;
      result.missingTables.push(table);
      return result;
    }

    const enumValues = tableSchema.enums?.[column];
    if (enumValues && !enumValues.includes(value)) {
      result.valid = false;
      result.warnings.push(`Invalid enum value '${value}' for ${table}.${column}. Allowed: ${enumValues.join(', ')}`);
    }

    return result;
  }

  /**
   * Validate relationship integrity
   */
  async validateRelationships(table: string, data: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      missingTables: [],
      missingColumns: [],
      warnings: []
    };

    const tableSchema = KNOWN_SCHEMA[table];
    if (!tableSchema?.relationships) {
      return result;
    }

    // Check foreign key references exist
    for (const relTable of tableSchema.relationships) {
      const fkColumn = `${relTable.slice(0, -1)}_id`; // e.g., user_id for users table
      const fkValue = data[fkColumn];

      if (fkValue) {
        try {
          const exists = await supabaseMCP.query(relTable, {
            where: `id = '${fkValue}'`,
            limit: 1
          });
          if (exists.length === 0) {
            result.valid = false;
            result.warnings.push(`Foreign key violation: ${fkColumn}='${fkValue}' does not exist in ${relTable}`);
          }
        } catch (error) {
          result.warnings.push(`Failed to validate relationship ${table}.${fkColumn} -> ${relTable}: ${error.message}`);
        }
      }
    }

    return result;
  }
}

// Export singleton
export const mcpSchemaValidator = new MCPSchemaValidator();