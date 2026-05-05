"use client";
import { useRouter } from "next/navigation";

export default function RoleSelectionPage() {
  const router = useRouter();
  async function setRole(role: "patient" | "doctor") {
    const res = await fetch("/api/onboarding/role", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    const data = await res.json();
    if (!res.ok || !data.ok) return;
    router.replace("/onboarding");
  }
  return <main className="mx-auto max-w-xl py-20"><h1 className="text-2xl mb-6">Select your role</h1><div className="space-y-4"><button className="w-full rounded bg-black text-white p-3" onClick={() => setRole("patient")}>Continue as Patient</button><button className="w-full rounded border p-3" onClick={() => setRole("doctor")}>Continue as Doctor</button></div></main>;
}
