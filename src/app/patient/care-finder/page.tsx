"use client";

import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { CareFinderClient } from "@/components/views/CareFinderClient";

export default function CareFinderPage() {
  const [view, setView] = useState<"list" | "map">("list");
  const [emergencyActive, setEmergencyActive] = useState(false);

  return (
    <AppShell title="Emergency & Care Finder" subtitle="Stitch screen: Patient: Emergency & Care Finder">
      <div className="space-y-10">
        <section className="rounded-[2rem] border border-sahara-tertiary/30 bg-[#d47070] p-10 text-[#3a2020] shadow-xl">
          <h2 className="font-serif text-5xl font-bold leading-tight">Request Emergency Help</h2>
          <p className="mt-4 max-w-xl text-lg opacity-90">
            Our AI dispatcher is prioritizing your location. Medical assistance is one tap away.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <button type="button" onClick={() => setEmergencyActive(true)} className="rounded-full bg-[#c0392b] px-10 py-5 text-lg font-bold text-white shadow-lg">
              Call Services Now
            </button>
            <p className="text-sm font-semibold">
              {emergencyActive ? "Dispatch request prepared with your current care context." : "Estimated arrival: 8-12 mins"}
            </p>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-3xl">Care Directory</h3>
              <div className="rounded-full border border-sahara-border bg-sahara-surface p-1">
                <button type="button" onClick={() => setView("list")} className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${view === "list" ? "bg-white text-sahara-primary shadow-sm" : "text-sahara-muted"}`}>List</button>
                <button type="button" onClick={() => setView("map")} className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${view === "map" ? "bg-white text-sahara-primary shadow-sm" : "text-sahara-muted"}`}>Map</button>
              </div>
            </div>

            <div className="rounded-2xl border border-sahara-border/60 bg-white p-5">
              <CareFinderClient />
            </div>

            {view === "list" ? (
              <div className="space-y-4">
                {[
                  { name: "St. Mary's General Hospital", distance: "1.2 miles away", state: "Open 24/7" },
                  { name: "Sahara Urgent Care Center", distance: "2.4 miles away", state: "Wait: 15m" },
                ].map((facility) => (
                  <button type="button" key={facility.name} className="w-full rounded-2xl border border-sahara-border/40 bg-white p-6 text-left hover:border-sahara-primary/50">
                    <div className="mb-2 flex items-start justify-between">
                      <h4 className="font-serif text-xl">{facility.name}</h4>
                      <span className="rounded bg-green-100 px-2 py-1 text-xs font-bold uppercase text-green-700">{facility.state}</span>
                    </div>
                    <p className="text-sm text-sahara-muted">{facility.distance}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-sahara-border/40 bg-white p-6 text-sm text-sahara-muted">
                Map view is active. Select a facility in the nearby-care list to focus its location.
              </div>
            )}
          </div>

          <div className="relative min-h-[680px] overflow-hidden rounded-[2rem] border border-sahara-border/40 bg-sahara-surface-low lg:col-span-7">
            <img alt="Map" className="h-full w-full object-cover opacity-55 mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGxy1q3GH5LtnliO4_Inpr0p2k_MmsYMpENLpyyF1Dax_pPniW5G2KJ9E4iXU4123JIi6Mx2R9QS0C6xLEHyCNVBqKa2i6dCup3wwQSU8RHEM1m9kdVukdl-ear6DPJQqYU1892hkssDEjkZoLwOz0jne2p2ew7dE2E1S6-g1wTdBCCTg2p2cadzSTWIODbd4JblGKZw3M-yJCaaXraYExDHNzFA2zEUGyRTWEzSpP9Yn7ye2FnlHsyUgJkv-r4gPtDTPRd74MTg4" />
            <div className="absolute bottom-8 left-8 right-8 rounded-3xl border border-white/20 bg-white/90 p-6 shadow-2xl backdrop-blur-md">
              <h5 className="font-serif text-xl">St. Mary&apos;s General Hospital</h5>
              <p className="text-sm text-sahara-muted">1200 Health Pkwy, Phoenix, AZ</p>
              <p className="mt-2 text-sm font-bold text-sahara-primary">{view === "map" ? "Map interface active" : "Travel time: 6 mins"}</p>
            </div>
          </div>
        </section>

        {emergencyActive ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
              <h3 className="font-serif text-3xl">Emergency Request Ready</h3>
              <p className="mt-3 text-sm text-sahara-muted">Your location and health summary are ready to share with emergency services.</p>
              <div className="mt-6 grid gap-3">
                <button type="button" onClick={() => setEmergencyActive(false)} className="rounded-xl bg-[#c0392b] px-4 py-3 text-sm font-bold text-white">Confirm Dispatch</button>
                <button type="button" onClick={() => setEmergencyActive(false)} className="rounded-xl border border-sahara-border px-4 py-3 text-sm font-bold">Cancel Request</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
