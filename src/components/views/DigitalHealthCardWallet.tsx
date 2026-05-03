"use client";

import { cn } from "@/lib/cn";

export type DigitalHealthCardWalletProps = {
  displayName: string;
  email: string;
  patientId: string;
  trustScore: number;
  status: "verified" | "pending";
  issuedLabel: string;
  bloodType: string;
  ageLabel: string;
  conditionsSummary: string;
  className?: string;
};

function walletCode(rawId: string): string {
  const alnum = rawId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (alnum.length >= 6) return alnum.slice(0, 6);
  const seed = (alnum + "MEDBRIDG").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return (seed + "XXXXXX").slice(0, 6);
}

export function DigitalHealthCardWallet(props: DigitalHealthCardWalletProps) {
  const trust = Math.max(0, Math.min(100, props.trustScore));
  const digitalId = `MB - P - ${walletCode(props.patientId)}`;
  const verified = props.status === "verified";

  return (
    <div
      className={cn(
        "relative w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/15 bg-gradient-to-br from-sahara-primary via-[#9a4f28] to-[#4a2c18] text-white shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45)]",
        "aspect-[1.6/1] font-[family-name:var(--font-manrope)]",
        props.className,
      )}
    >
      <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-[#fce8d4]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 size-56 rounded-full bg-[#f4c4a0]/12 blur-3xl" />

      <div className="relative flex h-full flex-col justify-between p-8 md:p-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className="mb-3 flex h-10 w-12 flex-col justify-around rounded-lg border border-amber-200/50 bg-gradient-to-br from-amber-300/90 to-amber-500/90 p-1.5 shadow-sm"
              aria-hidden
            >
              <div className="h-px w-full bg-black/15" />
              <div className="h-px w-full bg-black/15" />
              <div className="h-px w-full bg-black/15" />
            </div>
            <span className="inline-block rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
              Patient
            </span>
          </div>
          <div className="text-right">
            <h2 className="font-[family-name:var(--font-eb-garamond)] text-xl font-semibold leading-none tracking-tight md:text-2xl">
              MedBridge
            </h2>
            <p className="mt-1 text-[10px] opacity-75">AI Healthcare Platform</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 py-4">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">{props.displayName}</h1>
          <p className="mt-1 text-sm opacity-85 md:text-base">{props.email}</p>
          <div className="my-5 h-px bg-white/20" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-60">Digital ID</p>
          <p className="mt-1 font-mono text-xl font-bold tracking-[0.12em] md:text-2xl">{digitalId}</p>
          <p className="mt-3 max-w-lg text-[11px] leading-relaxed opacity-80 md:text-xs">
            {props.bloodType} · {props.ageLabel} · {props.conditionsSummary}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="h-2 max-w-[12rem] overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-white/50 to-[#fce8d4]"
                style={{ width: `${trust}%` }}
              />
            </div>
            <p className="mt-2 text-xs opacity-85">Profile completeness · {trust}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="mb-1 flex items-center justify-end gap-1">
              <span className={cn("size-1 rounded-full", verified ? "bg-emerald-300" : "animate-pulse bg-amber-400")} />
              <span className={cn("size-1 rounded-full", verified ? "bg-emerald-300" : "animate-pulse bg-amber-400")} />
              <span className={cn("size-1 rounded-full", verified ? "bg-emerald-300" : "animate-pulse bg-amber-400")} />
              <span
                className={cn(
                  "ml-1 text-[10px] font-bold uppercase tracking-wide",
                  verified ? "text-emerald-200" : "text-amber-300",
                )}
              >
                {verified ? "Verified" : "Pending"}
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wider opacity-60">Issued: {props.issuedLabel}</p>
          </div>
        </div>

        <p className="absolute bottom-3 left-0 w-full px-6 text-center text-[9px] font-light tracking-wide opacity-40">
          MedBridge AI Healthcare Platform · Portable record · medbridge.app
        </p>
      </div>
    </div>
  );
}
