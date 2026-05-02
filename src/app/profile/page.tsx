"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProfilePayload = {
  id: string;
  email: string | null;
  role: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/user/profile", { cache: "no-store" });
        const payload = (await res.json()) as {
          ok: boolean;
          profile?: ProfilePayload;
          error?: string;
        };
        if (!res.ok || !payload.ok || !payload.profile) {
          throw new Error(payload.error || "Unable to load profile");
        }
        setProfile(payload.profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
