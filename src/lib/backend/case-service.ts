// src/lib/backend/case-service.ts
// MCP-Migrated Case Service
// ALL database operations now go through MCP gateway

import { randomUUID } from "node:crypto";
import { createDBGateway } from "@/lib/db/dbGateway";

import { env } from "@/lib/env";

// Default tenant context for case service
const DEFAULT_TENANT_CONTEXT = {
  tenantId: process.env.DEFAULT_TENANT_ID || 'medbridge-tenant-001',
  userId: 'case-service-user',
  role: 'admin' as const
};

type CaseInput = {
  symptoms: string;
  urgency: "low" | "medium" | "urgent";
  redFlags: string[];
  doctorSummary: string;
  status?: "pending" | "monitoring" | "resolved";
  patientName?: string;
  nearestHospital?: {
    name: string;
    distanceKm: number;
    etaMinutes: number;
    phone: string;
  };
};

const inMemoryCases: Array<CaseInput & { id: string; createdAt: string }> = [];
type CaseRecord = CaseInput & { id: string; createdAt: string };

function getDBGateway() {
  return createDBGateway(DEFAULT_TENANT_CONTEXT);
}

export async function listCases(limit = 50, accessToken?: string): Promise<CaseRecord[]> {
  try {
    const dbGateway = getDBGateway();
    const data = await dbGateway.query('cases', {
      orderBy: 'created_at DESC',
      limit
    });

    return data.map((row: any) => ({
      id: row.id as string,
      createdAt: row.created_at as string,
      symptoms: String(row.symptoms ?? ""),
      urgency: (row.urgency as "low" | "medium" | "urgent") ?? "medium",
      redFlags: (row.red_flags as string[] | null) ?? [],
      doctorSummary: String(row.doctor_summary ?? ""),
      status: (row.status as "pending" | "monitoring" | "resolved") ?? "pending",
      patientName: (row.patient_name as string | null) ?? undefined,
      nearestHospital: (row.nearest_hospital as CaseInput["nearestHospital"] | null) ?? undefined,
    }));
  } catch (error) {
    // Graceful fallback to in-memory
    console.warn('[CaseService] MCP query failed, falling back to in-memory:', error);
    return [...inMemoryCases].reverse().slice(0, limit);
  }
}

export async function getCaseById(id: string, accessToken?: string): Promise<CaseRecord | null> {
  try {
    const dbGateway = getDBGateway();
    const data = await dbGateway.query('cases', {
      where: `id = '${id}'`,
      limit: 1
    });

    if (data.length === 0) {
      return inMemoryCases.find((c) => c.id === id) ?? null;
    }

    const row = data[0];
    return {
      id: row.id as string,
      createdAt: row.created_at as string,
      symptoms: String(row.symptoms ?? ""),
      urgency: (row.urgency as "low" | "medium" | "urgent") ?? "medium",
      redFlags: (row.red_flags as string[] | null) ?? [],
      doctorSummary: String(row.doctor_summary ?? ""),
      status: (row.status as "pending" | "monitoring" | "resolved") ?? "pending",
      patientName: (row.patient_name as string | null) ?? undefined,
      nearestHospital: (row.nearest_hospital as CaseInput["nearestHospital"] | null) ?? undefined,
    };
  } catch (error) {
    // Graceful fallback to in-memory
    console.warn('[CaseService] MCP query failed, falling back to in-memory:', error);
    return inMemoryCases.find((c) => c.id === id) ?? null;
  }
}

export async function createCase(input: CaseInput, accessToken?: string) {
  try {
    const dbGateway = getDBGateway();
    const payload = {
      user_id: DEFAULT_TENANT_CONTEXT.userId, // Use default for now, could be extracted from token
      symptoms: input.symptoms,
      urgency: input.urgency,
      red_flags: input.redFlags,
      doctor_summary: input.doctorSummary,
      status: input.status ?? "pending",
      patient_name: input.patientName ?? null,
      nearest_hospital: input.nearestHospital ?? null,
    };

    const data = await dbGateway.insert('cases', payload);
    return {
      id: data.id as string,
      createdAt: data.created_at as string,
      persisted: true
    };
  } catch (error) {
    // Graceful fallback to in-memory
    console.warn('[CaseService] MCP insert failed, falling back to in-memory:', error);
    const created = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    inMemoryCases.push(created);
    return { id: created.id, createdAt: created.createdAt, persisted: false };
  }
}

