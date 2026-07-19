"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Layers } from "lucide-react";
import type { Era } from "@/lib/types";
import { formatYearRange } from "@/lib/format";

type TimelinesProfile = {
  available: Era[];
  selected: Era[];
  selectedEraIds: number[];
};

async function fetchTimelinesProfile(): Promise<TimelinesProfile> {
  const res = await fetch("/api/profile/timelines");
  if (!res.ok) throw new Error("Failed to load timelines");
  return res.json();
}

export default function ProfileTimelinesPage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-timelines"],
    queryFn: fetchTimelinesProfile,
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setSelectedIds(profile.selectedEraIds);
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (eraIds: number[]) => {
      const res = await fetch("/api/profile/timelines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eraIds }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save timelines");
      }
      return res.json() as Promise<TimelinesProfile>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["profile-timelines"], data);
      queryClient.invalidateQueries({ queryKey: ["eras"] });
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      setSelectedIds(data.selectedEraIds);
      setSavedMessage("Your timelines were updated.");
      setError(null);
      setTimeout(() => setSavedMessage(null), 3000);
    },
    onError: (err: Error) => setError(err.message),
  });

  const sortedAvailable = useMemo(
    () => [...(profile?.available ?? [])].sort((a, b) => a.startYear - b.startYear),
    [profile?.available],
  );

  function toggleEra(eraId: number) {
    setSelectedIds((current) =>
      current.includes(eraId) ? current.filter((id) => id !== eraId) : [...current, eraId],
    );
  }

  const hasChanges =
    profile &&
    (selectedIds.length !== profile.selectedEraIds.length ||
      selectedIds.some((id) => !profile.selectedEraIds.includes(id)));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-amber-100">
          <Layers size={22} />
          My timelines
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Choose which historical periods appear on your timeline, in book pickers, and across your
          codex. You can enable as many or as few as you like.
        </p>
      </div>

      {savedMessage && (
        <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-4 py-2 text-sm text-emerald-200">
          {savedMessage}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
        <p className="text-sm text-neutral-300">
          <span className="font-medium text-amber-200">{selectedIds.length}</span> of{" "}
          {profile?.available.length ?? 0} timelines selected
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedIds(profile?.available.map((era) => era.id) ?? [])}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate(selectedIds)}
            disabled={!hasChanges || saveMutation.isPending}
            className="rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-amber-50 hover:bg-amber-600 disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving…" : "Save selection"}
          </button>
        </div>
      </div>

      {isLoading && <p className="text-neutral-500">Loading available timelines…</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sortedAvailable.map((era) => {
          const active = selectedIds.includes(era.id);
          return (
            <button
              key={era.id}
              type="button"
              onClick={() => toggleEra(era.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                active
                  ? "border-amber-700/60 bg-amber-950/20"
                  : "border-neutral-800 bg-neutral-900/30 hover:border-neutral-700"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-neutral-100">{era.name}</p>
                  {era.region && <p className="text-xs text-neutral-500">{era.region}</p>}
                  <p className="mt-1 text-sm text-neutral-400">
                    {formatYearRange(era.startYear, era.endYear)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className="h-5 w-5 rounded border border-white/10"
                    style={{ background: era.colorPrimary }}
                  />
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                      active
                        ? "border-amber-600 bg-amber-700 text-amber-50"
                        : "border-neutral-700 bg-neutral-900 text-transparent"
                    }`}
                  >
                    <Check size={14} />
                  </span>
                </div>
              </div>
              {era.description && (
                <p className="mt-3 line-clamp-2 text-xs text-neutral-500">{era.description}</p>
              )}
            </button>
          );
        })}
      </div>

      {!isLoading && sortedAvailable.length === 0 && (
        <p className="text-sm text-neutral-500">
          No timelines are available yet. An admin needs to create eras first.
        </p>
      )}

      <p className="text-sm text-neutral-500">
        Ready to explore?{" "}
        <Link href="/timeline" className="text-amber-400 hover:underline">
          Open your timeline
        </Link>
        .
      </p>
    </div>
  );
}
