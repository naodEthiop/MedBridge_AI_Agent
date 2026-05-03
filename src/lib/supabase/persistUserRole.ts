"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";

export const SELECTED_ROLE_STORAGE_KEY = "selected_role";

export type AppRole = "patient" | "doctor";

export function normalizeAppRole(value: string | null): AppRole {
  return value === "doctor" ? "doctor" : "patient";
}

/** Canonical routes: doctor hub is `/doctor/dashboard` (see `src/app/doctor/page.tsx`). */
export function postLoginPathForRole(role: AppRole) {
  return role === "doctor" ? "/doctor/dashboard" : "/patient";
}

export async function upsertUserRoleRow(
  supabase: SupabaseClient,
  session: Session,
  role: AppRole,
) {
  const { error } = await supabase.from("users").upsert(
    {
      id: session.user.id,
      email: session.user.email ?? null,
      role,
    },
    { onConflict: "id" },
  );
  if (error) {
    console.warn("[auth] users upsert failed:", error.message);
  }
}
