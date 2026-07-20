"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Download, Layers, Plus, Save, Trash2 } from "lucide-react";
import type { Character } from "@/lib/types";
import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import {
  adjustDeckQuantity,
  autoFillBaselineDeck,
  autoFillBaselineMessage,
  isDeckPlayReady,
  typeCountsFromQuantities,
  totalDeckCards,
  validateDeckBuilderState,
} from "@/lib/client/deck-builder";
import { DeckCompositionBlueprint } from "@/components/deck-composition-blueprint";
import { CARD_TYPE_LABELS_PLURAL, type CardType } from "@/lib/card-types";

const DECK_SIZE = DEFAULT_BATTLE_RULES.deckSize;
const PICKER_CARD_TYPES: CardType[] = ["unit", "event", "location", "character"];

type StarterDeck = {
  id: number;
  name: string;
  description: string | null;
  eraName: string | null;
  totalCards: number;
  valid: boolean;
};

type Deck = {
  id: number;
  name: string;
  isDefault: boolean;
  totalCards: number;
  valid: boolean;
  validationErrors: string[];
  cards: { characterId: number; quantity: number; name: string; cardType: string; cost: number; rarity: string }[];
};

async function fetchStarterDecks(): Promise<StarterDeck[]> {
  const res = await fetch("/api/catalog-decks");
  if (!res.ok) throw new Error("Failed to load starter decks");
  return res.json();
}

async function fetchDecks(): Promise<Deck[]> {
  const res = await fetch("/api/decks");
  if (!res.ok) throw new Error("Failed to load decks");
  return res.json();
}

async function fetchCharacters(): Promise<(Character & { owned?: boolean; quantity?: number })[]> {
  const res = await fetch("/api/characters");
  if (!res.ok) throw new Error("Failed to load collection");
  return res.json();
}

export default function DeckBuilderPage() {
  const queryClient = useQueryClient();
  const { data: starterDecks } = useQuery({ queryKey: ["starter-decks"], queryFn: fetchStarterDecks });
  const { data: decks } = useQuery({ queryKey: ["decks"], queryFn: fetchDecks });
  const { data: characters } = useQuery({ queryKey: ["characters"], queryFn: fetchCharacters });

  const [activeDeckId, setActiveDeckId] = useState<number | "new">("new");
  const [name, setName] = useState("My Chronos Deck");
  const [quantities, setQuantities] = useState<Map<number, number>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const ownedByType = useMemo(
    () =>
      Object.fromEntries(
        PICKER_CARD_TYPES.map((cardType) => [
          cardType,
          (characters ?? []).filter(
            (c) => c.owned && c.quantity && c.quantity > 0 && c.cardType === cardType,
          ),
        ]),
      ) as Record<CardType, (Character & { owned?: boolean; quantity?: number })[]>,
    [characters],
  );

  const ownedCards = useMemo(
    () => PICKER_CARD_TYPES.flatMap((cardType) => ownedByType[cardType]),
    [ownedByType],
  );

  const typeCounts = useMemo(
    () => typeCountsFromQuantities(characters ?? [], quantities),
    [characters, quantities],
  );

  const totalCards = totalDeckCards(typeCounts);

  const clientValidationErrors = useMemo(
    () => validateDeckBuilderState(characters ?? [], quantities),
    [characters, quantities],
  );

  const deckReady = isDeckPlayReady(typeCounts, totalCards);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cards = [...quantities.entries()]
        .filter(([, qty]) => qty > 0)
        .map(([characterId, quantity]) => ({ characterId: Number(characterId), quantity: Number(quantity) }));

      if (cards.length === 0) {
        throw new Error("Add at least one card before saving.");
      }

      const payload = { name: name.trim(), isDefault: true, cards };
      const existing = activeDeckId !== "new" ? activeDeckId : null;
      const res = await fetch(existing ? `/api/decks/${existing}` : "/api/decks", {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save deck");
      }
      return res.json() as Promise<Deck>;
    },
    onSuccess: (deck) => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      setActiveDeckId(deck.id);
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const adoptMutation = useMutation({
    mutationFn: async (catalogDeckId: number) => {
      const res = await fetch(`/api/catalog-decks/${catalogDeckId}/adopt`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to add starter deck");
      }
      return res.json() as Promise<Deck>;
    },
    onSuccess: (deck) => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      loadDeck(deck);
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (deckId: number) => {
      const res = await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete deck");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      setActiveDeckId("new");
      setQuantities(new Map());
    },
  });

  function loadDeck(deck: Deck) {
    setActiveDeckId(deck.id);
    setName(deck.name);
    setQuantities(new Map(deck.cards.map((c) => [c.characterId, c.quantity])));
  }

  function adjustQty(characterId: number, delta: number) {
    const card = characters?.find((c) => c.id === characterId);
    setQuantities((prev) =>
      adjustDeckQuantity({
        characters: characters ?? [],
        quantities: prev,
        characterId,
        delta,
        maxOwned: card?.quantity,
      }),
    );
  }

  function autoFillDeck() {
    const next = autoFillBaselineDeck(characters ?? []);
    setQuantities(next);
    setError(autoFillBaselineMessage(characters ?? [], next));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Chronos"
        title="Deck Builder"
        description="Build a balanced 40-card deck using the baseline blueprint below."
        icon={Layers}
        actions={
          <p className="app-points-pill text-sm">
            Total {totalCards}/{DECK_SIZE}
          </p>
        }
      />
      <Link href="/play" className="app-link -mt-4 inline-block text-sm">
        ← Back to Play
      </Link>

      <DeckCompositionBlueprint typeCounts={typeCounts} />

      {error ? (
        <div className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {(starterDecks ?? []).length > 0 ? (
        <section className="space-y-3 rounded-lg border border-accent/35 bg-accent/10 p-4">
          <div>
            <h2 className="text-lg font-medium text-foreground">Starter decks</h2>
            <p className="text-sm text-gold-bright/70">
              Free pre-built decks — adds the cards you need to your collection and saves a ready-to-play list.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(starterDecks ?? []).map((starter) => (
              <div
                key={starter.id}
                className="flex flex-col justify-between gap-3 rounded-lg border border-accent/30 bg-background/40 p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{starter.name}</p>
                  {starter.eraName ? (
                    <p className="text-xs text-muted">{starter.eraName}</p>
                  ) : null}
                  {starter.description ? (
                    <p className="mt-2 text-sm text-muted">{starter.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted">
                    {starter.totalCards}/40 cards{starter.valid ? " · ready to play" : " · invalid"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!starter.valid || adoptMutation.isPending}
                  onClick={() => adoptMutation.mutate(starter.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-60"
                >
                  <Download size={14} />
                  {adoptMutation.isPending ? "Adding…" : "Add to my decks"}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {ownedCards.length === 0 ? (
        <div className="rounded-md border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-foreground">
          You don&apos;t own any playable cards yet. Add a starter deck above, or open packs on the{" "}
          <Link href="/packs" className="underline">
            Packs
          </Link>{" "}
          page first, then return here to build a deck.
        </div>
      ) : null}

      {clientValidationErrors.length > 0 && totalCards > 0 ? (
        <div className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-gold-bright">
          {clientValidationErrors[0]}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-2 rounded-lg border border-border bg-surface/40 p-3">
          <button
            type="button"
            onClick={() => {
              setActiveDeckId("new");
              setName("My Chronos Deck");
              setQuantities(new Map());
            }}
            className="flex w-full items-center gap-2 rounded-md border border-border-strong px-3 py-2 text-sm hover:bg-surface"
          >
            <Plus size={14} /> New deck
          </button>
          {(decks ?? []).map((deck) => (
            <div key={deck.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => loadDeck(deck)}
                className={`flex-1 rounded-md px-3 py-2 text-left text-sm ${
                  activeDeckId === deck.id ? "bg-surface-raised text-foreground" : "text-muted hover:bg-surface"
                }`}
              >
                {deck.name}
                <span className="block text-xs text-muted">
                  {deck.totalCards}/40 {deck.valid ? "✓" : "invalid"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deck.id)}
                className="rounded p-2 text-muted hover:bg-surface hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </aside>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="block flex-1 space-y-1">
              <span className="text-sm text-foreground/80">Deck name</span>
              <input
                className="w-full rounded-md border border-border-strong bg-background px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={saveMutation.isPending || quantities.size === 0 || !name.trim()}
              onClick={() => saveMutation.mutate()}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-60"
            >
              <Save size={14} />
              Save deck
            </button>
            {ownedCards.length > 0 ? (
              <button
                type="button"
                onClick={autoFillDeck}
                className="rounded-md border border-border-strong px-4 py-2 text-sm text-foreground hover:bg-surface"
              >
                Auto-fill from collection
              </button>
            ) : null}
          </div>

          {!deckReady ? (
            <div className="rounded-md border border-border bg-background/40 px-3 py-2 text-sm text-muted">
              {totalCards === 0
                ? "Add cards to your deck, or use Auto-fill if you have enough copies in your collection."
                : "Fill each card type to its target range (40 cards total). You can still save a draft."}
            </div>
          ) : (
            <div className="rounded-md border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300">
              Deck is ready to play ({DECK_SIZE}/{DECK_SIZE}).
            </div>
          )}

          {PICKER_CARD_TYPES.map((cardType) => (
            <section key={cardType} className="space-y-3">
              <div>
                <h2 className="text-lg font-medium text-foreground">
                  {CARD_TYPE_LABELS_PLURAL[cardType]}
                  {typeCounts[cardType] > 0 ? (
                    <span className="text-base font-normal text-muted">
                      {" "}
                      · {typeCounts[cardType]} selected
                    </span>
                  ) : null}
                </h2>
                <p className="text-sm text-muted">
                  Choose from your owned {CARD_TYPE_LABELS_PLURAL[cardType].toLowerCase()}.
                </p>
              </div>
              {ownedByType[cardType].length === 0 ? (
                <p className="text-sm text-muted">
                  You don&apos;t own any {CARD_TYPE_LABELS_PLURAL[cardType].toLowerCase()} yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {ownedByType[cardType].map((card) => {
                    const qty = quantities.get(card.id) ?? 0;
                    const maxOwned = card.quantity ?? 0;
                    return (
                      <DeckCardPicker
                        key={card.id}
                        card={card}
                        qty={qty}
                        maxOwned={maxOwned}
                        onAdjust={(delta) => adjustQty(card.id, delta)}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeckCardPicker({
  card,
  qty,
  maxOwned,
  onAdjust,
}: {
  card: Character;
  qty: number;
  maxOwned: number;
  onAdjust: (delta: number) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">{card.name}</p>
          <p className="text-xs capitalize text-muted">{card.cardType}</p>
        </div>
        <span className="text-xs text-muted">Own {maxOwned}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
        <span>{card.cost} CP</span>
        {card.cardType !== "event" && card.cardType !== "location" ? (
          <span>
            ATK {card.attack} · DEF {card.defense}
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-foreground/80">In deck: {qty}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onAdjust(-1)}
            className="rounded border border-border-strong px-2 py-1 text-sm"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => onAdjust(1)}
            className="rounded border border-border-strong px-2 py-1 text-sm"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
