import { AppShell } from "@/components/layout/AppShell";
import { DoctorAssistant } from "@/components/views/DoctorAssistant";

export default function DoctorAssistantPage() {
  return (
    <AppShell title="Doctor: AI Assistant" subtitle="Clinical AI assistant and documentation tool">
      <div className="space-y-6">
        <p className="text-sm text-sahara-muted">
          Use the assistant to capture clinical context and follow up with the patient record.
        </p>
        <DoctorAssistant />
      </div>
    </AppShell>
  );
}
