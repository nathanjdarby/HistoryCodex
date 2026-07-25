"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, PointsPill } from "@/components/page-header";
import { Sparkles, Users2 } from "lucide-react";
import { CharacterCardModal } from "@/components/character-card-modal";
import {
  CARD_PREVIEW_WIDTH_REM,
  LayoutCharacterCard,
  layoutCharacterCardFromCharacter,
} from "@/components/layout-character-card";
import { RegionEraFilters, useRegionEraFilterState } from "@/components/region-era-filters";
import { normalizeEraRegion } from "@/lib/client/era-regions";
import { fetchEras } from "@/lib/client/eras";
import type { Character, Era } from "@/lib/types";
import { useCardModalNavigation } from "@/lib/client/use-card-modal-navigation";

const COLLECTION_CARD_WIDTH_REM = CARD_PREVIEW_WIDTH_REM;

type CharacterWithEra = Character & {
  era: Era;
  owned: boolean;
  quantity: number;
  unlockedAt: string | null;
};
type Stats = { pointsBalance: number };

async function fetchCharacters(): Promise<CharacterWithEra[]> {
  const res = await fetch("/api/characters");
  if (!res.ok) throw new Error("Failed to load characters");
  return res.json();
}

async function fetchStats(): Promise<Stats> {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

export default function CollectionPage() {
  const { data: eras } = useQuery({ queryKey: ["eras"], queryFn: fetchEras });
  const { data: characters, isLoading } = useQuery({
    queryKey: ["characters"],
    queryFn: fetchCharacters,
  });
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchStats });

  const { region: regionFilter, setRegion: setRegionFilter, eraValue: eraFilter, setEraValue: setEraFilter } =
    useRegionEraFilterState();
  const [ownedFilter, setOwnedFilter] = useState<"all" | "owned" | "locked">("all");
  const [cardTypeFilter, setCardTypeFilter] = useState<
    "all" | "character" | "location" | "unit" | "event"
  >("all");
  const [viewingId, setViewingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const subscribedEraIds = new Set(eras?.map((era) => era.id) ?? []);
    return (characters ?? [])
      .filter((c) => {
        if (!subscribedEraIds.has(c.eraId) && !c.owned) return false;
        if (regionFilter && normalizeEraRegion(c.era.region) !== regionFilter) return false;
        if (eraFilter && String(c.eraId) !== eraFilter) return false;
        if (ownedFilter === "owned" && !c.owned) return false;
        if (ownedFilter === "locked" && c.owned) return false;
        if (cardTypeFilter !== "all" && c.cardType !== cardTypeFilter) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [characters, regionFilter, eraFilter, ownedFilter, cardTypeFilter, eras]);

  const { viewing, onPrevious, onNext, positionLabel } = useCardModalNavigation(
    filtered,
    viewingId,
    setViewingId,
  );

  const ownedCount = characters?.filter((c) => c.owned).length ?? 0;
  const totalCopies = characters?.reduce((sum, c) => sum + (c.quantity ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cards"
        title="Collection"
        description={
          <>
            Cards you&apos;ve pulled from booster packs and earned through reading.
            {characters ? (
              <>
                {" "}
                {ownedCount} / {characters.length} unlocked
                {totalCopies > ownedCount && <> · {totalCopies} copies total</>}
              </>
            ) : null}
          </>
        }
        icon={Users2}
        actions={
          <PointsPill>
            <Sparkles size={14} />
            {stats?.pointsBalance ?? 0} pts available
          </PointsPill>
        }
      />

      <div className="flex flex-wrap gap-2">
        <RegionEraFilters
          eras={eras}
          region={regionFilter}
          onRegionChange={setRegionFilter}
          eraValue={eraFilter}
          onEraChange={setEraFilter}
        />
        <div className="flex rounded-md border border-border-strong bg-surface p-0.5 text-sm">
          {(["all", "owned", "locked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setOwnedFilter(f)}
              className={`rounded px-2 py-1 capitalize ${
                ownedFilter === f
                  ? "bg-surface-raised font-medium text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex rounded-md border border-border-strong bg-surface p-0.5 text-sm">
          {(["all", "character", "unit", "location", "event"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setCardTypeFilter(f)}
              className={`rounded px-2 py-1 capitalize ${
                cardTypeFilter === f
                  ? "bg-surface-raised font-medium text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {f === "all" ? "all types" : f === "event" ? "events" : `${f}s`}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-muted">Loading collection...</p>}

      <div className="grid grid-cols-2 place-items-center gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((character) => (
          <button
            key={character.id}
            type="button"
            onClick={() => setViewingId(character.id)}
            className="group cursor-pointer border-0 bg-transparent p-0 text-left transition-transform hover:-translate-y-1"
            aria-label={`View ${character.name}`}
          >
            <LayoutCharacterCard
              {...layoutCharacterCardFromCharacter(character, {
                displayWidthRem: COLLECTION_CARD_WIDTH_REM,
                innerClassName: "pointer-events-none transition-[filter] duration-200 group-hover:brightness-110",
                locked: !character.owned,
                ownership: {
                  showStatus: true,
                  owned: character.owned,
                  quantity: character.quantity,
                },
              })}
            />
          </button>
        ))}
      </div>

      {filtered.length === 0 && !isLoading && (
        <p className="text-sm text-muted">No characters match these filters.</p>
      )}

      {viewing && (
        <CharacterCardModal
          character={viewing}
          onClose={() => setViewingId(null)}
          locked={!viewing.owned}
          showOwnershipStatus
          onPrevious={onPrevious}
          onNext={onNext}
          positionLabel={positionLabel}
          footer={
            !viewing.owned ? (
              <p className="text-center text-sm leading-relaxed text-muted">
                Open{" "}
                <Link href="/packs" className="font-medium text-gold hover:underline">
                  booster packs
                </Link>{" "}
                to collect this card.
              </p>
            ) : null
          }
        />
      )}
    </div>
  );
}
