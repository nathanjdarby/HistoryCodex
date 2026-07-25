"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Check, Layers } from "lucide-react";
import type { Era } from "@/lib/types";
import { formatYearRange } from "@/lib/format";
import {
  filterErasByRegion,
  formatEraRegionLabel,
  getEraRegions,
} from "@/lib/client/era-regions";
import { REGION_ERA_FILTER_SELECT_CLASS } from "@/components/region-era-filters";

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

  const [regionFilter, setRegionFilter] = useState("");

  const sortedAvailable = useMemo(
    () => [...(profile?.available ?? [])].sort((a, b) => a.startYear - b.startYear),
    [profile?.available],
  );

  const regions = useMemo(() => getEraRegions(sortedAvailable), [sortedAvailable]);

  const visibleEras = useMemo(
    () => filterErasByRegion(sortedAvailable, regionFilter),
    [sortedAvailable, regionFilter],
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
      <Link href="/profile" className="app-link inline-block text-sm">
        ← Back to profile
      </Link>
      <PageHeader
        eyebrow="Profile"
        title="My timelines"
        description="Choose which historical periods appear on your timeline, in book pickers, and across your codex. You can enable as many or as few as you like."
        icon={Layers}
      />

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

      <div className="app-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm text-foreground/80">
          <span className="font-medium text-gold-bright">{selectedIds.length}</span> of{" "}
          {profile?.available.length ?? 0} timelines selected
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedIds(profile?.available.map((era) => era.id) ?? [])}
            className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-foreground/80 hover:bg-surface-raised"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-foreground/80 hover:bg-surface-raised"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate(selectedIds)}
            disabled={!hasChanges || saveMutation.isPending}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving…" : "Save selection"}
          </button>
        </div>
      </div>

      {isLoading && <p className="text-muted">Loading available timelines…</p>}

      {!isLoading && regions.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className={REGION_ERA_FILTER_SELECT_CLASS}
            aria-label="Filter timelines by region"
          >
            <option value="">All regions</option>
            {regions.map((region) => (
              <option key={region || "__unset__"} value={region}>
                {formatEraRegionLabel(region)}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted">
            Showing {visibleEras.length} timeline{visibleEras.length === 1 ? "" : "s"}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visibleEras.map((era) => {
          const active = selectedIds.includes(era.id);
          return (
            <button
              key={era.id}
              type="button"
              onClick={() => toggleEra(era.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                active
                  ? "border-accent/50 bg-accent/10"
                  : "border-border bg-surface/30 hover:border-border-strong"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{era.name}</p>
                  {era.region && <p className="text-xs text-muted">{era.region}</p>}
                  <p className="mt-1 text-sm text-muted">
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
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border-strong bg-surface text-transparent"
                    }`}
                  >
                    <Check size={14} />
                  </span>
                </div>
              </div>
              {era.description && (
                <p className="mt-3 line-clamp-2 text-xs text-muted">{era.description}</p>
              )}
            </button>
          );
        })}
      </div>

      {!isLoading && sortedAvailable.length === 0 && (
        <p className="text-sm text-muted">
          No timelines are available yet. An admin needs to create eras first.
        </p>
      )}

      <p className="text-sm text-muted">
        Ready to explore?{" "}
        <Link href="/timeline" className="text-gold hover:underline">
          Open your timeline
        </Link>
        .
      </p>
    </div>
  );
}
