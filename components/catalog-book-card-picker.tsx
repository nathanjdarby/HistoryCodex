"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, X } from "lucide-react";
import type { Character, Era } from "@/lib/types";
import { CharacterArt } from "@/components/character-art";
import { CARD_TYPE_ICONS, CARD_TYPE_LABELS, CARD_TYPE_LABELS_PLURAL, CARD_TYPES, type CardType } from "@/lib/card-types";
import { RARITY_META } from "@/lib/rarity";

type CatalogBookCard = {
  id: number;
  catalogBookId: number;
  characterId: number;
  sortOrder: number;
  name: string;
  seed: string;
  cardType: CardType;
  rarity: Character["rarity"];
  eraId: number;
  eraName: string;
  imageUrl: string | null;
};

type CharacterWithEra = Character & { era: Era; owned: boolean; unlockedAt: string | null };

async function fetchBookCards(catalogBookId: number): Promise<CatalogBookCard[]> {
  const res = await fetch(`/api/admin/catalog-books/${catalogBookId}/cards`);
  if (!res.ok) throw new Error("Failed to load book cards");
  return res.json();
}

async function fetchCharacters(eraId?: number): Promise<CharacterWithEra[]> {
  const url = eraId ? `/api/characters?eraId=${eraId}` : "/api/characters";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load cards");
  return res.json();
}

type Props = {
  catalogBookId: number;
  eraId: number | null;
  onError: (message: string) => void;
};

export function CatalogBookCardPicker({ catalogBookId, eraId, onError }: Props) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | CatalogBookCard["cardType"]>("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: linkedCards, isLoading: cardsLoading } = useQuery({
    queryKey: ["admin-catalog-book-cards", catalogBookId],
    queryFn: () => fetchBookCards(catalogBookId),
  });

  const { data: allCards } = useQuery({
    queryKey: ["characters", eraId ?? "all"],
    queryFn: () => fetchCharacters(eraId ?? undefined),
    enabled: pickerOpen,
  });

  const linkedIds = useMemo(
    () => new Set((linkedCards ?? []).map((card) => card.characterId)),
    [linkedCards],
  );

  const addMutation = useMutation({
    mutationFn: async (characterId: number) => {
      const res = await fetch(`/api/admin/catalog-books/${catalogBookId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to add card");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["admin-catalog-book-cards", catalogBookId], data);
    },
    onError: (err: Error) => onError(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (characterId: number) => {
      const res = await fetch(
        `/api/admin/catalog-books/${catalogBookId}/cards/${characterId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to remove card");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-catalog-book-cards", catalogBookId] });
    },
    onError: (err: Error) => onError(err.message),
  });

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (allCards ?? [])
      .filter((card) => !linkedIds.has(card.id))
      .filter((card) => (typeFilter ? card.cardType === typeFilter : true))
      .filter(
        (card) =>
          !q ||
          card.name.toLowerCase().includes(q) ||
          card.era.name.toLowerCase().includes(q),
      )
      .slice(0, 16);
  }, [allCards, linkedIds, query, typeFilter]);

  const grouped = useMemo(() => {
    const groups: Record<CardType, CatalogBookCard[]> = {
      character: [],
      location: [],
      unit: [],
      event: [],
    };
    for (const card of linkedCards ?? []) {
      groups[card.cardType].push(card);
    }
    return groups;
  }, [linkedCards]);

  return (
    <section className="mt-6 border-t border-neutral-800 pt-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-neutral-200">Collectible cards</h3>
          <p className="text-xs text-neutral-500">
            Link characters, locations, units, and events readers can discover in this book.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen((open) => !open)}
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
        >
          {pickerOpen ? "Close picker" : "Add cards"}
        </button>
      </div>

      {!eraId && (
        <p className="mb-3 text-xs text-amber-400/90">
          Assign an era to this book before linking cards — cards must match the book&apos;s era.
        </p>
      )}

      {cardsLoading && <p className="text-sm text-neutral-500">Loading cards…</p>}

      {!cardsLoading && (linkedCards?.length ?? 0) === 0 && (
        <p className="text-sm text-neutral-500">No cards linked yet.</p>
      )}

      {(linkedCards?.length ?? 0) > 0 && (
        <div className="space-y-4">
          {CARD_TYPES.map((cardType) => {
            const cards = grouped[cardType];
            if (cards.length === 0) return null;
            const Icon = CARD_TYPE_ICONS[cardType];
            return (
              <div key={cardType}>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  <Icon size={12} />
                  {CARD_TYPE_LABELS_PLURAL[cardType]} ({cards.length})
                </p>
                <ul className="space-y-2">
                  {cards.map((card) => (
                    <li
                      key={card.id}
                      className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950/50 px-3 py-2"
                    >
                      <div className="shrink-0 overflow-hidden rounded">
                        <CharacterArt
                          seed={card.seed}
                          imageUrl={card.imageUrl}
                          era={{ colorPrimary: "#78716c", colorSecondary: "#44403c" }}
                          rarity={card.rarity}
                          archetype={null}
                          size={40}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-200">{card.name}</p>
                        <p className="text-xs text-neutral-500">
                          {card.eraName} · {RARITY_META[card.rarity].label}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(card.characterId)}
                        disabled={removeMutation.isPending}
                        className="shrink-0 text-neutral-600 hover:text-red-400"
                        aria-label={`Remove ${card.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {pickerOpen && (
        <div className="mt-4 space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cards…"
                className="w-full rounded border border-neutral-700 bg-neutral-950 py-1.5 pl-8 pr-8 text-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "" | CardType)}
              className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
            >
              <option value="">All types</option>
              {CARD_TYPES.map((cardType) => (
                <option key={cardType} value={cardType}>
                  {CARD_TYPE_LABELS_PLURAL[cardType]}
                </option>
              ))}
            </select>
          </div>

          {!eraId ? (
            <p className="text-xs text-neutral-500">Set an era on this book to add cards.</p>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {candidates.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => addMutation.mutate(card.id)}
                  disabled={addMutation.isPending}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-neutral-800 disabled:opacity-50"
                >
                  <span className="min-w-0 flex-1 truncate text-neutral-200">{card.name}</span>
                  <span className="shrink-0 text-xs text-neutral-500">
                    {CARD_TYPE_LABELS[card.cardType]} · {RARITY_META[card.rarity].label}
                  </span>
                </button>
              ))}
              {candidates.length === 0 && (
                <p className="px-2 py-1 text-xs text-neutral-500">No matching cards in this era.</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
