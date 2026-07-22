"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Coins,
  Gift,
  Layers,
  Package,
  Sparkles,
} from "lucide-react";
import { CharacterCardModal, type CharacterCardView } from "@/components/character-card-modal";
import {
  CARD_PREVIEW_WIDTH_REM,
  LayoutCharacterCard,
  layoutCharacterCardFromCharacter,
} from "@/components/layout-character-card";
import {
  PackOpeningOverlay,
  type PackRevealPhase,
  type PulledPackCharacter,
} from "@/components/pack-opening-overlay";
import { useCardModalNavigation } from "@/lib/client/use-card-modal-navigation";
import { CARD_TYPE_LABELS_PLURAL, type CardType } from "@/lib/card-types";
import {
  defaultPackPaymentMethod,
  getPackPrices,
  type PackPaymentMethod,
} from "@/lib/pack-pricing";
import { RARITY_META, RARITY_ORDER, type RarityTier } from "@/lib/rarity";
import type { Era } from "@/lib/types";

type Eligibility = {
  poolSize: number;
  cardsPerPack: number;
  eraPrice: number | null;
  generalPrice: number;
  eraPointsBalance: number | null;
  globalPointsBalance: number;
  defaultPaymentMethod: PackPaymentMethod;
};

type PackDetail = {
  pack: {
    id: number;
    name: string;
    description: string | null;
    imageUrl: string | null;
    cardsPerPack: number;
    price: number;
    eraId: number | null;
    eraName: string | null;
    cardType: CardType | null;
    era: Era | null;
  };
  eligibility: Eligibility;
  poolCards: CharacterCardView[];
  dropRates: Partial<Record<RarityTier, number>>;
};

type PackResult = { characters: PulledPackCharacter[] };
type PackRevealState = {
  packName: string;
  packImageUrl: string | null;
  characters: PulledPackCharacter[];
  phase: PackRevealPhase;
  revealedCount: number;
};

async function fetchPackDetail(packId: number): Promise<PackDetail> {
  const res = await fetch(`/api/packs/${packId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load pack");
  }
  return res.json();
}

const CARD_DISPLAY_WIDTH_REM = CARD_PREVIEW_WIDTH_REM - 1.5;

function HeroPackArt({
  name,
  imageUrl,
  className = "",
}: {
  name: string;
  imageUrl: string | null;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <div
        className={`relative aspect-[4/7] overflow-hidden rounded-2xl border-2 border-white/15 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.75)] ${className}`}
      >
        <Image src={imageUrl} alt={name} fill sizes="(max-width: 768px) 40vw, 240px" className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`relative flex aspect-[4/7] items-center justify-center overflow-hidden rounded-2xl border-2 border-white/15 bg-gradient-to-br from-accent/35 via-surface to-neutral-950 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.75)] ${className}`}
    >
      <Gift size={72} className="text-gold-bright/80" />
    </div>
  );
}

export function PackDetailView({ packId }: { packId: number }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["pack-detail", packId],
    queryFn: () => fetchPackDetail(packId),
  });

  const [paymentMethod, setPaymentMethod] = useState<PackPaymentMethod>("general");
  const [openError, setOpenError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "opening">("idle");
  const [packReveal, setPackReveal] = useState<PackRevealState | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);

  useEffect(() => {
    if (!data) return;
    setPaymentMethod(data.eligibility.defaultPaymentMethod);
  }, [data]);

  const openMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packConfigId: packId, paymentMethod }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to open pack");
      }
      return res.json() as Promise<PackResult>;
    },
    onMutate: () => {
      setOpenError(null);
      setPhase("opening");
      if (data) {
        setPackReveal({
          packName: data.pack.name,
          packImageUrl: data.pack.imageUrl,
          characters: [],
          phase: "opening",
          revealedCount: 0,
        });
      }
    },
    onSuccess: (result) => {
      setPhase("idle");
      setPackReveal((current) => {
        if (current) {
          return { ...current, characters: result.characters };
        }
        if (!data) return null;
        return {
          packName: data.pack.name,
          packImageUrl: data.pack.imageUrl,
          characters: result.characters,
          phase: "opening",
          revealedCount: 0,
        };
      });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.invalidateQueries({ queryKey: ["pack-detail", packId] });
      queryClient.invalidateQueries({ queryKey: ["pack-eligibility"] });
      queryClient.invalidateQueries({ queryKey: ["active-packs"] });
    },
    onError: (err: Error) => {
      setOpenError(err.message);
      setPhase("idle");
      setPackReveal(null);
    },
  });

  useEffect(() => {
    if (!packReveal || packReveal.characters.length === 0) return;

    if (packReveal.phase === "opening") {
      const timer = window.setTimeout(() => {
        setPackReveal((current) =>
          current && current.characters.length > 0
            ? { ...current, phase: "revealing", revealedCount: 0 }
            : current,
        );
      }, 1000);
      return () => window.clearTimeout(timer);
    }

    if (packReveal.phase === "revealing" && packReveal.revealedCount < packReveal.characters.length) {
      const timer = window.setTimeout(() => {
        setPackReveal((current) => {
          if (!current) return null;
          const nextCount = current.revealedCount + 1;
          return {
            ...current,
            revealedCount: nextCount,
            phase: nextCount >= current.characters.length ? "complete" : "revealing",
          };
        });
      }, 550);
      return () => window.clearTimeout(timer);
    }
  }, [packReveal]);

  const poolCards = data?.poolCards ?? [];
  const { viewing, onPrevious, onNext, positionLabel } = useCardModalNavigation(
    poolCards,
    viewingId,
    setViewingId,
  );

  if (isLoading) {
    return <p className="text-sm text-muted">Loading pack…</p>;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link href="/packs" className="app-link inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft size={15} />
          Back to shop
        </Link>
        <p className="text-sm text-red-400">{error instanceof Error ? error.message : "Pack not found"}</p>
      </div>
    );
  }

  const { pack, eligibility, dropRates } = data;
  const prices = getPackPrices(pack);
  const hasEraPricing = pack.eraId != null && prices.eraPrice != null;
  const price =
    hasEraPricing && paymentMethod === "era" ? prices.eraPrice! : prices.generalPrice;
  const balance =
    hasEraPricing && paymentMethod === "era"
      ? eligibility.eraPointsBalance ?? 0
      : eligibility.globalPointsBalance;
  const canAfford = balance >= price;
  const hasStock = eligibility.poolSize > 0;
  const eraLabel = pack.era?.name ?? pack.eraName ?? "Any era";
  const cardTypeLabel = pack.cardType ? CARD_TYPE_LABELS_PLURAL[pack.cardType] : "Any card type";
  const heroPrimary = pack.era?.colorPrimary ?? "#7c3aed";
  const heroSecondary = pack.era?.colorSecondary ?? "#312e81";
  const ownedInPool = poolCards.filter((card) => card.owned).length;

  return (
    <div className="space-y-8 pb-10">
      <Link href="/packs" className="app-link inline-flex items-center gap-1.5 text-sm">
        <ArrowLeft size={15} />
        Booster pack shop
      </Link>

      <section
        className="relative overflow-hidden rounded-3xl border border-border shadow-2xl"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${heroPrimary} 42%, #0a0a0a) 0%, color-mix(in srgb, ${heroSecondary} 28%, #0a0a0a) 48%, #0a0a0a 100%)`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_42%)]" />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-bright/90">
                Booster pack
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{pack.name}</h1>
              <p className="text-sm text-white/75">
                {eraLabel}
                {pack.cardType ? ` · ${cardTypeLabel}` : ""}
              </p>
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
              {pack.description}
            </p>

            <dl className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                <dt className="text-[11px] uppercase tracking-wide text-white/55">Cards</dt>
                <dd className="mt-1 text-lg font-semibold text-white">{pack.cardsPerPack}</dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                <dt className="text-[11px] uppercase tracking-wide text-white/55">Pool</dt>
                <dd className="mt-1 text-lg font-semibold text-white">{eligibility.poolSize}</dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                <dt className="text-[11px] uppercase tracking-wide text-white/55">Owned</dt>
                <dd className="mt-1 text-lg font-semibold text-white">
                  {ownedInPool}/{poolCards.length}
                </dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                <dt className="text-[11px] uppercase tracking-wide text-white/55">Price</dt>
                <dd className="mt-1 text-lg font-semibold text-gold-bright">
                  {hasEraPricing ? `${prices.eraPrice} era pts` : `${prices.generalPrice} pts`}
                </dd>
              </div>
            </dl>

            <div className="max-w-xl space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4">
              {hasEraPricing && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("era")}
                    disabled={phase === "opening"}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      paymentMethod === "era"
                        ? "border-gold/50 bg-gold/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                    }`}
                  >
                    <span className="block text-[11px] uppercase tracking-wide text-white/55">Era points</span>
                    <span className="mt-0.5 block font-medium">{prices.eraPrice} pts</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("general")}
                    disabled={phase === "opening"}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      paymentMethod === "general"
                        ? "border-gold/50 bg-gold/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                    }`}
                  >
                    <span className="block text-[11px] uppercase tracking-wide text-white/55">General points</span>
                    <span className="mt-0.5 block font-medium">{prices.generalPrice} pts</span>
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-white/75">
                  Balance: <span className="font-medium text-gold-bright">{balance} pts</span>
                </p>
                <button
                  type="button"
                  onClick={() => openMutation.mutate()}
                  disabled={phase === "opening" || !canAfford || !hasStock || openMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Package size={16} />
                  {phase === "opening" || openMutation.isPending
                    ? "Opening…"
                    : `Open pack · ${price} ${paymentMethod === "era" ? "era pts" : "pts"}`}
                </button>
              </div>

              {!hasStock && (
                <p className="text-sm text-white/70">No cards are configured for this pack yet.</p>
              )}
              {hasStock && !canAfford && (
                <p className="text-sm text-white/70">
                  You need more {paymentMethod === "era" ? eraLabel : "general"} points to open this pack.
                </p>
              )}
              {openError && <p className="text-sm text-red-300">{openError}</p>}
            </div>
          </div>

          <HeroPackArt
            name={pack.name}
            imageUrl={pack.imageUrl}
            className="mx-auto w-full max-w-[220px] lg:mx-0 lg:max-w-none"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4 rounded-2xl border border-border bg-surface/40 p-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Why open this pack?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Every pull comes from the {eraLabel} card pool. Chase higher rarities, fill gaps in your
              collection, and stack duplicates to power up your decks.
            </p>
          </div>
          {pack.era?.description ? (
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <h3 className="text-sm font-medium text-foreground">About {pack.era.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{pack.era.description}</p>
            </div>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-border bg-surface/40 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Drop rates</h2>
          <ul className="mt-3 space-y-2">
            {RARITY_ORDER.filter((rarity) => dropRates[rarity] != null)
              .reverse()
              .map((rarity) => (
                <li key={rarity} className="flex items-center justify-between text-sm">
                  <span style={{ color: RARITY_META[rarity].color }}>{RARITY_META[rarity].label}</span>
                  <span className="font-mono text-foreground/85">{dropRates[rarity]}%</span>
                </li>
              ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Rates reflect this pack&apos;s configured weights among rarities currently in the pool.
          </p>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Cards you can pull</h2>
            <p className="mt-1 text-sm text-muted">
              {poolCards.length} unique card{poolCards.length === 1 ? "" : "s"} in this pack&apos;s pool.
            </p>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Layers size={12} />
            Duplicates allowed
          </p>
        </div>

        {poolCards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
            <Gift size={28} className="mx-auto text-subtle" />
            <p className="mt-3 text-foreground/80">No cards have been added to this pack yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {poolCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setViewingId(card.id)}
                className="group border-0 bg-transparent p-0 text-left"
                aria-label={`Preview ${card.name}`}
              >
                <LayoutCharacterCard
                  {...layoutCharacterCardFromCharacter(card, {
                    displayWidthRem: CARD_DISPLAY_WIDTH_REM,
                    innerClassName: "pointer-events-none transition-[filter] duration-200 group-hover:brightness-110",
                    ownership: {
                      showStatus: true,
                      owned: card.owned ?? false,
                      quantity: card.quantity,
                    },
                  })}
                />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles size={16} className="text-gold-bright" />
              Ready to open {pack.name}?
            </p>
            <p className="mt-1 text-sm text-muted">
              {pack.cardsPerPack} cards · {eligibility.poolSize} possible pulls ·{" "}
              {hasEraPricing ? (
                <>
                  <Coins size={12} className="mr-1 inline" />
                  {prices.eraPrice} era pts or {prices.generalPrice} general pts
                </>
              ) : (
                <>
                  <Coins size={12} className="mr-1 inline" />
                  {prices.generalPrice} pts
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openMutation.mutate()}
            disabled={phase === "opening" || !canAfford || !hasStock || openMutation.isPending}
            className="app-btn-primary px-5 py-2.5 disabled:cursor-not-allowed"
          >
            Open pack
          </button>
        </div>
      </section>

      {viewing && (
        <CharacterCardModal
          character={viewing}
          onClose={() => setViewingId(null)}
          onPrevious={onPrevious}
          onNext={onNext}
          positionLabel={positionLabel}
          showOwnershipStatus
          locked={!viewing.owned}
        />
      )}

      {packReveal && (
        <PackOpeningOverlay
          packName={packReveal.packName}
          packImageUrl={packReveal.packImageUrl}
          characters={packReveal.characters}
          phase={packReveal.phase}
          revealedCount={packReveal.revealedCount}
          onClose={() => {
            setPackReveal(null);
            setPhase("idle");
            setOpenError(null);
          }}
        />
      )}
    </div>
  );
}
