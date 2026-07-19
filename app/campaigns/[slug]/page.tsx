"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
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
    description: string | null;
  };
  progress: {
    nodesUnlocked: string[];
    currentNode: string | null;
  };
};

async function fetchCampaign(slug: string): Promise<CampaignDetail> {
  const res = await fetch(`/api/campaigns/${slug}`);
  if (!res.ok) throw new Error("Failed to load campaign");
  return res.json();
}

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign", slug],
    queryFn: () => fetchCampaign(slug),
  });

  if (isLoading || !campaign) {
    return <p className="text-neutral-500">Loading campaign…</p>;
  }

  const unlockedCount = campaign.progress.nodesUnlocked.length;
  const totalNodes = campaign.theme.nodes.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200"
      >
        <ArrowLeft size={15} />
        All campaigns
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-amber-100">{campaign.title}</h1>
        {campaign.era.description && (
          <p className="max-w-2xl text-sm text-neutral-400">{campaign.era.description}</p>
        )}
        <p className="text-sm text-neutral-500">
          {unlockedCount} / {totalNodes} milestones unlocked on your campaign map
        </p>
      </header>

      <CampaignMap
        theme={campaign.theme}
        nodesUnlocked={campaign.progress.nodesUnlocked}
        colorPrimary={campaign.era.colorPrimary}
        colorSecondary={campaign.era.colorSecondary}
        className="aspect-[16/10] min-h-[280px]"
      />

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
        <h2 className="text-sm font-medium text-neutral-200">How to progress</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-neutral-400">
          {campaign.theme.nodes.map((node) => {
            const done = campaign.progress.nodesUnlocked.includes(node.id);
            return (
              <li key={node.id} className={done ? "text-amber-200/90" : undefined}>
                {done ? "✓" : "○"} {node.milestone}% — {node.label}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
