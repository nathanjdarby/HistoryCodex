"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Lock, Sparkles } from "lucide-react";
import type { Character, Era } from "@/lib/types";
import { CharacterArt } from "@/components/character-art";
import { CharacterCardModal } from "@/components/character-card-modal";
import { HolographicOverlay } from "@/components/holographic-overlay";
import {
  AbilityChip,
  AbilityDescription,
  ArchetypeBadge,
  CharacterCardCorner,
  CharacterCardHeader,
  CharacterCardPowerGauge,
  CopyCountBadge,
  FlavorText,
  EventBadge,
  LocationBadge,
  RarityPill,
  UnitBadge,
} from "@/components/character-badges";
import { RARITY_META, RARITY_ORDER, dexNumber } from "@/lib/rarity";
import { imageFrameFromCharacter } from "@/lib/image-frame";
import { fetchEras } from "@/lib/client/eras";
import { useCardModalNavigation } from "@/lib/client/use-card-modal-navigation";

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

  const [eraFilter, setEraFilter] = useState("");
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
        if (eraFilter && String(c.eraId) !== eraFilter) return false;
        if (ownedFilter === "owned" && !c.owned) return false;
        if (ownedFilter === "locked" && c.owned) return false;
        if (cardTypeFilter !== "all" && c.cardType !== cardTypeFilter) return false;
        return true;
      })
      .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
  }, [characters, eraFilter, ownedFilter, cardTypeFilter, eras]);

  const { viewing, onPrevious, onNext, positionLabel } = useCardModalNavigation(
    filtered,
    viewingId,
    setViewingId,
  );

  const ownedCount = characters?.filter((c) => c.owned).length ?? 0;
  const totalCopies = characters?.reduce((sum, c) => sum + (c.quantity ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-amber-100">Collection</h1>
          <p className="text-sm text-neutral-400">
            Cards you&apos;ve pulled from booster packs and earned through reading.{" "}
            {characters && (
              <span className="text-neutral-500">
                {ownedCount} / {characters.length} unlocked
                {totalCopies > ownedCount && (
                  <span> · {totalCopies} copies total</span>
                )}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-amber-800/50 bg-amber-950/40 px-3 py-1 text-sm font-medium text-amber-200">
          <Sparkles size={14} />
          {stats?.pointsBalance ?? 0} pts available
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={eraFilter}
          onChange={(e) => setEraFilter(e.target.value)}
          className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
        >
          <option value="">All eras</option>
          {eras?.map((era) => (
            <option key={era.id} value={era.id}>
              {era.name}
            </option>
          ))}
        </select>
        <div className="flex rounded-md border border-neutral-700 bg-neutral-900 p-0.5 text-sm">
          {(["all", "owned", "locked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setOwnedFilter(f)}
              className={`rounded px-2 py-1 capitalize ${
                ownedFilter === f ? "bg-amber-700 text-amber-50" : "text-neutral-400 hover:text-neutral-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex rounded-md border border-neutral-700 bg-neutral-900 p-0.5 text-sm">
          {(["all", "character", "unit", "location", "event"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setCardTypeFilter(f)}
              className={`rounded px-2 py-1 capitalize ${
                cardTypeFilter === f
                  ? "bg-amber-700 text-amber-50"
                  : "text-neutral-400 hover:text-neutral-100"
              }`}
            >
              {f === "all" ? "all types" : f === "event" ? "events" : `${f}s`}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-neutral-500">Loading collection...</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-[repeat(4,minmax(0,1fr))]">
        {filtered.map((character) => {
          const meta = RARITY_META[character.rarity];
          return (
            <div
              key={character.id}
              onClick={() => setViewingId(character.id)}
              className="relative flex aspect-[3/4] w-full cursor-pointer flex-col overflow-hidden rounded-xl border-2 p-2 text-left transition-transform hover:-translate-y-1 sm:aspect-[5/7] sm:p-3 sm:pb-10"
              style={{
                borderColor: character.owned ? meta.color : "#262626",
                boxShadow: character.owned ? meta.glow : "none",
                background: `linear-gradient(160deg, ${character.era.colorPrimary}22, ${character.era.colorSecondary}22), #111110`,
              }}
            >
              {character.holographic && <HolographicOverlay />}

              {character.owned && character.quantity > 1 && (
                <div className="absolute left-2 top-2 z-10 sm:left-3 sm:top-3">
                  <CopyCountBadge quantity={character.quantity} />
                </div>
              )}

              <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
              <CharacterCardCorner dexLabel={dexNumber(character.id)} className="hidden sm:flex" />
              <CharacterCardHeader
                name={character.name}
                rarity={character.rarity}
                starSize={10}
                nameClassName="text-[11px] font-semibold text-neutral-100 sm:text-xs"
              />

              <div className="relative my-1 flex min-h-0 flex-1 w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30 sm:my-1.5 sm:h-[50%] sm:max-h-48 sm:min-h-[9rem] sm:flex-none">
                <CharacterArt
                  seed={character.seed}
                  imageUrl={character.imageUrl}
                  imageFrame={imageFrameFromCharacter(character)}
                  era={character.era}
                  rarity={character.rarity}
                  archetype={character.archetype}
                  size={192}
                  className={character.owned ? "" : "opacity-40 grayscale"}
                />
                {!character.owned && (
                  <Lock
                    size={26}
                    className="absolute inset-0 m-auto text-neutral-300 drop-shadow"
                  />
                )}
              </div>

              <div className="mt-1 hidden items-center gap-1.5 sm:flex">
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-start gap-1">
                  <RarityPill label={meta.label} color={meta.color} size="compact" />
                  {character.cardType === "location" && <LocationBadge size="compact" />}
                  {character.cardType === "unit" && <UnitBadge size="compact" />}
                  {character.cardType === "event" && <EventBadge size="compact" />}
                  <ArchetypeBadge archetype={character.archetype} size="compact" />
                  <AbilityChip name={character.abilityName} size="compact" />
                </div>
                <CharacterCardPowerGauge cost={character.cost} color={meta.color} compact />
              </div>

              <div className="mt-auto hidden min-h-0 shrink space-y-1 overflow-hidden pt-1 sm:block">
                <p className="truncate text-left text-[10px] text-neutral-500">{character.era.name}</p>
                <AbilityDescription
                  cardType={character.cardType}
                  abilityName={character.abilityName}
                  abilityEffect={character.abilityEffect}
                  abilityValue={character.abilityValue}
                  abilityTrigger={character.abilityTrigger}
                  eraName={character.era.name}
                  variant="compact"
                  lines={2}
                />
                <FlavorText text={character.flavorText} lines={2} />
                {character.owned && (
                  <div className="flex items-center justify-end gap-1 px-0.5">
                    {character.quantity > 1 ? (
                      <CopyCountBadge quantity={character.quantity} />
                    ) : (
                      <span className="text-[10px] font-medium text-emerald-400">✓</span>
                    )}
                  </div>
                )}
              </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !isLoading && (
        <p className="text-sm text-neutral-500">No characters match these filters.</p>
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
              <p className="text-center text-sm leading-relaxed text-neutral-400">
                Open{" "}
                <Link href="/packs" className="font-medium text-amber-400 hover:underline">
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
