import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import {
  baselineDeckTargets,
  clampDeckQuantity,
  countCardsByType,
  deckCompositionFor,
  DECK_COMPOSITION_CARD_TYPES,
  DEFAULT_DECK_COMPOSITION,
  validateDeckTypeCounts,
} from "@/lib/battle/deck-composition";
import { validateDeckComposition } from "@/lib/battle/validators";
import type { CardType } from "@/lib/card-types";

type CardLike = { id: number; cardType: string; quantity?: number; owned?: boolean; name?: string };

export function typeCountsFromQuantities(
  characters: CardLike[],
  quantities: Map<number, number>,
): Record<CardType, number> {
  const entries = [...quantities.entries()]
    .filter(([, qty]) => qty > 0)
    .map(([characterId, quantity]) => {
      const card = characters.find((c) => c.id === characterId);
      return {
        characterId,
        quantity,
        cardType: card?.cardType ?? "character",
      };
    });
  return countCardsByType(entries);
}

export function totalDeckCards(typeCounts: Record<CardType, number>) {
  return DECK_COMPOSITION_CARD_TYPES.reduce((sum, type) => sum + typeCounts[type], 0);
}

export function adjustDeckQuantity(params: {
  characters: CardLike[];
  quantities: Map<number, number>;
  characterId: number;
  delta: number;
  maxOwned?: number;
}): Map<number, number> {
  const card = params.characters.find((c) => c.id === params.characterId);
  if (!card) return params.quantities;

  const cardType = card.cardType as CardType;
  const currentQty = params.quantities.get(params.characterId) ?? 0;
  const typeCounts = typeCountsFromQuantities(params.characters, params.quantities);
  const totalCards = totalDeckCards(typeCounts);
  const composition = DEFAULT_DECK_COMPOSITION;

  let value = clampDeckQuantity({
    cardType,
    currentQty,
    delta: params.delta,
    typeCounts,
    totalCards,
    deckSize: DEFAULT_BATTLE_RULES.deckSize,
    maxCopiesPerCard: DEFAULT_BATTLE_RULES.maxCopiesPerCard,
    composition,
  });

  if (params.maxOwned != null) {
    value = Math.min(value, params.maxOwned);
  }

  const next = new Map(params.quantities);
  if (value === 0) next.delete(params.characterId);
  else next.set(params.characterId, value);
  return next;
}

export function validateDeckBuilderState(
  characters: CardLike[],
  quantities: Map<number, number>,
): string[] {
  const errors: string[] = [];
  const entries = [...quantities.entries()]
    .filter(([, qty]) => qty > 0)
    .map(([characterId, quantity]) => {
      const card = characters.find((c) => c.id === characterId);
      return {
        characterId,
        quantity,
        cardType: card?.cardType ?? "character",
      };
    });

  if (entries.length === 0) {
    errors.push("Add at least one card to the deck.");
    return errors;
  }

  for (const entry of entries) {
    const card = characters.find((c) => c.id === entry.characterId);
    if (card?.owned === false) {
      errors.push(`${card.name ?? "Card"} is not in your collection.`);
    }
    const maxOwned = card?.quantity;
    if (maxOwned != null && entry.quantity > maxOwned) {
      errors.push(`You only own ${maxOwned} copy/copies of ${card?.name ?? "that card"}.`);
    }
  }

  const result = validateDeckComposition(entries, DEFAULT_BATTLE_RULES);
  return [...errors, ...result.errors];
}

export function isDeckPlayReady(typeCounts: Record<CardType, number>, totalCards: number) {
  if (totalCards !== DEFAULT_BATTLE_RULES.deckSize) return false;
  return validateDeckTypeCounts(typeCounts, DEFAULT_DECK_COMPOSITION).length === 0;
}

export function autoFillBaselineDeck(characters: CardLike[], ownedOnly = true): Map<number, number> {
  const targets = baselineDeckTargets();
  const next = new Map<number, number>();

  for (const cardType of DECK_COMPOSITION_CARD_TYPES) {
    let remaining = targets[cardType];
    const pool = characters.filter(
      (c) =>
        c.cardType === cardType &&
        (!ownedOnly || (c.owned !== false && (c.quantity ?? 0) > 0)),
    );

    for (const card of pool) {
      if (remaining <= 0) break;
      const maxOwned = ownedOnly ? (card.quantity ?? 0) : 3;
      const maxCopies = Math.min(DEFAULT_BATTLE_RULES.maxCopiesPerCard, maxOwned);
      const toAdd = Math.min(maxCopies, remaining);
      if (toAdd > 0) {
        next.set(card.id, toAdd);
        remaining -= toAdd;
      }
    }
  }

  return next;
}

export function autoFillBaselineMessage(
  characters: CardLike[],
  quantities: Map<number, number>,
): string | null {
  const typeCounts = typeCountsFromQuantities(characters, quantities);
  const totalCards = totalDeckCards(typeCounts);
  if (isDeckPlayReady(typeCounts, totalCards)) return null;

  const targets = baselineDeckTargets();
  const parts = DECK_COMPOSITION_CARD_TYPES.map(
    (cardType) => `${typeCounts[cardType]}/${targets[cardType]}`,
  );
  return `Auto-filled ${totalCards}/40 (${parts.join(" · ")}). Open more packs if you need additional copies.`;
}

export function compositionProgress(typeCounts: Record<CardType, number>) {
  const composition = deckCompositionFor(DEFAULT_BATTLE_RULES);
  return DECK_COMPOSITION_CARD_TYPES.map((cardType) => {
    const count = typeCounts[cardType];
    const range = composition[cardType];
    const inRange = count >= range.min && count <= range.max;
    const atMax = count >= range.max;
    return { cardType, count, range, inRange, atMax };
  });
}

export { DEFAULT_DECK_COMPOSITION, DECK_COMPOSITION_CARD_TYPES, validateDeckTypeCounts };
