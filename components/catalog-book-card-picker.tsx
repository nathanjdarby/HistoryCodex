"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, LayoutGrid, List, Search, Trash2, X } from "lucide-react";
import type { Character, Era } from "@/lib/types";
import {
  CARD_PREVIEW_WIDTH_REM,
  LayoutCharacterCard,
  layoutCharacterCardFromCharacter,
} from "@/components/layout-character-card";
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
  cost: number;
  attack: number;
  defense: number;
  abilityName: string | null;
  abilityEffect: string | null;
  abilityValue: number | null;
  abilityTrigger: string | null;
  flavorText: string | null;
  holographic: boolean;
  eraId: number;
  eraName: string;
  eraColorPrimary: string;
  eraColorSecondary: string;
  imageUrl: string | null;
  imageFocusX: number;
  imageFocusY: number;
  imageScale: number;
  archetype: Character["archetype"];
};

type CharacterWithEra = Character & { era: Era; owned: boolean; unlockedAt: string | null };

type LinkedCardsView = "gallery" | "list";

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

function cardEra(card: CatalogBookCard) {
  return {
    name: card.eraName,
    colorPrimary: card.eraColorPrimary,
    colorSecondary: card.eraColorSecondary,
  };
}

const BOOK_CARD_DISPLAY_WIDTH_REM = CARD_PREVIEW_WIDTH_REM;

function LinkedCardGallery({
  cards,
  onRemove,
  removing,
}: {
  cards: CatalogBookCard[];
  onRemove: (characterId: number) => void;
  removing: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
      {cards.map((card) => (
        <div key={card.id} className="group relative shrink-0">
          <LayoutCharacterCard
            {...layoutCharacterCardFromCharacter(
              {
                ...card,
                id: card.characterId,
                era: cardEra(card),
              },
              {
                displayWidthRem: BOOK_CARD_DISPLAY_WIDTH_REM,
                innerClassName: "pointer-events-none",
              },
            )}
          />
          {!card.imageUrl && (
            <span className="pointer-events-none absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded border border-border bg-surface/95 px-1.5 py-0.5 text-[9px] text-muted shadow-sm">
              <ImageOff size={10} />
              Sprite
            </span>
          )}
          <button
            type="button"
            onClick={() => onRemove(card.characterId)}
            disabled={removing}
            className="absolute right-1.5 top-1.5 z-20 rounded-md border border-border bg-surface/95 p-1 text-muted opacity-0 shadow-md transition-opacity hover:bg-surface-hover hover:text-red-600 group-hover:opacity-100 disabled:opacity-50 dark:hover:text-red-400"
            aria-label={`Remove ${card.name}`}
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

function LinkedCardList({
  cards,
  onRemove,
  removing,
}: {
  cards: CatalogBookCard[];
  onRemove: (characterId: number) => void;
  removing: boolean;
}) {
  return (
    <ul className="space-y-2">
      {cards.map((card) => (
        <li
          key={card.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-background/50 px-3 py-2"
        >
          <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded">
            <LayoutCharacterCard
              {...layoutCharacterCardFromCharacter(
                {
                  ...card,
                  id: card.characterId,
                  era: cardEra(card),
                },
                {
                  displayWidthRem: 2.5,
                  shellClassName: "rounded-none shadow-none",
                  innerClassName: "pointer-events-none",
                  showFlavor: false,
                },
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{card.name}</p>
            <p className="text-xs text-muted">
              {card.eraName} · {RARITY_META[card.rarity].label}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(card.characterId)}
            disabled={removing}
            className="shrink-0 text-subtle hover:text-red-600 dark:hover:text-red-400"
            aria-label={`Remove ${card.name}`}
          >
            <Trash2 size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function CatalogBookCardPicker({ catalogBookId, eraId, onError }: Props) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | CatalogBookCard["cardType"]>("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [linkedView, setLinkedView] = useState<LinkedCardsView>("gallery");

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

  function handleRemove(characterId: number) {
    removeMutation.mutate(characterId);
  }

  return (
    <section className="mt-6 border-t border-border pt-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-foreground">Collectible cards</h3>
          <p className="text-xs text-muted">
            Link characters, locations, units, and events readers can discover in this book.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(linkedCards?.length ?? 0) > 0 ? (
            <div className="flex rounded-md border border-border-strong bg-surface p-0.5 text-sm">
              <button
                type="button"
                onClick={() => setLinkedView("gallery")}
                className={`rounded p-1.5 ${
                  linkedView === "gallery"
                    ? "bg-surface-raised text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
                aria-label="Gallery view"
                title="Gallery view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setLinkedView("list")}
                className={`rounded p-1.5 ${
                  linkedView === "list"
                    ? "bg-surface-raised text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
                aria-label="List view"
                title="List view"
              >
                <List size={15} />
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            className="rounded-md border border-border-strong px-3 py-1.5 text-xs text-foreground/80 hover:bg-surface-raised"
          >
            {pickerOpen ? "Close picker" : "Add cards"}
          </button>
        </div>
      </div>

      {!eraId && (
        <p className="mb-3 text-xs text-muted">
          Multi-era book — cards can belong to different eras. Search any era when adding manually.
        </p>
      )}

      {cardsLoading && <p className="text-sm text-muted">Loading cards…</p>}

      {!cardsLoading && (linkedCards?.length ?? 0) === 0 && (
        <p className="text-sm text-muted">No cards linked yet.</p>
      )}

      {(linkedCards?.length ?? 0) > 0 && (
        <div className="space-y-4">
          {CARD_TYPES.map((cardType) => {
            const cards = grouped[cardType];
            if (cards.length === 0) return null;
            const Icon = CARD_TYPE_ICONS[cardType];
            return (
              <div key={cardType}>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                  <Icon size={12} />
                  {CARD_TYPE_LABELS_PLURAL[cardType]} ({cards.length})
                </p>
                {linkedView === "gallery" ? (
                  <LinkedCardGallery
                    cards={cards}
                    onRemove={handleRemove}
                    removing={removeMutation.isPending}
                  />
                ) : (
                  <LinkedCardList
                    cards={cards}
                    onRemove={handleRemove}
                    removing={removeMutation.isPending}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {pickerOpen && (
        <div className="mt-4 space-y-3 rounded-lg border border-border bg-background/60 p-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cards…"
                className="w-full rounded border border-border-strong bg-surface py-1.5 pl-8 pr-8 text-sm text-foreground placeholder:text-subtle"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground/80"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "" | CardType)}
              className="rounded border border-border-strong bg-surface px-2 py-1.5 text-sm text-foreground"
            >
              <option value="">All types</option>
              {CARD_TYPES.map((cardType) => (
                <option key={cardType} value={cardType}>
                  {CARD_TYPE_LABELS_PLURAL[cardType]}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto">
            {candidates.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => addMutation.mutate(card.id)}
                disabled={addMutation.isPending}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-surface-raised disabled:opacity-50"
              >
                <span className="min-w-0 flex-1 truncate text-foreground">{card.name}</span>
                <span className="shrink-0 text-xs text-muted">
                  {!eraId ? `${card.era.name} · ` : ""}
                  {CARD_TYPE_LABELS[card.cardType]} · {RARITY_META[card.rarity].label}
                </span>
              </button>
            ))}
            {candidates.length === 0 && (
              <p className="px-2 py-1 text-xs text-muted">
                {eraId ? "No matching cards in this era." : "No matching cards."}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
