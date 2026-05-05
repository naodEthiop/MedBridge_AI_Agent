import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSupabaseServerClient } from "@/lib/db/supabaseServer";
import { hasSupabasePublicEnv } from "@/lib/env";
import { z } from "zod";

const patientSchema = z.object({
  role: z.literal("patient"),
  fullName: z.string().min(1, "Full name is required."),
  age: z.number().int().min(1).max(130),
  gender: z.enum(["female", "male", "other"]),
  phone: z.string().min(1, "Phone number is required."),
  medicalNotes: z.string().optional(),
});

const doctorSchema = z.object({
  role: z.literal("doctor"),
  fullName: z.string().min(1, "Full name is required."),
  specialization: z.string().min(1, "Specialization is required."),
  hospital: z.string().min(1, "Hospital/clinic name is required."),
  yearsOfExperience: z.number().int().min(0).max(80),
  licenseId: z.string().min(1, "License ID is required."),
});

const bodySchema = z.discriminatedUnion("role", [patientSchema, doctorSchema]);

export async function POST(request: Request) {
  if (!hasSupabasePublicEnv) {
    return NextResponse.json({ error: "Auth service not configured." }, { status: 503 });
  }

  // Validate session
  const supabase = await getSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const userId = authData.user.id;
  const email = authData.user.email ?? "";

  // Validate body
  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await request.json();
    const result = bodySchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    body = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Server configuration error: missing service role key." },
      { status: 503 }
    );
  }

  // 1. Update public.users — set full_name + role + onboarding_complete = true
  const { error: userUpdateError } = await admin
    .from("users")
    .upsert(
      {
        id: userId,
        email,
        role: body.role,
        full_name: body.fullName,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (userUpdateError) {
    console.error("[onboarding/complete] users upsert failed:", userUpdateError);
    return NextResponse.json(
      { error: `Failed to update user record: ${userUpdateError.message}` },
      { status: 500 }
    );
  }

  // 2. Upsert role-specific profile table
  if (body.role === "patient") {
    const { error: patientError } = await admin
      .from("patients")
      .upsert(
        {
          user_id: userId,
          full_name: body.fullName,
          gender: body.gender,
          phone: body.phone,
          age: body.age,
          medical_notes: body.medicalNotes ?? null,
          // Required non-null fields in schema — set defaults
          dob: new Date(new Date().getFullYear() - body.age, 0, 1).toISOString().split("T")[0],
          email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (patientError) {
      console.error("[onboarding/complete] patients upsert failed:", patientError);
      return NextResponse.json(
        { error: `Failed to save patient profile: ${patientError.message}` },
        { status: 500 }
      );
    }
  } else {
    const { error: doctorError } = await admin
      .from("doctors")
      .upsert(
        {
          user_id: userId,
          full_name: body.fullName,
          specialization: body.specialization,
          clinic_name: body.hospital,
          experience_years: body.yearsOfExperience,
          license_id: body.licenseId,
          email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (doctorError) {
      console.error("[onboarding/complete] doctors upsert failed:", doctorError);
      return NextResponse.json(
        { error: `Failed to save doctor profile: ${doctorError.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true, role: body.role });
}
