"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetchJson } from "@/lib/api/client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProfilePayload = {
  id: string;
  email: string | null;
  role: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const result = await apiFetchJson<{ ok?: boolean; profile?: ProfilePayload }>("/api/user/profile", {
          cache: "no-store",
          bearerToken: token,
        });
        if (!result.success) {
          if (result.status === 401) {
            router.replace("/login?next=/profile");
            return;
          }
          throw new Error(result.error);
        }
        const p = result.data.profile;
        if (!p) {
          throw new Error("Unable to load profile");
        }
        setProfile(p);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <Link href="/login" className="text-sm text-sahara-primary hover:underline">
          Back to login
        </Link>
      </div>
      {loading && <p className="text-sm text-sahara-muted">Loading profile...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {profile && (
        <div className="space-y-3 rounded-xl border border-sahara-border bg-white p-5">
          <p>
            <span className="font-medium">User ID:</span> {profile.id}
          </p>
          <p>
            <span className="font-medium">Email:</span> {profile.email ?? "Not available"}
          </p>
          <p>
            <span className="font-medium">Role:</span> {profile.role}
          </p>
        </div>
      )}
    </main>
  );
}
