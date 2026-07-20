"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useState, Suspense } from "react";

import { defaultPathForRole } from "@/lib/auth/routes";
import { ThemeToggle } from "@/lib/client/theme";
import { LogIn } from "lucide-react";

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
    <div className="relative mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-8">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <div className="app-panel p-6 shadow-xl">
        <div className="flex items-start gap-2.5">
          <span className="app-page-icon shrink-0">
            <LogIn size={20} />
          </span>
          <div>
            <h1 className="app-page-title">Sign in</h1>
            <p className="app-page-description">Use your HistoryCodex account to continue.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              defaultValue="user@example.com"
              className="app-input"
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
              className="app-input"
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={loading} className="app-btn-primary w-full">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2.5 text-xs text-muted">
          <p className="font-medium text-foreground/80">Default accounts</p>
          <p className="mt-1">Admin: admin@example.com / password</p>
          <p>User: user@example.com / password</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading...</p>}>
      <LoginForm />
    </Suspense>
  );
}
