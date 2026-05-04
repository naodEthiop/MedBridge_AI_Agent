import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/db/supabaseServer";
import { requireSessionPrincipal } from "@/lib/server/sessionPrincipal";

const createReminderSchema = z.object({
  medicineName: z.string().min(1, "Medicine name required"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format"),
  frequency: z.enum(["daily", "twice_daily", "thrice_daily", "custom"]),
});

const updateReminderSchema = createReminderSchema.partial().extend({
  enabled: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const principal = await requireSessionPrincipal(request);
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("medication_reminders")
      .select("*")
      .eq("user_id", principal.userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Unable to fetch reminders. Please try again." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      reminders: data || [],
    });
  } catch (error) {
    console.error("[medications/reminders GET]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch reminders." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const principal = await requireSessionPrincipal(request);
    const supabase = await getSupabaseServerClient();

    const json = await request.json();
    const parsed = createReminderSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid reminder data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("medication_reminders")
      .insert([
        {
          user_id: principal.userId,
          medicine_name: parsed.data.medicineName,
          time: parsed.data.time,
          frequency: parsed.data.frequency,
          enabled: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("[medications/reminders POST]", error);
      return NextResponse.json(
        { ok: false, error: "Unable to create reminder. Please try again." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      reminder: data?.[0],
    });
  } catch (error) {
    console.error("[medications/reminders POST]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create reminder." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const principal = await requireSessionPrincipal(request);
    const supabase = await getSupabaseServerClient();

    const json = await request.json();
    const { id, ...updates } = z
      .object({ id: z.string() })
      .and(updateReminderSchema)
      .parse(json);

    const parsed = updateReminderSchema.safeParse(updates);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid reminder data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updatePayload: Record<string, unknown> = {};
    if (parsed.data.medicineName) updatePayload.medicine_name = parsed.data.medicineName;
    if (parsed.data.time) updatePayload.time = parsed.data.time;
    if (parsed.data.frequency) updatePayload.frequency = parsed.data.frequency;
    if (parsed.data.enabled !== undefined) updatePayload.enabled = parsed.data.enabled;

    const { data, error } = await supabase
      .from("medication_reminders")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", principal.userId)
      .select();

    if (error || !data?.length) {
      return NextResponse.json(
        { ok: false, error: "Unable to update reminder. Please try again." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      reminder: data[0],
    });
  } catch (error) {
    console.error("[medications/reminders PUT]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update reminder." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const principal = await requireSessionPrincipal(request);
    const supabase = await getSupabaseServerClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Reminder ID required" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("medication_reminders")
      .delete()
      .eq("id", id)
      .eq("user_id", principal.userId);

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Unable to delete reminder. Please try again." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Reminder deleted successfully",
    });
  } catch (error) {
    console.error("[medications/reminders DELETE]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete reminder." },
      { status: 500 },
    );
  }
}
