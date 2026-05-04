"use client";

import { AppShell } from "@/components/layout/AppShell";
import { DoctorAssistant } from "@/components/views/DoctorAssistant";

export default function ChatPage() {
  return (
    <AppShell title="Clinical chat" subtitle="Optimistic send · server broadcast confirm">
      <DoctorAssistant threadId="clinical-chat" />
    </AppShell>
  );
}
