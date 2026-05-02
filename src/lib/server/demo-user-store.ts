import { createHash } from "crypto";

import type { SessionUser } from "@/lib/auth/types";

export type StoredUser = {
  passwordHash: string;
  role: "patient" | "doctor";
  patientProfile?: SessionUser["patientProfile"];
  doctorProfile?: SessionUser["doctorProfile"];
};

const g = globalThis as typeof globalThis & { __medbridgeDemoUsers?: Map<string, StoredUser> };

export function getDemoUserStore(): Map<string, StoredUser> {
  if (!g.__medbridgeDemoUsers) g.__medbridgeDemoUsers = new Map();
  return g.__medbridgeDemoUsers;
}

export function hashDemoPassword(password: string, pepper: string): string {
  return createHash("sha256").update(`${password}:${pepper}`, "utf8").digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
