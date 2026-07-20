"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        eyebrow="Explore"
        title="Historical campaigns"
        description="Unlock campaign nodes by hitting reading milestones on books tagged to each era."
        icon={Map}
      />

      {isLoading && <p className="text-sm text-muted">Loading campaigns…</p>}

      {!isLoading && (campaigns?.length ?? 0) === 0 && (
        <div className="app-empty">
          <ScrollText size={28} className="mx-auto text-subtle" />
          <p className="mt-3 text-foreground/80">No campaigns yet</p>
          <p className="mt-1 text-sm">Read books with an era tag to start unlocking paths.</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns?.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/campaigns/${campaign.slug}`}
            className="group overflow-hidden rounded-xl border border-border bg-surface/40 transition-colors hover:border-accent/50"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="font-medium text-foreground group-hover:text-foreground">{campaign.title}</p>
              <p className="text-xs text-muted">
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
