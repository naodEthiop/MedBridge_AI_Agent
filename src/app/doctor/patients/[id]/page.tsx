import { AppShell } from "@/components/layout/AppShell";
import { PatientDetail } from "@/components/views/PatientDetail";

export default async function DoctorPatientDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <AppShell title="Doctor: Patient Detail View" subtitle="Full patient record and clinical history">
      <PatientDetail id={id} />
    </AppShell>
  );
}

