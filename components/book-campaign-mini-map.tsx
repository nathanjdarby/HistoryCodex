"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Map } from "lucide-react";
import { CampaignMap } from "@/components/campaign-map";
import type { CampaignTheme } from "@/lib/campaign-theme";

type CampaignDetail = {
  slug: string;
  title: string;
  theme: CampaignTheme;
  era: {
    name: string;
    colorPrimary: string;
    colorSecondary: string;
  };
  progress: {
    nodesUnlocked: string[];
  };
};

async function fetchCampaign(slug: string): Promise<CampaignDetail> {
  const res = await fetch(`/api/campaigns/${slug}`);
  if (!res.ok) throw new Error("Failed to load campaign");
  return res.json();
}

export function BookCampaignMiniMap({ eraSlug, eraName }: { eraSlug: string; eraName: string }) {
  const { data: campaign, isLoading, isError } = useQuery({
    queryKey: ["campaign", eraSlug],
    queryFn: () => fetchCampaign(eraSlug),
  });

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border bg-surface/40 p-5 sm:p-6">
        <p className="text-sm text-muted">Loading campaign map…</p>
      </section>
    );
  }

  if (isError || !campaign) return null;

  const unlocked = campaign.progress.nodesUnlocked.length;
  const total = campaign.theme.nodes.length;

  return (
    <section className="rounded-xl border border-border bg-surface/40 p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Map size={16} className="text-gold" />
          <h2 className="text-lg font-medium text-foreground">{eraName} campaign</h2>
        </div>
        <Link
          href={`/campaigns/${eraSlug}`}
          className="text-xs text-gold hover:underline"
        >
          View full map
        </Link>
      </div>
      <p className="mb-3 text-xs text-muted">
        {unlocked} / {total} milestones unlocked — hit reading milestones on this book to advance.
      </p>
      <CampaignMap
        theme={campaign.theme}
        nodesUnlocked={campaign.progress.nodesUnlocked}
        colorPrimary={campaign.era.colorPrimary}
        colorSecondary={campaign.era.colorSecondary}
        className="aspect-[2/1] max-h-44"
      />
    </section>
  );
}
