"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, ShieldAlert, X } from "lucide-react";

type VerificationItem = {
  id: number;
  userId: number;
  userEmail: string;
  sessionId: number | null;
  reason: string;
  payload: {
    allowedPoints?: number;
    pointsRequested?: number;
    milestonesCrossed?: number[];
  };
  status: string;
  createdAt: string;
  bookTitle: string | null;
  bookId: number | null;
  sessionPagesLogged: number | null;
  sessionActiveSeconds: number | null;
  velocityScore: number | null;
  flagReason: string | null;
};

async function fetchQueue(): Promise<VerificationItem[]> {
  const res = await fetch("/api/admin/verification");
  if (!res.ok) throw new Error("Failed to load verification queue");
  return res.json();
}

function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function reasonLabel(reason: string) {
  switch (reason) {
    case "velocity_or_trust":
      return "Velocity / trust";
    case "cap_overflow":
      return "Daily/weekly cap";
    default:
      return reason;
  }
}

export default function AdminVerificationPage() {
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-verification"],
    queryFn: fetchQueue,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "approve" | "reject" }) => {
      const res = await fetch(`/api/admin/verification/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Review failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verification"] });
      queryClient.invalidateQueries({ queryKey: ["admin-verification-count"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <ShieldAlert size={22} className="text-gold" />
          Verification queue
        </h1>
        <p className="mt-1 text-sm text-muted">
          Review flagged reading sessions and approve or reject held point awards.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted">Loading queue…</p>}

      {!isLoading && (items?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <Check size={28} className="mx-auto text-emerald-600" />
          <p className="mt-3 text-foreground/80">No pending reviews</p>
        </div>
      )}

      <div className="space-y-3">
        {items?.map((item) => {
          const allowed = item.payload.allowedPoints ?? 0;
          const requested = item.payload.pointsRequested ?? allowed;
          const pagesPerMin =
            item.sessionPagesLogged != null &&
            item.sessionActiveSeconds != null &&
            item.sessionActiveSeconds > 0
              ? (
                  item.sessionPagesLogged /
                  (item.sessionActiveSeconds / 60)
                ).toFixed(1)
              : null;

          return (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-surface/40 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{item.userEmail}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {item.bookTitle ?? "Unknown book"} · {reasonLabel(item.reason)}
                  </p>
                </div>
                <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-medium text-gold-bright">
                  {allowed} pts held
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                  <dt className="text-[11px] uppercase text-muted">Requested</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{requested} pts</dd>
                </div>
                <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                  <dt className="text-[11px] uppercase text-muted">Pages logged</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {item.sessionPagesLogged ?? "—"}
                  </dd>
                </div>
                <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                  <dt className="text-[11px] uppercase text-muted">Active time</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {formatDuration(item.sessionActiveSeconds)}
                  </dd>
                </div>
                <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                  <dt className="text-[11px] uppercase text-muted">Velocity</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {pagesPerMin ? `${pagesPerMin} pg/min` : "—"}
                    {item.flagReason ? ` · ${item.flagReason}` : ""}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Clock size={12} />
                  {new Date(item.createdAt).toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => reviewMutation.mutate({ id: item.id, action: "reject" })}
                    disabled={reviewMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-900/50 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-50"
                  >
                    <X size={14} />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewMutation.mutate({ id: item.id, action: "approve" })}
                    disabled={reviewMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-800 px-3 py-1.5 text-sm font-medium text-emerald-50 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Check size={14} />
                    Approve {allowed} pts
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
