"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Minus, Plus, Save, Trash2 } from "lucide-react";
import type { Character, Era } from "@/lib/types";
import { BattleDeckCard } from "@/components/battle/battle-deck-card";
import { characterToBattleCardFace } from "@/components/battle/battle-card-face";
import { CharacterCardModal } from "@/components/character-card-modal";
import {
  DEFAULT_BATTLE_RULES,
} from "@/lib/battle/constants";
import { DEFAULT_DECK_COMPOSITION } from "@/lib/battle/deck-composition";
import {
  adjustDeckQuantity,
  typeCountsFromQuantities,
  totalDeckCards,
} from "@/lib/client/deck-builder";
import { DeckCompositionBlueprint } from "@/components/deck-composition-blueprint";
import {
  CARD_TYPE_LABELS_PLURAL,
  type CardType,
} from "@/lib/card-types";

const DECK_SIZE = DEFAULT_BATTLE_RULES.deckSize;
const PICKER_CARD_TYPES: CardType[] = ["unit", "event", "location", "character"];

function filterCatalogCards(
  characters: CharacterWithEra[] | undefined,
  cardType: CardType,
  eraFilterId: number | null,
) {
  return (characters ?? []).filter(
    (c) => c.cardType === cardType && (eraFilterId == null || c.eraId === eraFilterId),
  );
}

function countCardsInList(cards: CharacterWithEra[], quantities: Map<number, number>) {
  return cards.reduce((sum, card) => sum + (quantities.get(card.id) ?? 0), 0);
}

type CatalogDeck = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  eraId: number | null;
  eraName: string | null;
  deckKind: "starter" | "themed";
  price: number;
  sortOrder: number;
  active: boolean;
  totalCards: number;
  valid: boolean;
  validationErrors: string[];
};

type DeckCard = {
  characterId: number;
  quantity: number;
  name: string;
  cardType: string;
  cost: number;
  rarity: string;
  eraId: number;
  eraName: string;
};

type DeckForm = {
  name: string;
  description: string;
  imageUrl: string;
  eraId: string;
  deckKind: "starter" | "themed";
  price: string;
  sortOrder: string;
  active: boolean;
};

const emptyForm: DeckForm = {
  name: "",
  description: "",
  imageUrl: "",
  eraId: "",
  deckKind: "starter",
  price: "0",
  sortOrder: "0",
  active: true,
};

async function fetchCatalogDecks(): Promise<CatalogDeck[]> {
  const res = await fetch("/api/admin/catalog-decks");
  if (!res.ok) throw new Error("Failed to load catalog decks");
  return res.json();
}

async function fetchEras(): Promise<Era[]> {
  const res = await fetch("/api/eras");
  if (!res.ok) throw new Error("Failed to load eras");
  return res.json();
}

type CharacterWithEra = Character & { era: Era };

async function fetchCharacters(): Promise<CharacterWithEra[]> {
  const res = await fetch("/api/characters");
  if (!res.ok) throw new Error("Failed to load cards");
  return res.json();
}

async function fetchDeckCards(deckId: number): Promise<DeckCard[]> {
  const res = await fetch(`/api/admin/catalog-decks/${deckId}/cards`);
  if (!res.ok) throw new Error("Failed to load deck cards");
  return res.json();
}

function toForm(deck: CatalogDeck): DeckForm {
  return {
    name: deck.name,
    description: deck.description ?? "",
    imageUrl: deck.imageUrl ?? "",
    eraId: deck.eraId ? String(deck.eraId) : "",
    deckKind: deck.deckKind,
    price: String(deck.price),
    sortOrder: String(deck.sortOrder),
    active: deck.active,
  };
}

export default function AdminDexPage() {
  const queryClient = useQueryClient();
  const { data: decks, isLoading } = useQuery({
    queryKey: ["admin-catalog-decks"],
    queryFn: fetchCatalogDecks,
  });
  const { data: eras } = useQuery({ queryKey: ["eras"], queryFn: fetchEras });
  const { data: characters } = useQuery({ queryKey: ["characters"], queryFn: fetchCharacters });

  const [activeDeckId, setActiveDeckId] = useState<number | "new">("new");
  const [form, setForm] = useState<DeckForm>({
    ...emptyForm,
    name: "Roman Britain Starter",
  });
  const [quantities, setQuantities] = useState<Map<number, number>>(new Map());
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);

  const eraFilterId = form.eraId ? Number(form.eraId) : null;

  const catalogByType = useMemo(
    () =>
      Object.fromEntries(
        PICKER_CARD_TYPES.map((cardType) => [
          cardType,
          filterCatalogCards(characters, cardType, eraFilterId),
        ]),
      ) as Record<CardType, CharacterWithEra[]>,
    [characters, eraFilterId],
  );

  const typeCounts = useMemo(
    () => typeCountsFromQuantities(characters ?? [], quantities),
    [characters, quantities],
  );

  const totalCards = totalDeckCards(typeCounts);

  const allCatalogCards = useMemo(
    () => PICKER_CARD_TYPES.flatMap((cardType) => catalogByType[cardType]),
    [catalogByType],
  );

  const deckPreviewByType = useMemo(
    () =>
      Object.fromEntries(
        PICKER_CARD_TYPES.map((cardType) => {
          const entries: CharacterWithEra[] = [];
          for (const card of catalogByType[cardType]) {
            const qty = quantities.get(card.id) ?? 0;
            for (let i = 0; i < qty; i++) entries.push(card);
          }
          entries.sort((a, b) => a.name.localeCompare(b.name));
          return [cardType, entries];
        }),
      ) as Record<CardType, CharacterWithEra[]>,
    [catalogByType, quantities],
  );

  const viewingCard = useMemo(
    () => allCatalogCards.find((card) => card.id === viewingId) ?? null,
    [allCatalogCards, viewingId],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const metadata = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        eraId: form.eraId ? Number(form.eraId) : null,
        deckKind: form.deckKind,
        price: Number(form.price) || 0,
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active,
      };

      let deckId = activeDeckId === "new" ? null : activeDeckId;
      if (deckId == null) {
        const createRes = await fetch("/api/admin/catalog-decks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metadata),
        });
        if (!createRes.ok) {
          const body = await createRes.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to create deck");
        }
        const created = (await createRes.json()) as CatalogDeck;
        deckId = created.id;
      } else {
        const patchRes = await fetch(`/api/admin/catalog-decks/${deckId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metadata),
        });
        if (!patchRes.ok) {
          const body = await patchRes.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to update deck");
        }
      }

      const cards = [...quantities.entries()]
        .filter(([, qty]) => qty > 0)
        .map(([characterId, quantity]) => ({ characterId, quantity }));

      const cardsRes = await fetch(`/api/admin/catalog-decks/${deckId}/cards`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards }),
      });
      if (!cardsRes.ok) {
        const body = await cardsRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save deck cards");
      }

      return cardsRes.json() as Promise<{
        deck: CatalogDeck;
        validation: { valid: boolean; validationErrors: string[] };
      }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-catalog-decks"] });
      setActiveDeckId(data.deck.id);
      setValidationErrors(data.validation.validationErrors);
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (deckId: number) => {
      const res = await fetch(`/api/admin/catalog-decks/${deckId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete deck");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-catalog-decks"] });
      setActiveDeckId("new");
      setForm({ ...emptyForm, name: "New Platform Deck" });
      setQuantities(new Map());
      setValidationErrors([]);
    },
  });

  async function loadDeck(deck: CatalogDeck) {
    setActiveDeckId(deck.id);
    setForm(toForm(deck));
    setValidationErrors(deck.validationErrors);
    setError(null);
    try {
      const cards = await fetchDeckCards(deck.id);
      setQuantities(new Map(cards.map((c) => [c.characterId, c.quantity])));
      const detail = await fetch(`/api/admin/catalog-decks/${deck.id}`);
      if (detail.ok) {
        const full = (await detail.json()) as CatalogDeck;
        setValidationErrors(full.validationErrors);
      }
    } catch {
      setError("Failed to load deck cards");
    }
  }

  function adjustQty(characterId: number, delta: number, _cardType: Character["cardType"]) {
    setQuantities((prev) =>
      adjustDeckQuantity({
        characters: characters ?? [],
        quantities: prev,
        characterId,
        delta,
      }),
    );
  }

  function startNewDeck(kind: "starter" | "themed") {
    setActiveDeckId("new");
    setForm({
      ...emptyForm,
      name: kind === "starter" ? "New Starter Deck" : "New Themed Deck",
      deckKind: kind,
      price: kind === "starter" ? "0" : "100",
    });
    setQuantities(new Map());
    setValidationErrors([]);
    setError(null);
  }

  const starterDecks = (decks ?? []).filter((d) => d.deckKind === "starter");
  const themedDecks = (decks ?? []).filter((d) => d.deckKind === "themed");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-neutral-400">
          <Layers size={18} className="text-amber-500" />
          <h1 className="text-2xl font-semibold text-neutral-100">DEX — Platform Decks</h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          Build pre-made 40-card decks for the platform. Use <strong className="text-neutral-300">Starter</strong>{" "}
          decks for new-player onboarding (free pick on first login). Use{" "}
          <strong className="text-neutral-300">Themed</strong> decks for point shop purchases.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Starter decks</p>
            <button
              type="button"
              onClick={() => startNewDeck("starter")}
              className="flex w-full items-center gap-2 rounded-md border border-dashed border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
            >
              <Plus size={14} /> New starter
            </button>
            {starterDecks.map((deck) => (
              <DeckListItem
                key={deck.id}
                deck={deck}
                active={activeDeckId === deck.id}
                onSelect={() => loadDeck(deck)}
                onDelete={() => deleteMutation.mutate(deck.id)}
              />
            ))}
          </div>

          <div className="border-t border-neutral-800 pt-3 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Themed decks</p>
            <button
              type="button"
              onClick={() => startNewDeck("themed")}
              className="flex w-full items-center gap-2 rounded-md border border-dashed border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
            >
              <Plus size={14} /> New themed
            </button>
            {themedDecks.map((deck) => (
              <DeckListItem
                key={deck.id}
                deck={deck}
                active={activeDeckId === deck.id}
                onSelect={() => loadDeck(deck)}
                onDelete={() => deleteMutation.mutate(deck.id)}
              />
            ))}
          </div>

          {isLoading ? <p className="text-xs text-neutral-500">Loading…</p> : null}
        </aside>

        <div className="space-y-4">
          <div className="grid gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 sm:grid-cols-2">
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-sm text-neutral-300">Deck name</span>
              <input
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-sm text-neutral-300">Description</span>
              <textarea
                rows={2}
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Shown when players pick or buy this deck"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-neutral-300">Kind</span>
              <select
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
                value={form.deckKind}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    deckKind: e.target.value as "starter" | "themed",
                    price: e.target.value === "starter" ? "0" : f.price,
                  }))
                }
              >
                <option value="starter">Starter (free onboarding)</option>
                <option value="themed">Themed (points shop)</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-neutral-300">Era theme</span>
              <select
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
                value={form.eraId}
                onChange={(e) => setForm((f) => ({ ...f, eraId: e.target.value }))}
              >
                <option value="">Any era</option>
                {(eras ?? []).map((era) => (
                  <option key={era.id} value={era.id}>
                    {era.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-neutral-300">Price (points)</span>
              <input
                type="number"
                min={0}
                disabled={form.deckKind === "starter"}
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm disabled:opacity-50"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-neutral-300">Sort order</span>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-sm text-neutral-300">Cover image URL</span>
              <input
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="Optional preview image for shop / picker"
              />
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              <span className="text-sm text-neutral-300">Active on platform</span>
            </label>
          </div>

          <DeckCompositionBlueprint typeCounts={typeCounts} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-500">Total {totalCards}/{DECK_SIZE}</p>
            <button
              type="button"
              disabled={saveMutation.isPending || !form.name.trim()}
              onClick={() => saveMutation.mutate()}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-amber-600 disabled:opacity-60"
            >
              <Save size={14} />
              Save deck
            </button>
          </div>

          {validationErrors.length > 0 ? (
            <div className="rounded-md border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
              {validationErrors[0]}
            </div>
          ) : totalCards === DECK_SIZE ? (
            <div className="rounded-md border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300">
              Deck composition is valid ({DECK_SIZE}/{DECK_SIZE}).
            </div>
          ) : (
            <div className="rounded-md border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-400">
              Fill each card type to its target range (40 cards total, max 3 copies each).
            </div>
          )}

          {totalCards > 0 ? (
            <section className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
              <div>
                <h2 className="text-lg font-medium text-neutral-100">Deck preview</h2>
                <p className="text-sm text-neutral-500">
                  {totalCards} card{totalCards === 1 ? "" : "s"} in this list — click a card to inspect.
                </p>
              </div>
              {PICKER_CARD_TYPES.map((cardType) => {
                const cards = deckPreviewByType[cardType];
                if (cards.length === 0) return null;
                return (
                  <div key={cardType} className="space-y-2">
                    <h3 className="text-sm font-medium text-neutral-300">
                      {CARD_TYPE_LABELS_PLURAL[cardType]}{" "}
                      <span className="font-normal text-neutral-500">({cards.length})</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {cards.map((card, index) => (
                        <BattleDeckCard
                          key={`${card.id}-${index}`}
                          card={characterToBattleCardFace(card)}
                          onClick={() => setViewingId(card.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          ) : null}

          {PICKER_CARD_TYPES.map((cardType) => (
            <section key={cardType} className="space-y-3">
              <div>
                <h2 className="text-lg font-medium text-neutral-100">
                  {CARD_TYPE_LABELS_PLURAL[cardType]}
                </h2>
                <p className="text-sm text-neutral-500">
                  {cardType === "unit"
                    ? "Frontline infantry — the core of your deck (~50%)."
                    : cardType === "event"
                      ? "Tactical actions, removal, and burst effects (~22%)."
                      : cardType === "location"
                        ? "Persistent field buffs — don't overfill your hand (~18%)."
                        : "High-impact heroes and finisher power (~10%)."}
                  {" "}
                  Target{" "}
                  {DEFAULT_DECK_COMPOSITION[cardType].min}–{DEFAULT_DECK_COMPOSITION[cardType].max} cards.
                  {typeCounts[cardType] > 0 ? (
                    <span className="text-neutral-400"> · {typeCounts[cardType]} selected</span>
                  ) : null}
                </p>
              </div>
              <CardGrid
                cards={catalogByType[cardType]}
                quantities={quantities}
                onAdjust={adjustQty}
                onInspect={setViewingId}
                emptyMessage={`No ${CARD_TYPE_LABELS_PLURAL[cardType].toLowerCase()} match the selected era.`}
              />
            </section>
          ))}
        </div>
      </div>

      {viewingCard ? (
        <CharacterCardModal
          character={{ ...viewingCard, owned: true, quantity: quantities.get(viewingCard.id) ?? 0 }}
          onClose={() => setViewingId(null)}
          footer={
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-neutral-400">
                In deck: {quantities.get(viewingCard.id) ?? 0}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustQty(viewingCard.id, -1, viewingCard.cardType)}
                  className="inline-flex items-center gap-1 rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800"
                >
                  <Minus size={14} /> Remove
                </button>
                <button
                  type="button"
                  onClick={() => adjustQty(viewingCard.id, 1, viewingCard.cardType)}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-amber-50 hover:bg-amber-600"
                >
                  <Plus size={14} /> Add copy
                </button>
              </div>
            </div>
          }
        />
      ) : null}
    </div>
  );
}

function DeckListItem({
  deck,
  active,
  onSelect,
  onDelete,
}: {
  deck: CatalogDeck;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onSelect}
        className={`flex flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${
          active ? "bg-neutral-800 text-neutral-100" : "text-neutral-400 hover:bg-neutral-900"
        }`}
      >
        {deck.imageUrl ? (
          <span className="relative h-8 w-6 shrink-0 overflow-hidden rounded bg-neutral-800">
            <Image src={deck.imageUrl} alt="" fill sizes="24px" className="object-cover" />
          </span>
        ) : (
          <span className="flex h-8 w-6 shrink-0 items-center justify-center rounded bg-neutral-800 text-neutral-600">
            <Layers size={12} />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate">{deck.name}</span>
          <span className="block text-xs text-neutral-500">
            {deck.totalCards}/40 {deck.active ? "" : "· inactive"}
            {deck.deckKind === "themed" && deck.price > 0 ? ` · ${deck.price} pts` : ""}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded p-2 text-neutral-500 hover:bg-neutral-900 hover:text-red-400"
        aria-label={`Delete ${deck.name}`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function CardGrid({
  cards,
  quantities,
  onAdjust,
  onInspect,
  emptyMessage,
}: {
  cards: CharacterWithEra[];
  quantities: Map<number, number>;
  onAdjust: (characterId: number, delta: number, cardType: Character["cardType"]) => void;
  onInspect: (characterId: number) => void;
  emptyMessage: string;
}) {
  if (cards.length === 0) {
    return <p className="text-sm text-neutral-500">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {cards.map((card) => {
        const qty = quantities.get(card.id) ?? 0;
        return (
          <div key={card.id} className="space-y-2">
            <BattleDeckCard
              card={characterToBattleCardFace(card)}
              highlight={qty > 0}
              highlightLabel={qty > 0 ? `×${qty}` : undefined}
              onClick={() => onInspect(card.id)}
            />
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onAdjust(card.id, -1, card.cardType)}
                disabled={qty === 0}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800 disabled:opacity-40"
                aria-label={`Remove ${card.name} from deck`}
              >
                <Minus size={14} />
              </button>
              <span className="min-w-[1.5rem] text-center text-sm text-neutral-300">{qty}</span>
              <button
                type="button"
                onClick={() => onAdjust(card.id, 1, card.cardType)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                aria-label={`Add ${card.name} to deck`}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
