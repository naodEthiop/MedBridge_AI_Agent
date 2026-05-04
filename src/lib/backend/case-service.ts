import { getSupabaseServerClient } from "@/lib/db/supabaseServer";

export async function createCase(data: any, token?: string) {
  const sb = await getSupabaseServerClient();
  const res = await sb.from("cases").insert(data).select().single();
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export async function listCases(limit = 50, token?: string) {
  const sb = await getSupabaseServerClient();
  const res = await sb.from("cases").select("*").limit(limit);
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export async function getCaseById(id: string, token?: string) {
  const sb = await getSupabaseServerClient();
  const res = await sb.from("cases").select("*").eq("id", id).single();
  if (res.error) throw new Error(res.error.message);
  return res.data;
}
