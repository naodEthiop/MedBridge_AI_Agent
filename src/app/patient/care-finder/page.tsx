import { AppShell } from "@/components/layout/AppShell";
import { NearbyMedicalMap } from "@/components/patient/NearbyMedicalMap";
import { CareFinderClient } from "@/components/views/CareFinderClient";

export default function CareFinderPage() {
  return (
    <AppShell title="Emergency & Care Finder" subtitle="Stitch screen: Patient: Emergency & Care Finder">
      <div className="space-y-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-sahara-tertiary/30 bg-[#d47070] p-10 text-[#3a2020] shadow-xl">
          <h2 className="font-serif text-5xl font-bold leading-tight">Request Emergency Help</h2>
          <p className="mt-4 max-w-xl text-lg opacity-90">
            Our AI dispatcher is prioritizing your location. Medical assistance is one tap away.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <button className="rounded-full bg-[#c0392b] px-10 py-5 text-lg font-bold text-white shadow-lg">
              Call Services Now
            </button>
            <p className="text-sm font-semibold">Estimated arrival: 8-12 mins</p>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-3xl">Care Directory</h3>
              <div className="rounded-full border border-sahara-border bg-sahara-surface p-1">
                <button className="rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-sahara-primary shadow-sm">
                  List
                </button>
                <button className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-sahara-muted">Map</button>
              </div>
            </div>

            <div className="rounded-2xl border border-sahara-border/60 bg-white p-5">
              <CareFinderClient />
            </div>

            <div className="rounded-2xl border border-sahara-border/40 bg-white p-6">
              <NearbyMedicalMap />
            </div>
          </div>

          <div className="relative min-h-[680px] overflow-hidden rounded-[2rem] border border-sahara-border/40 bg-sahara-surface-low lg:col-span-7" />
        </section>
      </div>
    </AppShell>
  );
}

