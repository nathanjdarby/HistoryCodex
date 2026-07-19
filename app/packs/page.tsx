"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, Sparkles, X, Package, Coins, Layers } from "lucide-react";
import type { Character, Era } from "@/lib/types";
import {
  PackOpeningOverlay,
  type PackRevealPhase,
  type PulledPackCharacter,
} from "@/components/pack-opening-overlay";
import {
  defaultPackPaymentMethod,
  getPackPrices,
  type PackPaymentMethod,
} from "@/lib/pack-pricing";
import { CARD_TYPE_LABELS_PLURAL, type CardType } from "@/lib/card-types";

type Stats = { pointsBalance: number };
type EraBalance = {
  eraId: number;
  eraName: string;
  eraSlug: string;
  colorPrimary: string;
  pointsBalance: number;
};
type StatsResponse = Stats & { eraBalances?: EraBalance[] };
type PackResult = { characters: PulledPackCharacter[]; stats: Stats };
type PackRevealState = {
  packName: string;
  packImageUrl: string | null;
  characters: PulledPackCharacter[];
  phase: PackRevealPhase;
  revealedCount: number;
};
type Eligibility = {
  remaining: number;
  poolSize: number;
  cardsPerPack: number;
  price: number;
  eraPrice: number | null;
  generalPrice: number;
  active: boolean;
  eraId: number | null;
  eraPointsBalance: number | null;
  globalPointsBalance: number;
  defaultPaymentMethod: PackPaymentMethod;
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

type Phase = "idle" | "opening";

async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

function paymentBalance(
  stats: StatsResponse | undefined,
  config: Pick<PackConfig, "eraId">,
  eligibility: Eligibility | undefined,
  paymentMethod: PackPaymentMethod,
) {
  if (config.eraId != null && paymentMethod === "era") {
    return eligibility?.eraPointsBalance ?? 0;
  }
  return eligibility?.globalPointsBalance ?? stats?.pointsBalance ?? 0;
}

function paymentPrice(
  config: Pick<PackConfig, "price" | "eraId">,
  eligibility: Eligibility | undefined,
  paymentMethod: PackPaymentMethod,
) {
  if (eligibility) {
    return paymentMethod === "era" && eligibility.eraPrice != null
      ? eligibility.eraPrice
      : eligibility.generalPrice;
  }

  const prices = getPackPrices(config);
  return paymentMethod === "era" && prices.eraPrice != null ? prices.eraPrice : prices.generalPrice;
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
  animate = false,
  sizes = "200px",
}: {
  config: Pick<PackConfig, "name" | "imageUrl">;
  className?: string;
  animate?: boolean;
  sizes?: string;
}) {
  const baseClass = `relative aspect-[4/7] overflow-hidden rounded-xl border-2 shadow-lg ${
    animate
      ? "animate-bounce border-amber-500 shadow-[0_0_30px_-4px_rgba(245,158,11,0.7)]"
      : "border-amber-700/50"
  } ${className}`;

  if (config.imageUrl) {
    return (
      <div className={`${baseClass} bg-neutral-950`}>
        <Image src={config.imageUrl} alt={config.name} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${baseClass} flex items-center justify-center bg-gradient-to-br from-amber-900/50 via-amber-950/30 to-neutral-950`}
    >
      <Gift size={40} className={animate ? "animate-pulse text-amber-300" : "text-amber-400"} />
    </div>
  );
}

function PackShopTile({
  config,
  inStock,
  onSelect,
}: {
  config: PackConfig;
  inStock: boolean;
  onSelect: () => void;
}) {
  const prices = getPackPrices(config);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 text-left transition-all hover:-translate-y-0.5 hover:border-amber-700/60 hover:shadow-[0_12px_40px_-20px_rgba(245,158,11,0.45)]"
    >
      <div className="relative p-3 pb-0">
        <PackArtwork config={config} className="w-full" sizes="(max-width: 768px) 45vw, 220px" />
        {!inStock && (
          <span className="absolute right-5 top-5 rounded bg-neutral-950/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 ring-1 ring-neutral-700">
            Out of stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 pt-2">
        <p className="line-clamp-2 text-sm font-semibold text-neutral-100 group-hover:text-amber-100">
          {config.name}
        </p>
        <p className="text-xs text-neutral-500">{packScope(config)}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs">
          <span className="flex flex-col gap-0.5 font-medium text-amber-200">
            {prices.eraPrice != null ? (
              <>
                <span className="flex items-center gap-1">
                  <Coins size={12} />
                  {prices.eraPrice} era pts
                </span>
                <span className="text-[10px] font-normal text-neutral-500">
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
          <span className="text-neutral-500">
            {config.cardsPerPack} card{config.cardsPerPack === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </button>
  );
}

function PackDetailModal({
  config,
  stats,
  eligibility,
  phase,
  error,
  paymentMethod,
  onPaymentMethodChange,
  onClose,
  onOpen,
}: {
  config: PackConfig;
  stats: StatsResponse | undefined;
  eligibility: Eligibility | undefined;
  phase: Phase;
  error: string | null;
  paymentMethod: PackPaymentMethod;
  onPaymentMethodChange: (method: PackPaymentMethod) => void;
  onClose: () => void;
  onOpen: () => void;
}) {
  const eraLabel = config.eraName ?? "Any era";
  const cardTypeLabel = config.cardType ? CARD_TYPE_LABEL[config.cardType] : "Any card type";
  const cardsPerPack = eligibility?.cardsPerPack ?? config.cardsPerPack;
  const prices = getPackPrices(config);
  const price = paymentPrice(config, eligibility, paymentMethod);
  const balance = paymentBalance(stats, config, eligibility, paymentMethod);
  const canAfford = balance >= price;
  const hasEraPricing = config.eraId != null && prices.eraPrice != null;
  const balanceLabel =
    hasEraPricing && paymentMethod === "era"
      ? `${config.eraName ?? "Era"} balance`
      : "General balance";
  const hasStock = (eligibility?.poolSize ?? eligibility?.remaining ?? 0) > 0;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={phase === "opening" ? undefined : onClose}
    >
      <div
        className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={phase === "opening"}
          className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200 disabled:opacity-40"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="grid gap-5 p-5 sm:grid-cols-[11rem_1fr] sm:p-6">
          <div className="mx-auto w-full max-w-[11rem] sm:mx-0">
            <PackArtwork
              config={config}
              className="w-full"
              animate={phase === "opening"}
              sizes="176px"
            />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-500/90">Booster pack</p>
            <h2 className="mt-1 text-xl font-semibold text-amber-100">{config.name}</h2>
            {config.description ? (
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">{config.description}</p>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">
                A curated pull of cards from your collection catalog.
              </p>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2">
                <dt className="text-[11px] uppercase tracking-wide text-neutral-500">Price</dt>
                <dd className="mt-0.5 font-medium text-amber-200">
                  {hasEraPricing ? (
                    <>
                      {prices.eraPrice} era pts
                      <span className="mt-0.5 block text-xs font-normal text-neutral-500">
                        or {prices.generalPrice} general pts
                      </span>
                    </>
                  ) : (
                    `${prices.generalPrice} points`
                  )}
                </dd>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2">
                <dt className="text-[11px] uppercase tracking-wide text-neutral-500">Contents</dt>
                <dd className="mt-0.5 font-medium text-neutral-200">
                  {cardsPerPack} card{cardsPerPack === 1 ? "" : "s"}
                </dd>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2">
                <dt className="text-[11px] uppercase tracking-wide text-neutral-500">Era</dt>
                <dd className="mt-0.5 font-medium text-neutral-200">{eraLabel}</dd>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2">
                <dt className="text-[11px] uppercase tracking-wide text-neutral-500">Card type</dt>
                <dd className="mt-0.5 font-medium text-neutral-200">{cardTypeLabel}</dd>
              </div>
            </dl>

            {eligibility && (
              <p className="mt-3 text-xs text-neutral-500">
                {eligibility.poolSize ?? eligibility.remaining} card type
                {(eligibility.poolSize ?? eligibility.remaining) === 1 ? "" : "s"} in this pack&apos;s pool.
                Duplicates can be pulled.
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-neutral-800 px-5 py-4 sm:px-6">
          <div className="space-y-3">
              {hasEraPricing && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onPaymentMethodChange("era")}
                    disabled={phase === "opening"}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      paymentMethod === "era"
                        ? "border-amber-600 bg-amber-950/40 text-amber-100"
                        : "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <span className="block text-[11px] uppercase tracking-wide text-neutral-500">
                      Era points
                    </span>
                    <span className="mt-0.5 block font-medium">{prices.eraPrice} pts</span>
                    <span className="mt-0.5 block text-xs text-neutral-500">
                      {eligibility?.eraPointsBalance ?? 0} available
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onPaymentMethodChange("general")}
                    disabled={phase === "opening"}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      paymentMethod === "general"
                        ? "border-amber-600 bg-amber-950/40 text-amber-100"
                        : "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <span className="block text-[11px] uppercase tracking-wide text-neutral-500">
                      General points
                    </span>
                    <span className="mt-0.5 block font-medium">{prices.generalPrice} pts</span>
                    <span className="mt-0.5 block text-xs text-neutral-500">
                      {eligibility?.globalPointsBalance ?? stats?.pointsBalance ?? 0} available
                    </span>
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-neutral-400">
                  {balanceLabel}:{" "}
                  <span className="font-medium text-amber-200">{balance} pts</span>
                  {hasEraPricing && paymentMethod === "general" && (
                    <span className="ml-2 text-xs text-neutral-500">
                      ({config.eraName}: {eligibility?.eraPointsBalance ?? 0} era pts)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onOpen}
                  disabled={phase === "opening" || !canAfford || !hasStock}
                  className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
                >
                  {phase === "opening"
                    ? "Opening…"
                    : `Open pack · ${price} ${paymentMethod === "era" ? "era pts" : "pts"}`}
                </button>
              </div>
          </div>

          {!hasStock && phase === "idle" && (
            <p className="mt-2 text-sm text-neutral-500">
              No cards are configured for this pack yet.
            </p>
          )}
          {hasStock && !canAfford && phase === "idle" && (
            <p className="mt-2 text-sm text-neutral-500">
              {hasEraPricing && paymentMethod === "era"
                ? `You need more ${config.eraName ?? "era"} points to open this pack.`
                : "You need more general points to open this pack."}
            </p>
          )}
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default function PacksPage() {
  const queryClient = useQueryClient();
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchStats });
  const { data: packConfigs, isLoading } = useQuery({
    queryKey: ["active-packs"],
    queryFn: fetchActivePacks,
  });

  const activeConfigs = packConfigs ?? [];
  const [selectedPack, setSelectedPack] = useState<PackConfig | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PackPaymentMethod>("general");
  const [phase, setPhase] = useState<Phase>("idle");
  const [packReveal, setPackReveal] = useState<PackRevealState | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const selectedEligibility = selectedPack ? eligibilityByPackId.get(selectedPack.id) : undefined;

  const openMutation = useMutation({
    mutationFn: async ({
      packConfigId,
      paymentMethod: method,
    }: {
      packConfigId: number;
      paymentMethod: PackPaymentMethod;
    }) => {
      const res = await fetch("/api/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packConfigId, paymentMethod: method }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to open pack");
      }
      return res.json() as Promise<PackResult>;
    },
    onMutate: () => {
      setError(null);
      setPhase("opening");
      if (selectedPack) {
        setPackReveal({
          packName: selectedPack.name,
          packImageUrl: selectedPack.imageUrl,
          characters: [],
          phase: "opening",
          revealedCount: 0,
        });
        setSelectedPack(null);
      }
    },
    onSuccess: (data, { packConfigId }) => {
      const config = activeConfigs.find((entry) => entry.id === packConfigId);
      setPhase("idle");
      setPackReveal((current) => {
        if (current) {
          return { ...current, characters: data.characters };
        }
        if (!config) return null;
        return {
          packName: config.name,
          packImageUrl: config.imageUrl,
          characters: data.characters,
          phase: "opening",
          revealedCount: 0,
        };
      });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.invalidateQueries({ queryKey: ["pack-eligibility"] });
    },
    onError: (err: Error) => {
      setError(err.message);
      setPhase("idle");
      setPackReveal(null);
    },
  });

  useEffect(() => {
    if (!packReveal) return;
    if (packReveal.characters.length === 0) return;

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

  function closeModal() {
    if (phase === "opening") return;
    setSelectedPack(null);
    setPhase("idle");
    setError(null);
  }

  function closePackReveal() {
    setPackReveal(null);
    setPhase("idle");
    setError(null);
  }

  function packInStock(config: PackConfig) {
    const eligibility = eligibilityByPackId.get(config.id);
    if (!eligibility) return true;
    return (eligibility.poolSize ?? eligibility.remaining) > 0;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-amber-100">
            <Package size={22} className="text-amber-500" />
            Booster pack shop
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-400">
            Browse available packs, then tap one to see what&apos;s inside and open it with your
            reading points.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-amber-800/50 bg-amber-950/40 px-3 py-1.5 text-sm font-medium text-amber-200">
          <Sparkles size={14} />
          {stats?.pointsBalance ?? 0} pts
        </div>
      </div>

      {error && !packReveal && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {isLoading && <p className="text-sm text-neutral-500">Loading the shop…</p>}

      {!isLoading && activeConfigs.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/20 px-6 py-10 text-center">
          <Gift size={32} className="mx-auto text-neutral-600" />
          <p className="mt-3 text-neutral-300">No booster packs are on sale right now.</p>
          <p className="mt-1 text-sm text-neutral-500">Check back later for new drops.</p>
        </div>
      )}

      {!isLoading && activeConfigs.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {activeConfigs.map((config) => (
            <PackShopTile
              key={config.id}
              config={config}
              inStock={packInStock(config)}
              onSelect={() => {
                setSelectedPack(config);
                setPaymentMethod(defaultPackPaymentMethod(config));
                setPhase("idle");
                setError(null);
              }}
            />
          ))}
        </div>
      )}

      {!isLoading && activeConfigs.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Layers size={12} />
          {activeConfigs.length} pack{activeConfigs.length === 1 ? "" : "s"} available · duplicate pulls
          allowed
        </p>
      )}

      {selectedPack && (
        <PackDetailModal
          config={selectedPack}
          stats={stats}
          eligibility={selectedEligibility}
          phase={phase}
          error={error}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          onClose={closeModal}
          onOpen={() =>
            openMutation.mutate({
              packConfigId: selectedPack.id,
              paymentMethod,
            })
          }
        />
      )}

      {packReveal && (
        <PackOpeningOverlay
          packName={packReveal.packName}
          packImageUrl={packReveal.packImageUrl}
          characters={packReveal.characters}
          phase={packReveal.phase}
          revealedCount={packReveal.revealedCount}
          onClose={closePackReveal}
        />
      )}
    </div>
  );
}
