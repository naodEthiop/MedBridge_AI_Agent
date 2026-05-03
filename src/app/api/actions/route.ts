import { NextResponse } from "next/server";

type ActionBody = {
  action?: string;
  payload?: Record<string, unknown>;
};

const ACTION_MESSAGES: Record<string, string> = {
  health_card_download_pdf: "PDF export prepared for your digital health card.",
  health_card_share_access: "A secure provider access link is ready to share.",
  health_card_refresh_qr: "QR code refreshed. New expiration timer started.",
  onboarding_complete: "Onboarding details saved. Your profile is ready for dashboard review.",
  doctor_request_telehealth: "Telehealth call requested.",
  doctor_export_lab_requisition: "Lab requisition export is ready.",
  doctor_order_lab: "Lab order created and queued for review.",
  doctor_add_prescription: "Prescription draft created.",
  dermatology_book_specialist: "Specialist booking request prepared for dermatology review.",
  dermatology_save_report: "Dermatology report saved to the current health record.",
  doctor_settings_saved: "Settings saved successfully.",
  doctor_patients_refreshed: "Patient list refresh triggered.",
  doctor_add_patient: "Patient has been queued for registration.",
  patient_appointments_refresh: "Appointment list refreshed from the server.",
  patient_appointment_request: "Appointment request sent to your care team.",
  patient_settings_saved: "Patient preferences saved.",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ActionBody;
    const action = body.action?.trim();

    if (!action) {
      return NextResponse.json({ error: "Missing required field: action" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      action,
      message: ACTION_MESSAGES[action] ?? `${action} queued successfully.`,
      acceptedAt: new Date().toISOString(),
      payload: body.payload ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
