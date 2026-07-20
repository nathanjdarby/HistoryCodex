"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Play, Plus, Swords } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Deck = {
  id: number;
  name: string;
  isDefault: boolean;
  totalCards: number;
  valid: boolean;
  validationErrors: string[];
};

type MatchSummary = {
  id: number;
  status: string;
  turnNumber: number;
  updatedAt: string;
};

async function fetchDecks(): Promise<Deck[]> {
  const res = await fetch("/api/decks");
  if (!res.ok) throw new Error("Failed to load decks");
  return res.json();
}

async function fetchMatches(): Promise<MatchSummary[]> {
  const res = await fetch("/api/matches");
  if (!res.ok) throw new Error("Failed to load matches");
  return res.json();
}

export default function PlayPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: decks } = useQuery({ queryKey: ["decks"], queryFn: fetchDecks });
  const { data: matches } = useQuery({ queryKey: ["matches"], queryFn: fetchMatches });
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const defaultDeck = decks?.find((d) => d.isDefault) ?? decks?.find((d) => d.valid) ?? decks?.[0];
  const deckId = selectedDeckId ?? defaultDeck?.id ?? null;
  const hasValidDeck = (decks ?? []).some((d) => d.valid);

  const startMutation = useMutation({
    mutationFn: async () => {
      if (!deckId) throw new Error("Build a valid deck first.");
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to start match");
      }
      return res.json();
    },
    onSuccess: (match) => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      router.push(`/play/matches/${match.id}`);
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Chronos"
        title="Play Chronos"
        description="Battle the AI on a single historical lane. Capture locations to win the timeline."
        icon={Swords}
        actions={
          <Link href="/play/decks" className="app-btn-secondary">
            <Plus size={14} />
            Manage decks
          </Link>
        }
      />

      {error ? (
        <div className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="app-panel p-4">
          <h2 className="text-lg font-medium text-foreground">Start a match</h2>
          <p className="mt-1 text-sm text-muted">Practice solo vs the AI using your Chronos deck.</p>

          <label className="mt-4 block space-y-1">
            <span className="text-sm text-foreground/80">Deck</span>
            <select
              className="w-full rounded-md border border-border-strong bg-background px-3 py-2 text-sm"
              value={deckId ?? ""}
              onChange={(e) => setSelectedDeckId(Number(e.target.value))}
            >
              {(decks ?? []).length === 0 ? (
                <option value="">No decks yet</option>
              ) : null}
              {(decks ?? []).map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name} ({deck.totalCards}/40{deck.valid ? "" : " — invalid"})
                </option>
              ))}
            </select>
          </label>

          {!hasValidDeck ? (
            <p className="mt-3 text-sm text-gold-bright/80">
              New to Chronos?{" "}
              <Link href="/play/decks" className="underline hover:text-foreground">
                Add a free starter deck
              </Link>{" "}
              to get cards and a ready-to-play list.
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!deckId || !hasValidDeck || startMutation.isPending}
              onClick={() => startMutation.mutate()}
              className="app-btn-primary inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <Play size={14} />
              {startMutation.isPending ? "Starting…" : "Start vs AI"}
            </button>
            <Link href="/play/decks" className="app-btn-secondary inline-flex items-center gap-1.5 sm:hidden">
              <Plus size={14} />
              Decks
            </Link>
          </div>
        </section>

        <section className="app-panel p-4">
          <h2 className="text-lg font-medium text-foreground">Recent matches</h2>
          <ul className="mt-3 space-y-2">
            {(matches ?? []).length === 0 ? (
              <li className="text-sm text-muted">No matches yet.</li>
            ) : (
              (matches ?? []).map((match) => (
                <li key={match.id}>
                  <Link
                    href={`/play/matches/${match.id}`}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-surface"
                  >
                    <span>Match #{match.id}</span>
                    <span className="text-muted">
                      {match.status} · turn {match.turnNumber}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <p className="text-xs text-subtle">
        Full rules are documented in <code className="text-muted">docs/history_codex_rules.md</code> in the
        project repository.
      </p>
    </div>
  );
}
