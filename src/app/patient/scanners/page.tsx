import { AppShell } from "@/components/layout/AppShell";
import { ScannerClient } from "@/components/views/ScannerClient";

export default function ScannersPage() {
  return (
    <AppShell title="AI Scanners" subtitle="Stitch screen: Patient: AI Scanners">
      <div className="space-y-8">
        <header>
          <h2 className="font-serif text-5xl leading-tight">Unified AI Analysis</h2>
          <p className="mt-4 max-w-2xl text-lg text-sahara-muted">
            Harness computer vision for immediate drug verification and dermatological triage powered by MedBridge AI.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl border border-sahara-border/40 bg-sahara-surface-low p-8 shadow-ambient">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="font-serif text-3xl">Medication Scanner</h3>
              <span className="rounded-full bg-sahara-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sahara-primary">
                Active
              </span>
            </div>

            <div className="relative mb-8 aspect-video overflow-hidden rounded-2xl border-2 border-dashed border-sahara-border bg-[#e6e0d6]">
              <img
                alt="Medicine bottle"
                className="h-full w-full object-cover opacity-60 mix-blend-multiply"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1g_SyQv7Wsn0WKvBMbyWQpY7DgO-xTuUV916wcD5tsNelYZdjJYOhZoPcgbKXRLbquCEd0jkecj9MBTtOX0QsX4Vs660ALQj5ZzZcBTN9BgOk2AlEWazK_CBCgjhjE5eX1IZ6r4aRMphqUm_2YUlZWqFcv5WMH304p5n-lEuP_I2uFxcrUiYkVJ9IL7GJ13-9gMWtky7c0wXuDdTdyiXNoaFEHmXqSRcjf06PyUi3YBjiT0jnQxxtZ96PLKsuejk2E48HdXpCIPA"
              />
            </div>

            <ScannerClient />
          </section>

          <section className="rounded-3xl border border-sahara-border/40 bg-sahara-surface-low p-8 shadow-ambient">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="font-serif text-3xl">Dermatology AI</h3>
              <span className="rounded-full bg-sahara-tertiary/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sahara-tertiary">
                Visual Analysis
              </span>
            </div>

            <div className="mb-8 aspect-square overflow-hidden rounded-2xl border border-sahara-border bg-white p-2">
              <img
                alt="Skin concern"
                className="h-full w-full rounded-xl object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiN3gY9ME11z_aCcPrMvfUcRG4APfelk7rwt8MwzZ0bE_ReV1hNbjujPijPpmjRBPrMnwIKRA_c58LvTJps-agupFi87XJwBXQSolcOtRL4PLkNRjd9JePQIURlSuMbQzmyD5ie_iIiIuBn8_psxX1ELiM22m4WBEWXQFX7nnrBq3Q4NyQFySV0oss-iATG8BT7n-aocThAZezkli4xTiMoLmliqXui-zxcCJleGF3OgLWj_dZweUCkQCqS868RX0enxmyWljWtJo"
              />
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-sahara-tertiary/20 bg-[#fce0e0] p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#6e3030]">Primary Category</p>
                <p className="mt-1 font-serif text-2xl text-[#3a2020]">Contact Dermatitis</p>
              </div>
              <p className="rounded-xl border-l-4 border-sahara-tertiary bg-white p-4 text-sm text-sahara-muted">
                Clinical insight: localized inflammatory response. Recommend specialist consultation and irritant
                avoidance.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button className="rounded-xl border border-sahara-primary px-4 py-3 text-sm font-bold text-sahara-primary">
                  Book Specialist
                </button>
                <button className="rounded-xl bg-sahara-fg px-4 py-3 text-sm font-bold text-white">Save Report</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

