"use client";

import { Download, RefreshCw, Share2, ShieldAlert } from "lucide-react";

import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { usePatient } from "@/hooks/usePatient";

export default function HealthCardPage() {
  const summary = useDashboardSummary();
  const patientId = summary.currentPatient?.id ?? "pat_1";
  const patientQuery = usePatient(patientId);
  const patient = patientQuery.data?.patient;

  const displayName = patient?.fullName ?? "Julian Vane";
  const displayId = patient?.id ?? "MB-8829-QX";
  const sex = patient?.sex ? patient.sex[0].toUpperCase() + patient.sex.slice(1) : "Male";
  const conditions = patient?.conditions?.length ? patient.conditions : ["Type 1 Diabetes", "Mild Asthma"];

  return (
    <div className="min-h-screen bg-sahara-bg text-sahara-fg lg:pl-64">
      <section className="mx-auto w-full max-w-6xl p-8 lg:p-12">
        <div className="mb-10 text-center lg:text-left">
          <h2 className="mb-3 font-serif text-4xl font-bold leading-tight lg:text-5xl">Your Digital Health Card</h2>
          <p className="max-w-xl text-sahara-muted">
            A secure, portable summary of your medical identity. Present this code to any MedBridge certified provider for instant record sync.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="relative mx-auto aspect-[1.58/1] w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white p-1 shadow-2xl lg:mx-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f6f0e8] via-white to-[#fbe8d8] opacity-40" />
              <div className="absolute -right-24 -top-24 size-64 rounded-full bg-sahara-primary/5 blur-3xl" />

              <div className="relative flex h-full w-full flex-col rounded-[1.8rem] border border-sahara-border p-8">
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-2xl font-bold tracking-tight text-sahara-primary">MedBridge</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sahara-primary">
                      Universal Health Identity
                    </p>
                  </div>
                  <div className="rounded-full bg-sahara-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-sahara-primary">
                    Active Status
                  </div>
                </div>

                <div className="flex flex-1 gap-8">
                  <div className="shrink-0">
                    <div className="h-40 w-32 overflow-hidden rounded-xl border border-sahara-border bg-[#ece6dc] shadow-sm">
                      <img
                        alt="Cardholder"
                        className="h-full w-full object-cover grayscale-[0.2] contrast-125"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5-IKqTXvUTbe4S2F95imEmgfxEKep5sVj0exoHX0tu3uvM0XZsJ6AnWeP1E8dd0A4I-aRzgZAkIVfVz6Cha01EidMSbZcp5a7wVcXFUOnWcWyK3DGBbmOKOv8Z8pmlc3IqGLj2YKlf-gS30GxUztJte0IIGjz6cZj3W_PWpbIusz68_DowhfIeTpi1aqwbb4F6lZ3UA6ZuzEYXNU2TPtTEdksRTB3FhMwqjCu2_5ZjcfZzv3WfFxjnQyYIen1VM_MlvsQjI9KRZs"
                      />
                    </div>
                  </div>

                  <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-6">
                    <div>
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Full Name</p>
                      <p className="font-serif text-lg font-bold">{displayName}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Patient ID</p>
                      <p className="font-serif text-lg font-bold">{displayId}</p>
                    </div>
                    <div className="col-span-2 grid grid-cols-3 gap-4">
                      <div>
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Age</p>
                        <p className="text-base font-bold">34</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Sex</p>
                        <p className="text-base font-bold">{sex}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Blood Type</p>
                        <p className="text-base font-bold text-sahara-tertiary">O Negative</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">Known Conditions</p>
                      <div className="flex flex-wrap gap-2">
                        {conditions.map((condition) => (
                          <span
                            key={condition}
                            className="rounded-full border border-sahara-border bg-[#ece6dc] px-2 py-0.5 text-xs font-medium text-sahara-muted"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex items-end justify-between pt-6">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Height</p>
                      <p className="text-sm font-semibold">182 cm</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Weight</p>
                      <p className="text-sm font-semibold">78 kg</p>
                    </div>
                  </div>
                  <div className="max-w-[120px] text-right text-[8px] font-medium leading-tight text-stone-400">
                    Issued by MedBridge AI Systems. Secure blockchain verified identity.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
              <button className="flex items-center gap-2 rounded-lg bg-sahara-primary px-6 py-3 font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95">
                <Download className="size-5" />
                Download as PDF
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-sahara-border bg-white px-6 py-3 font-bold text-sahara-fg transition-all hover:bg-sahara-surface-low active:scale-95">
                <Share2 className="size-5" />
                Share Access
              </button>
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <div className="flex flex-col items-center rounded-3xl border border-sahara-border bg-sahara-surface-low p-8 text-center shadow-sm">
              <h4 className="mb-6 font-serif text-xl font-bold">Quick Scan Provider Access</h4>
              <div className="relative mb-6 rounded-2xl border border-sahara-border bg-white p-4 shadow-inner">
                <img
                  alt="QR Code"
                  className="h-40 w-40 object-cover opacity-80"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkRdR45MhttQaVjMsmhfEnZig-eRqtG5zILYbsTopJXIbZooUypKPkCb9WHUf07sUJ3kqrCj8nC09dDdPcMnbmCYlR8Kw-qASBZGOOeKrwlLPkD2QtE2wFXTDhDxvRPp2g-dmfFfug5Ob39OuMI8wn98DO7mvCKiFMYGjm_2Gk-8oyL-gonotAsKD7-rTtriP0Fz2BzZ6t4f92GOfDX_UCiRrXnMIdSuTn3JXkXjBNB3WBQ31Hi1zR_4qkG8br7anBnQoCYy97N_Y"
                />
              </div>
              <p className="px-4 text-sm font-medium text-sahara-muted">
                This code expires in <span className="font-bold text-sahara-primary">14:59</span>
              </p>
              <button className="mt-6 flex items-center gap-2 text-sm font-bold text-sahara-primary hover:underline">
                <RefreshCw className="size-4" />
                Refresh Code
              </button>
            </div>

            <div className="flex items-start gap-4 rounded-3xl border border-red-300/30 bg-red-100/30 p-6">
              <div className="shrink-0 rounded-xl bg-red-200 p-2 text-red-700">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-red-900">Emergency Protocols</h5>
                <p className="mt-1 text-xs text-red-900/70">
                  If this device is locked, responders can access your blood type and allergies by triple-tapping the
                  power button.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

