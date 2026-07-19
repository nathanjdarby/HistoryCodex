"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useState, Suspense } from "react";

import { defaultPathForRole } from "@/lib/auth/routes";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Login failed");
        return;
      }

      const account = (await res.json()) as { role: "user" | "admin" };
      const fallback = defaultPathForRole(account.role);
      const destination =
        next && (account.role === "admin" ? next.startsWith("/admin") : !next.startsWith("/admin"))
          ? next
          : fallback;

      // Full page navigation is more reliable on mobile Safari after Set-Cookie.
      window.location.assign(destination);
    } catch {
      setError("Could not reach the server. Check you're on the same Wi‑Fi and the dev server is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 shadow-xl">
        <h1 className="text-2xl font-semibold text-amber-100">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Use your HistoryCodex account to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              defaultValue="user@example.com"
              className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              defaultValue="password"
              className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2"
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-amber-600 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950/70 px-3 py-2.5 text-xs text-neutral-500">
          <p className="font-medium text-neutral-400">Default accounts</p>
          <p className="mt-1">Admin: admin@example.com / password</p>
          <p>User: user@example.com / password</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-neutral-500">Loading...</p>}>
      <LoginForm />
    </Suspense>
  );
}
