// src/lib/ai/mcpAIAdapter.ts
// AI Data Adapter (MCP Optimized)
// Convert MCP DB output → AI structured input

import { createDBGateway } from '../db/dbGateway';

interface PatientTimeline {
  patientId: string;
  events: TimelineEvent[];
  summary: PatientSummary;
}

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: 'ai' | 'doctor' | 'system' | 'lab';
  timestamp: string;
  metadata: any;
}

interface PatientSummary {
  demographics: {
    name: string;
    age: number;
    gender: string;
    primaryDoctor?: string;
  };
  conditions: string[];
  allergies: string[];
  currentMedications: string[];
  recentLabs: LabResult[];
  upcomingAppointments: Appointment[];
  riskSignals: RiskSignal[];
}

interface LabResult {
  testName: string;
  result: string;
  normalRange?: string;
  date: string;
}

interface Appointment {
  id: string;
  doctorName: string;
  scheduledAt: string;
  reason?: string;
  urgency: string;
}

interface RiskSignal {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

interface AIAdaptedData {
  patientTimeline: PatientTimeline;
  labs: LabResult[];
  conditions: string[];
  medications: string[];
  riskSignals: RiskSignal[];
  metadata: {
    lastUpdated: string;
    dataCompleteness: number;
    tenantId: string;
  };
}

export class MCPAIAdapter {
  private gateway: any;

  constructor(tenantContext: any) {
    this.gateway = createDBGateway(tenantContext);
  }

  /**
   * Convert raw MCP data to AI-ready structured format
   */
  async adaptPatientData(patientId: string): Promise<AIAdaptedData> {
    console.log(`[MCPAIAdapter] Adapting data for patient: ${patientId}`);

    // Fetch all relevant data in parallel
    const [
      patientData,
      timelineData,
      labsData,
      appointmentsData,
      reportsData
    ] = await Promise.all([
      this.gateway.query('patients', { match: { id: patientId }, limit: 1 }),
      this.gateway.query('medical_timeline', { match: { patient_id: patientId }, orderBy: { column: 'created_at', ascending: false }, limit: 50 }),
      this.gateway.query('labs', { match: { patient_id: patientId }, orderBy: { column: 'created_at', ascending: false }, limit: 20 }),
      this.gateway.query('appointments', { match: { patient_id: patientId, status: 'scheduled' }, orderBy: { column: 'scheduled_at', ascending: true }, limit: 10 }),
      this.gateway.query('medical_reports', { match: { patient_id: patientId }, orderBy: { column: 'created_at', ascending: false }, limit: 5 })
    ]);

    if (!patientData.length) {
      throw new Error(`Patient not found: ${patientId}`);
    }

    const patient = patientData[0];

    // Build timeline
    const timeline: PatientTimeline = {
      patientId,
      events: timelineData.map(this.mapTimelineEvent),
      summary: await this.buildPatientSummary(patient, labsData, appointmentsData)
    };

    // Extract labs
    const labs = labsData.map(this.mapLabResult);

    // Extract conditions and medications from medical history
    const { conditions, medications } = this.extractMedicalData(patient.medical_history);

    // Generate risk signals
    const riskSignals = await this.generateRiskSignals(patient, timeline.events, labs);

    return {
      patientTimeline: timeline,
      labs,
      conditions,
      medications,
      riskSignals,
      metadata: {
        lastUpdated: new Date().toISOString(),
        dataCompleteness: this.calculateDataCompleteness(patient, timeline.events, labs),
        tenantId: patient.tenant_id
      }
    };
  }

  private mapTimelineEvent(raw: any): TimelineEvent {
    return {
      id: raw.id,
      type: raw.event_type,
      title: raw.title,
      description: raw.description,
      severity: raw.severity,
      source: raw.source,
      timestamp: raw.created_at,
      metadata: raw.metadata || {}
    };
  }

  private async buildPatientSummary(patient: any, labsData: any[], appointmentsData: any[]): Promise<PatientSummary> {
    // Calculate age
    const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();

    // Get primary doctor name
    let primaryDoctor: string | undefined;
    if (patient.primary_doctor_id) {
      const doctorData = await this.gateway.query('doctors', {
        match: { id: patient.primary_doctor_id },
        limit: 1
      });
      if (doctorData.length) {
        primaryDoctor = doctorData[0].full_name;
      }
    }

    return {
      demographics: {
        name: patient.full_name,
        age,
        gender: patient.gender,
        primaryDoctor
      },
      conditions: patient.conditions || [],
      allergies: patient.allergies || [],
      currentMedications: this.extractMedicationsFromHistory(patient.medical_history),
      recentLabs: labsData.slice(0, 5).map(this.mapLabResult),
      upcomingAppointments: appointmentsData.map(this.mapAppointment),
      riskSignals: [] // Will be populated separately
    };
  }

  private mapLabResult(raw: any): LabResult {
    return {
      testName: raw.test_name,
      result: raw.result,
      normalRange: raw.normal_range,
      date: raw.created_at
    };
  }

  private mapAppointment(raw: any): Appointment {
    return {
      id: raw.id,
      doctorName: raw.doctor_name || 'Unknown Doctor',
      scheduledAt: raw.scheduled_at,
      reason: raw.reason,
      urgency: raw.urgency
    };
  }

  private extractMedicalData(medicalHistory: any) {
    const conditions = medicalHistory?.conditions || [];
    const medications = medicalHistory?.medications || [];
    return { conditions, medications };
  }

  private extractMedicationsFromHistory(medicalHistory: any): string[] {
    return medicalHistory?.medications || [];
  }

  private async generateRiskSignals(patient: any, events: TimelineEvent[], labs: LabResult[]): Promise<RiskSignal[]> {
    const signals: RiskSignal[] = [];

    // Check for critical events
    const criticalEvents = events.filter(e => e.severity === 'critical');
    if (criticalEvents.length > 0) {
      signals.push({
        type: 'critical_events',
        severity: 'critical',
        description: `${criticalEvents.length} critical medical events in timeline`,
        recommendation: 'Immediate medical attention required'
      });
    }

    // Check medication compliance (simplified)
    const medicationEvents = events.filter(e => e.type.includes('medication'));
    if (medicationEvents.length === 0 && patient.medical_history?.medications?.length > 0) {
      signals.push({
        type: 'medication_compliance',
        severity: 'medium',
        description: 'Potential medication non-compliance detected',
        recommendation: 'Verify medication adherence with patient'
      });
    }

    // Check for abnormal labs
    const abnormalLabs = labs.filter(lab => this.isAbnormalResult(lab));
    if (abnormalLabs.length > 0) {
      signals.push({
        type: 'abnormal_labs',
        severity: 'high',
        description: `${abnormalLabs.length} abnormal lab results`,
        recommendation: 'Review lab results and consider follow-up testing'
      });
    }

    // Age-based risk factors
    const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();
    if (age > 65) {
      signals.push({
        type: 'age_risk',
        severity: 'medium',
        description: 'Patient is over 65 years old',
        recommendation: 'Consider age-related preventive screenings'
      });
    }

    return signals;
  }

  private isAbnormalResult(lab: LabResult): boolean {
    // Simplified abnormality check - in real implementation, would parse normal ranges
    const result = parseFloat(lab.result);
    if (isNaN(result)) return false;

    // Basic checks for common tests
    if (lab.testName.toLowerCase().includes('glucose') && result > 140) return true;
    if (lab.testName.toLowerCase().includes('cholesterol') && result > 200) return true;

    return false;
  }

  private calculateDataCompleteness(patient: any, events: TimelineEvent[], labs: LabResult[]): number {
    let completeness = 0;
    let totalChecks = 0;

    // Check demographics completeness
    totalChecks += 4;
    if (patient.full_name) completeness++;
    if (patient.dob) completeness++;
    if (patient.gender) completeness++;
    if (patient.phone || patient.email) completeness++;

    // Check medical data completeness
    totalChecks += 3;
    if (patient.conditions?.length > 0) completeness++;
    if (patient.allergies?.length > 0) completeness++;
    if (events.length > 0) completeness++;

    // Check lab data
    totalChecks += 1;
    if (labs.length > 0) completeness++;

    return Math.round((completeness / totalChecks) * 100);
  }
}

// Factory function
export function createMCPAIAdapter(tenantContext: any): MCPAIAdapter {
  return new MCPAIAdapter(tenantContext);
}