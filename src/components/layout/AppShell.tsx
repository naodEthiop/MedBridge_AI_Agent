"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  Bell,
  CircleUserRound,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  LocateFixed,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/cn";

const navItems = [
  { href: "/patient", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patient/symptom-checker", label: "Symptoms", icon: HeartPulse },
  { href: "/patient/scanners", label: "Scanners", icon: FlaskConical },
  { href: "/patient/care-finder", label: "Emergency", icon: LocateFixed },
  { href: "/patient/health-card", label: "Health Card", icon: ShieldCheck },
  { href: "/doctor/dashboard", label: "Clinical Dashboard", icon: Activity },
  { href: "/doctor/patients", label: "Patient List", icon: Users },
  { href: "/doctor/assistant", label: "Assistant", icon: Search },
  { href: "/doctor/settings", label: "Settings", icon: Settings },
  { href: "/provider/verification", label: "Provider Verify", icon: ShieldCheck },
];

export function AppShell(props: { title: string; subtitle?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const handleSupport = () => router.push("/doctor/settings");
  const handleHelp = () => router.push("/doctor/assistant");
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.push("/login");
  };

  return (
    <div className="flex min-h-[calc(100vh-0px)] w-full flex-col lg:flex-row">
      <aside className="hidden h-screen w-[288px] flex-col border-r border-sahara-border/60 bg-sahara-bg py-8 lg:sticky lg:top-0 lg:flex">
        <Link href="/" className="px-8">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-sahara-primary text-white">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="font-serif text-xl leading-none text-sahara-primary">MedBridge AI</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sahara-muted">
                Healthcare Portal
              </p>
            </div>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-4">
          {navItems.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm tracking-wide transition-colors",
                  pathname === item.href
                    ? "border-r-4 border-sahara-primary bg-sahara-surface-low font-semibold text-sahara-primary"
                    : "text-sahara-muted hover:bg-sahara-surface hover:text-sahara-primary",
                )}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                <item.icon className="size-[18px]" />
                <span>{item.label}</span>
              </Link>
            </div>
          ))}
        </nav>
        <div className="mt-auto px-6">
          <button
            type="button"
            onClick={handleSupport}
            className="w-full rounded-xl bg-sahara-primary py-3 text-sm font-semibold text-white hover:bg-sahara-primary-2"
          >
            Get Support
          </button>
          <div className="mt-5 border-t border-sahara-border/60 pt-4">
            <button
              type="button"
              onClick={handleHelp}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-sahara-muted hover:text-sahara-primary"
            >
              <CircleUserRound className="size-4" />
              Help
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-sahara-muted hover:text-sahara-tertiary"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-sahara-border/60 bg-sahara-bg/95 shadow-ambient backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 lg:px-6">
            <div className="hidden w-full max-w-md items-center gap-2 rounded-lg border border-sahara-border/70 bg-white px-3 py-2 sm:flex">
              <Search className="size-4 text-sahara-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && search.trim()) router.push(`/doctor/patients?search=${encodeURIComponent(search.trim())}`);
                }}
                placeholder="Search medical records..."
                className="w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-sahara-muted"
              />
              {search ? (
                <button type="button" onClick={() => router.push(`/doctor/patients?search=${encodeURIComponent(search.trim())}`)} className="text-xs font-bold text-sahara-primary">
                  Search
                </button>
              ) : null}
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-sahara-muted">{props.subtitle}</p>
              <h1 className="mt-1 font-serif text-xl tracking-tight sm:text-2xl">{props.title}</h1>
            </div>
            <div className="flex items-center gap-3 text-sahara-muted">
              <button type="button" onClick={() => setNotice("No unread notifications right now.")} aria-label="Notifications">
                <Bell className="size-5" />
              </button>
              <button type="button" onClick={() => router.push("/doctor/settings")} aria-label="Settings">
                <Settings className="size-5" />
              </button>
              <div className="hidden items-center gap-2 border-l border-sahara-border/60 pl-3 sm:flex">
                <div className="size-9 rounded-full bg-sahara-surface-low ring-1 ring-sahara-border/60" />
                <span className="text-xs font-medium">Dr. Aris</span>
              </div>
              <Link
                href="/"
                className="rounded-full bg-sahara-surface-low px-3 py-2 text-xs font-semibold ring-1 ring-sahara-border/60 hover:bg-sahara-surface"
              >
                Home
              </Link>
            </div>
          </div>
          <nav className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-6 pb-4 lg:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors",
                  pathname === item.href
                    ? "bg-sahara-primary text-white ring-sahara-primary"
                    : "bg-sahara-card text-sahara-fg ring-sahara-border/60 hover:bg-sahara-surface",
                )}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                <item.icon className="mr-2 inline size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{props.children}</main>
        {notice ? (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-sahara-border bg-white px-5 py-3 text-sm text-sahara-muted shadow-ambient">
            <button type="button" onClick={() => setNotice(null)} className="font-semibold text-sahara-primary">
              {notice}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

