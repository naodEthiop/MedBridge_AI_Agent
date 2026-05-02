import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-semibold">Access Denied</h1>
      <p className="mt-3 text-center text-sm text-sahara-muted">
        You do not have permission to access this page with your current role.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-sahara-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        Go Home
      </Link>
    </main>
  );
}
