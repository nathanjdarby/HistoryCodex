"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Map, ScrollText } from "lucide-react";
import { CampaignMap } from "@/components/campaign-map";
import type { CampaignTheme } from "@/lib/campaign-theme";

type CampaignSummary = {
  id: number;
  slug: string;
  title: string;
  eraId: number;
  eraName: string;
  colorPrimary: string;
  colorSecondary: string;
  nodesUnlocked: string[];
  currentNode: string | null;
};

async function fetchCampaigns(): Promise<CampaignSummary[]> {
  const res = await fetch("/api/campaigns");
  if (!res.ok) throw new Error("Failed to load campaigns");
  return res.json();
}

export default function CampaignsPage() {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-amber-100">
          <Map size={22} className="text-amber-500" />
          Historical campaigns
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-400">
          Unlock campaign nodes by hitting reading milestones on books tagged to each era.
        </p>
      </div>

      {isLoading && <p className="text-sm text-neutral-500">Loading campaigns…</p>}

      {!isLoading && (campaigns?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-800 px-6 py-10 text-center">
          <ScrollText size={28} className="mx-auto text-neutral-600" />
          <p className="mt-3 text-neutral-300">No campaigns yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            Read books with an era tag to start unlocking paths.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns?.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/campaigns/${campaign.slug}`}
            className="group overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40 transition-colors hover:border-amber-700/50"
          >
            <div className="border-b border-neutral-800 px-4 py-3">
              <p className="font-medium text-neutral-100 group-hover:text-amber-100">{campaign.title}</p>
              <p className="text-xs text-neutral-500">
                {campaign.nodesUnlocked.length} node{campaign.nodesUnlocked.length === 1 ? "" : "s"}{" "}
                unlocked
              </p>
            </div>
            <CampaignMap
              theme={
                {
                  nodes: [
                    { id: "m25", milestone: 25, label: "Start", x: 0.15, y: 0.75 },
                    { id: "m50", milestone: 50, label: "Mid", x: 0.4, y: 0.5 },
                    { id: "m75", milestone: 75, label: "Late", x: 0.65, y: 0.35 },
                    { id: "m100", milestone: 100, label: "End", x: 0.88, y: 0.2 },
                  ],
                  edges: [
                    ["m25", "m50"],
                    ["m50", "m75"],
                    ["m75", "m100"],
                  ],
                } satisfies CampaignTheme
              }
              nodesUnlocked={campaign.nodesUnlocked}
              colorPrimary={campaign.colorPrimary}
              colorSecondary={campaign.colorSecondary}
              className="aspect-[16/9]"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
