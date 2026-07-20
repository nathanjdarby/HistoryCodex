"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Gift, Sparkles, Package, Coins, Layers } from "lucide-react";
import { BoosterPacksEraSections } from "@/components/booster-packs-era-sections";
import { groupBoosterPacksByEraAz } from "@/lib/client/booster-packs-by-era";
import { fetchEras } from "@/lib/client/eras";
import { getPackPrices } from "@/lib/pack-pricing";
import { CARD_TYPE_LABELS_PLURAL, type CardType } from "@/lib/card-types";
import { PageHeader, PointsPill } from "@/components/page-header";

type Eligibility = {
  poolSize: number;
  remaining: number;
};

type PackConfig = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  cardsPerPack: number;
  price: number;
  eraId: number | null;
  eraName: string | null;
  cardType: CardType | null;
  active: boolean;
};

async function fetchStats(): Promise<{ pointsBalance: number }> {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

async function fetchActivePacks(): Promise<PackConfig[]> {
  const res = await fetch("/api/packs");
  if (!res.ok) throw new Error("Failed to load packs");
  return res.json();
}

async function fetchEligibility(packConfigId: number): Promise<Eligibility> {
  const res = await fetch(`/api/packs?packConfigId=${packConfigId}`);
  if (!res.ok) throw new Error("Failed to load pack info");
  return res.json();
}

const CARD_TYPE_LABEL = CARD_TYPE_LABELS_PLURAL;

function packScope(config: Pick<PackConfig, "eraName" | "cardType">) {
  const era = config.eraName ?? "Any era";
  if (!config.cardType) return era;
  return `${era} · ${CARD_TYPE_LABEL[config.cardType]}`;
}

function PackArtwork({
  config,
  className = "",
  sizes = "200px",
}: {
  config: Pick<PackConfig, "name" | "imageUrl">;
  className?: string;
  sizes?: string;
}) {
  if (config.imageUrl) {
    return (
      <div className={`relative aspect-[4/7] overflow-hidden rounded-xl border-2 border-accent/45 bg-background shadow-lg ${className}`}>
        <Image src={config.imageUrl} alt={config.name} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`relative flex aspect-[4/7] items-center justify-center overflow-hidden rounded-xl border-2 border-accent/45 bg-gradient-to-br from-accent/30 via-surface to-neutral-950 shadow-lg ${className}`}
    >
      <Gift size={40} className="text-gold" />
    </div>
  );
}

function PackShopTile({
  config,
  inStock,
}: {
  config: PackConfig;
  inStock: boolean;
}) {
  const prices = getPackPrices(config);

  return (
    <Link
      href={`/packs/${config.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface/50 text-left transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_12px_40px_-20px_color-mix(in_srgb,var(--accent)_45%,transparent)]"
    >
      <div className="relative p-3 pb-0">
        <PackArtwork config={config} className="w-full" sizes="(max-width: 768px) 45vw, 220px" />
        {!inStock && (
          <span className="absolute right-5 top-5 rounded bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted ring-1 ring-neutral-700">
            Out of stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 pt-2">
        <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-foreground">
          {config.name}
        </p>
        <p className="text-xs text-muted">{packScope(config)}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs">
          <span className="flex flex-col gap-0.5 font-medium text-gold-bright">
            {prices.eraPrice != null ? (
              <>
                <span className="flex items-center gap-1">
                  <Coins size={12} />
                  {prices.eraPrice} era pts
                </span>
                <span className="text-[10px] font-normal text-muted">
                  or {prices.generalPrice} general
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1">
                <Coins size={12} />
                {prices.generalPrice} pts
              </span>
            )}
          </span>
          <span className="text-muted">
            {config.cardsPerPack} card{config.cardsPerPack === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function PacksPage() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchStats });
  const { data: eras } = useQuery({ queryKey: ["eras"], queryFn: fetchEras });
  const { data: packConfigs, isLoading } = useQuery({
    queryKey: ["active-packs"],
    queryFn: fetchActivePacks,
  });

  const activeConfigs = packConfigs ?? [];

  const packGroups = useMemo(
    () =>
      groupBoosterPacksByEraAz(activeConfigs, (config) => {
        if (config.eraName) return config.eraName;
        if (config.eraId == null) return "Any era";
        return eras?.find((era) => era.id === config.eraId)?.name ?? "Unknown era";
      }),
    [activeConfigs, eras],
  );

  const eligibilityQueries = useQueries({
    queries: activeConfigs.map((config) => ({
      queryKey: ["pack-eligibility", config.id],
      queryFn: () => fetchEligibility(config.id),
    })),
  });

  const eligibilityByPackId = useMemo(() => {
    const map = new Map<number, Eligibility>();
    activeConfigs.forEach((config, index) => {
      const data = eligibilityQueries[index]?.data;
      if (data) map.set(config.id, data);
    });
    return map;
  }, [activeConfigs, eligibilityQueries]);

  function packInStock(config: PackConfig) {
    const eligibility = eligibilityByPackId.get(config.id);
    if (!eligibility) return true;
    return (eligibility.poolSize ?? eligibility.remaining) > 0;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Shop"
        title="Booster pack shop"
        description="Browse packs by era, explore what's inside, and open them with your reading points."
        icon={Package}
        actions={
          <PointsPill>
            <Sparkles size={14} />
            {stats?.pointsBalance ?? 0} pts
          </PointsPill>
        }
      />

      {isLoading && <p className="text-sm text-muted">Loading the shop…</p>}

      {!isLoading && activeConfigs.length === 0 && (
        <div className="app-empty">
          <Gift size={32} className="mx-auto text-subtle" />
          <p className="mt-3 text-foreground/80">No booster packs are on sale right now.</p>
          <p className="mt-1 text-sm">Check back later for new drops.</p>
        </div>
      )}

      {!isLoading && activeConfigs.length > 0 && (
        <BoosterPacksEraSections
          groups={packGroups}
          getPackKey={(config) => config.id}
          renderPack={(config) => (
            <PackShopTile config={config} inStock={packInStock(config)} />
          )}
        />
      )}

      {!isLoading && activeConfigs.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <Layers size={12} />
          {activeConfigs.length} pack{activeConfigs.length === 1 ? "" : "s"} available · duplicate pulls
          allowed
        </p>
      )}
    </div>
  );
}
