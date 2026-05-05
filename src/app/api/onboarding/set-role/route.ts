import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSupabaseServerClient } from "@/lib/db/supabaseServer";
import { hasSupabasePublicEnv } from "@/lib/env";
import { z } from "zod";

const bodySchema = z.object({
  role: z.enum(["patient", "doctor"]),
});

export async function POST(request: Request) {
  if (!hasSupabasePublicEnv) {
    return NextResponse.json({ error: "Auth service not configured." }, { status: 503 });
  }

  // Validate session
  const supabase = await getSupabaseServerClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const userId = data.user.id;
  const email = data.user.email ?? "";

  // Validate body
  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await request.json();
    body = bodySchema.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request body. Provide role: 'patient' | 'doctor'." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error: missing service role key." }, { status: 503 });
  }

  // Upsert user row with the selected role
  const { error: upsertError } = await admin
    .from("users")
    .upsert(
      {
        id: userId,
        email,
        role: body.role,
        onboarding_complete: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (upsertError) {
    console.error("[onboarding/set-role] Upsert failed:", upsertError);
    return NextResponse.json({ error: `Failed to save role: ${upsertError.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, role: body.role });
}
