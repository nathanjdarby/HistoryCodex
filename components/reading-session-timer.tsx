"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Pause, Play, Square } from "lucide-react";

const HEARTBEAT_INTERVAL_SEC = 30;

type ReadingSession = {
  id: number;
  bookId: number;
  status: "active" | "paused" | "completed" | "abandoned" | "flagged";
  startPage: number;
  activeSeconds: number;
  clientToken: string;
};

type FinalizeResult = {
  book: { currentPage: number; status: string };
  awardedMilestones: string[];
  awardedPoints: number;
  pendingPoints: number;
  velocity: {
    velocityScore: number;
    flagged: boolean;
    flagReason: string | null;
  };
};

const STORAGE_KEY = (bookId: number) => `reading-session:${bookId}`;

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function fetchActiveSession(bookId: number): Promise<ReadingSession | null> {
  const res = await fetch(`/api/books/${bookId}/sessions`);
  if (!res.ok) throw new Error("Failed to load session");
  const data = await res.json();
  return data.session ?? null;
}

export function ReadingSessionTimer({
  bookId,
  currentPage,
  totalPages,
  onFinalized,
}: {
  bookId: number;
  currentPage: number;
  totalPages: number;
  onFinalized?: (result: FinalizeResult) => void;
}) {
  const queryClient = useQueryClient();
  const [endPageInput, setEndPageInput] = useState(String(currentPage));
  const [localSeconds, setLocalSeconds] = useState(0);
  const [tabVisible, setTabVisible] = useState(true);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: session, refetch } = useQuery({
    queryKey: ["reading-session", bookId],
    queryFn: () => fetchActiveSession(bookId),
  });

  useEffect(() => {
    setEndPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const persistSession = useCallback(
    (s: ReadingSession) => {
      sessionStorage.setItem(
        STORAGE_KEY(bookId),
        JSON.stringify({ sessionId: s.id, clientToken: s.clientToken }),
      );
    },
    [bookId],
  );

  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/books/${bookId}/sessions`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to start session");
      }
      return res.json() as Promise<{ session: ReadingSession }>;
    },
    onSuccess: ({ session: s }) => {
      persistSession(s);
      queryClient.setQueryData(["reading-session", bookId], s);
      setLocalSeconds(s.activeSeconds);
    },
  });

  const heartbeatMutation = useMutation({
    mutationFn: async (s: ReadingSession) => {
      const res = await fetch(`/api/books/${bookId}/sessions/${s.id}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientToken: s.clientToken, tabVisible }),
      });
      if (!res.ok) return s;
      const data = await res.json();
      return data.session as ReadingSession;
    },
    onSuccess: (updated) => {
      if (updated) {
        queryClient.setQueryData(["reading-session", bookId], updated);
        setLocalSeconds(updated.activeSeconds);
      }
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (s: ReadingSession) => {
      const res = await fetch(`/api/books/${bookId}/sessions/${s.id}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientToken: s.clientToken }),
      });
      if (!res.ok) throw new Error("Failed to pause");
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const resumeMutation = useMutation({
    mutationFn: async (s: ReadingSession) => {
      const res = await fetch(`/api/books/${bookId}/sessions/${s.id}/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientToken: s.clientToken }),
      });
      if (!res.ok) throw new Error("Failed to resume");
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const finalizeMutation = useMutation({
    mutationFn: async ({ s, endPage }: { s: ReadingSession; endPage: number }) => {
      const res = await fetch(`/api/books/${bookId}/sessions/${s.id}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientToken: s.clientToken, endPage }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to finalize session");
      }
      return res.json() as Promise<FinalizeResult>;
    },
    onSuccess: (result) => {
      sessionStorage.removeItem(STORAGE_KEY(bookId));
      queryClient.setQueryData(["reading-session", bookId], null);
      queryClient.invalidateQueries({ queryKey: ["books", String(bookId)] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      onFinalized?.(result);
    },
  });

  useEffect(() => {
    if (!session || session.status !== "active") {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      return;
    }

    setLocalSeconds(session.activeSeconds);

    heartbeatRef.current = setInterval(() => {
      heartbeatMutation.mutate(session);
      setLocalSeconds((n) => n + HEARTBEAT_INTERVAL_SEC);
    }, HEARTBEAT_INTERVAL_SEC * 1000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [session, heartbeatMutation]);

  const isActive = session?.status === "active";
  const isPaused = session?.status === "paused";

  return (
    <div className="mt-5 space-y-4 border-t border-border pt-5">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-gold" />
        <h3 className="text-sm font-medium text-foreground">Reading session</h3>
      </div>
      <p className="text-xs text-muted">
        Start a timed session while you read. Points are awarded when you finalize with your page
        number — fast or bulk entries may be flagged for review.
      </p>

      {!session && (
        <button
          type="button"
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-50"
        >
          <Play size={14} />
          {startMutation.isPending ? "Starting…" : "Start reading session"}
        </button>
      )}

      {session && (
        <div className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Engaged time</p>
              <p className="text-2xl font-semibold tabular-nums text-gold-bright">
                {formatDuration(localSeconds)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Started at page</p>
              <p className="text-lg font-medium text-foreground">{session.startPage}</p>
            </div>
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                isActive
                  ? "bg-emerald-900/50 text-emerald-200"
                  : isPaused
                    ? "bg-accent/15 text-gold-bright"
                    : "bg-surface-raised text-muted"
              }`}
            >
              {session.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {isActive && (
              <button
                type="button"
                onClick={() => pauseMutation.mutate(session)}
                disabled={pauseMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-3 py-1.5 text-sm text-foreground/80 hover:bg-surface-raised"
              >
                <Pause size={14} />
                Pause
              </button>
            )}
            {isPaused && (
              <button
                type="button"
                onClick={() => resumeMutation.mutate(session)}
                disabled={resumeMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-3 py-1.5 text-sm text-foreground/80 hover:bg-surface-raised"
              >
                <Play size={14} />
                Resume
              </button>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const endPage = Number(endPageInput);
              finalizeMutation.mutate({ s: session, endPage });
            }}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Page reached
              <input
                type="number"
                min={session.startPage}
                max={totalPages}
                value={endPageInput}
                onChange={(e) => setEndPageInput(e.target.value)}
                className="max-w-xs rounded border border-border-strong bg-background px-3 py-2"
              />
            </label>
            <button
              type="submit"
              disabled={finalizeMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-50"
            >
              <Square size={14} />
              {finalizeMutation.isPending ? "Saving…" : "End session & save progress"}
            </button>
          </form>

          {finalizeMutation.isError && (
            <p className="text-sm text-red-400">{(finalizeMutation.error as Error).message}</p>
          )}
        </div>
      )}

      {startMutation.isError && (
        <p className="text-sm text-red-400">{(startMutation.error as Error).message}</p>
      )}
    </div>
  );
}
