"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Bell,
  CalendarDays,
  CircleUserRound,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  LocateFixed,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { useSessionRole } from "@/hooks/useSessionRole";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const patientNav: NavItem[] = [
  { href: "/patient", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patient/symptom-checker", label: "Symptoms", icon: HeartPulse },
  { href: "/patient/scanners", label: "Scanners", icon: FlaskConical },
  { href: "/patient/care-finder", label: "Emergency", icon: LocateFixed },
  { href: "/patient/health-card", label: "Health Card", icon: ShieldCheck },
  { href: "/patient/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/patient/settings", label: "Settings", icon: Settings },
];

const doctorNav: NavItem[] = [
  { href: "/doctor", label: "Clinical Dashboard", icon: Activity },
  { href: "/doctor/patients", label: "Patient List", icon: Users },
  { href: "/doctor/assistant", label: "Assistant", icon: Search },
  { href: "/doctor/settings", label: "Settings", icon: Settings },
  { href: "/provider/verification", label: "Provider verify", icon: Stethoscope },
];

function navActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/patient" || href === "/doctor") {
    return pathname === href;
  }
  return pathname.startsWith(`${href}/`);
}

export function AppShell(props: { title: string; subtitle?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSessionRole();
  const [search, setSearch] = useState("");
  const { user: currentUser } = useCurrentUser();
  const [notice, setNotice] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session.loading && !session.role && !pathname.includes("/login") && !pathname.includes("/register")) {
      router.push("/login");
    }
  }, [session.loading, session.role, pathname, router]);

  useEffect(() => {
    if (!notifOpen) return;
    function onPointerDown(e: MouseEvent) {
      const el = notifRef.current;
      if (el && !el.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [notifOpen]);

  const navItems = useMemo(() => {
    if (session.loading) return null;
    return session.role === "doctor" ? doctorNav : patientNav;
  }, [session.loading, session.role]);

  const homeHref = session.role === "doctor" ? "/doctor" : "/patient";
  const settingsHref = session.role === "doctor" ? "/doctor/settings" : "/patient/settings";
  const helpHref = session.role === "doctor" ? "/doctor/assistant" : "/patient/symptom-checker";
  const isOnboarding = pathname.includes("onboarding");

  const showBack =
    (pathname.startsWith("/patient") && pathname !== "/patient") ||
    (pathname.startsWith("/doctor") && pathname !== "/doctor") ||
    pathname.startsWith("/provider") ||
    pathname.startsWith("/onboarding");

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(homeHref);
  };

  const handleSupport = () => router.push(helpHref);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      /* ignore */
    }
    router.push("/login");
  };

  const runSearch = () => {
    const q = search.trim();
    if (!q || session.loading || !session.role) return;
    if (session.role === "doctor") {
      router.push(`/doctor/patients?search=${encodeURIComponent(q)}`);
      return;
    }
    router.push(`/patient/symptom-checker?q=${encodeURIComponent(q)}`);
  };

  const displayName = currentUser?.fullName || "User";

  return (
    <div className="flex min-h-[calc(100vh-0px)] w-full flex-col lg:flex-row">
      {!isOnboarding && session.role && (
      <aside className="hidden h-screen w-[288px] flex-col border-r border-sahara-border/60 bg-sahara-bg py-8 lg:sticky lg:top-0 lg:flex">
        {session.loading ? (
          <div className="mb-10 px-8">
            <div className="h-14 animate-pulse rounded-xl bg-sahara-border/40" aria-hidden />
            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-sahara-muted">Loading portal…</p>
          </div>
        ) : (
          <Link href={homeHref} className="px-8">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-sahara-primary text-white">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="font-serif text-xl leading-none text-sahara-primary">MedBridge AI</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sahara-muted">
                  {session.role === "doctor" ? "Clinical portal" : "Patient portal"}
                </p>
              </div>
            </div>
          </Link>
        )}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4" aria-busy={session.loading}>
          {session.loading || !navItems
            ? [0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="mx-1 h-11 animate-pulse rounded-xl bg-sahara-border/35" aria-hidden />
              ))
            : navItems.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm tracking-wide transition-colors",
                      navActive(pathname, item.href)
                        ? "border-r-4 border-sahara-primary bg-sahara-surface-low font-semibold text-sahara-primary"
                        : "text-sahara-muted hover:bg-sahara-surface hover:text-sahara-primary",
                    )}
                    aria-current={navActive(pathname, item.href) ? "page" : undefined}
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
              onClick={() => router.push(helpHref)}
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
      )}

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-sahara-border/60 bg-sahara-bg/95 shadow-ambient backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 lg:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {showBack ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-sahara-border/70 bg-white px-2 py-2 text-sm text-sahara-muted hover:text-sahara-primary"
                  aria-label="Go back"
                >
                  <ArrowLeft className="size-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
              ) : null}
              <div className="hidden w-full max-w-md items-center gap-2 rounded-lg border border-sahara-border/70 bg-white px-3 py-2 sm:flex">
                <Search className="size-4 shrink-0 text-sahara-muted" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") runSearch();
                  }}
                  placeholder={session.role === "doctor" ? "Search patients…" : "Search symptoms or topics…"}
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-sahara-muted"
                />
                {search.trim() ? (
                  <button type="button" onClick={runSearch} className="shrink-0 text-xs font-bold text-sahara-primary">
                    Search
                  </button>
                ) : null}
              </div>
            </div>
            <div className="min-w-0 text-right">
              <p className="text-xs font-semibold tracking-wide text-sahara-muted">{props.subtitle}</p>
              <h1 className="mt-1 truncate font-serif text-xl tracking-tight sm:text-2xl">{props.title}</h1>
            </div>
            <div ref={notifRef} className="relative flex shrink-0 items-center gap-2 text-sahara-muted sm:gap-3">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="rounded-lg p-2 hover:bg-sahara-surface-low"
                aria-expanded={notifOpen}
                aria-label="Notifications"
              >
                <Bell className="size-5" />
              </button>
              {notifOpen ? (
                <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-sahara-border bg-white p-4 text-left shadow-ambient">
                  <p className="text-xs font-bold uppercase tracking-widest text-sahara-muted">Notifications</p>
                  <ul className="mt-3 space-y-2 text-sm text-sahara-fg">
                    <li className="rounded-lg bg-sahara-surface-low/80 p-2">No urgent alerts. Care reminders will appear here.</li>
                    <li className="rounded-lg border border-sahara-border/60 p-2 text-sahara-muted">
                      Tip: complete your health card for faster check-in.
                    </li>
                  </ul>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-lg bg-sahara-primary py-2 text-xs font-semibold text-white"
                    onClick={() => {
                      setNotifOpen(false);
                      setNotice("Notifications marked as read.");
                    }}
                  >
                    Mark all read
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => router.push(settingsHref)}
                className="rounded-lg p-2 hover:bg-sahara-surface-low"
                aria-label="Settings"
              >
                <Settings className="size-5" />
              </button>
              <div className="hidden items-center gap-2 border-l border-sahara-border/60 pl-3 sm:flex">
                <div className="size-9 rounded-full bg-sahara-surface-low ring-1 ring-sahara-border/60" />
                <span className="max-w-[100px] truncate text-xs font-medium capitalize">{displayName}</span>
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
            {session.loading || !navItems ? (
              <span className="px-2 text-xs text-sahara-muted">Loading menu…</span>
            ) : (
              navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors",
                    navActive(pathname, item.href)
                      ? "bg-sahara-primary text-white ring-sahara-primary"
                      : "bg-sahara-card text-sahara-fg ring-sahara-border/60 hover:bg-sahara-surface",
                  )}
                  aria-current={navActive(pathname, item.href) ? "page" : undefined}
                >
                  <item.icon className="mr-2 inline size-4" />
                  {item.label}
                </Link>
              ))
            )}
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
