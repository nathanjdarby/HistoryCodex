import type { CardType } from "@/lib/card-types";
import { CARD_TYPE_LABELS_PLURAL } from "@/lib/card-types";

export type DeckTypeRange = { min: number; max: number };

export type DeckCompositionRules = Record<CardType, DeckTypeRange>;

/** Baseline 40-card strategy deck blueprint. */
export const DEFAULT_DECK_COMPOSITION: DeckCompositionRules = {
  unit: { min: 18, max: 20 },
  event: { min: 8, max: 10 },
  location: { min: 6, max: 8 },
  character: { min: 4, max: 5 },
};

export const DECK_COMPOSITION_CARD_TYPES: CardType[] = [
  "unit",
  "event",
  "location",
  "character",
];

export function deckCompositionFor(rules: {
  deckComposition?: DeckCompositionRules;
}): DeckCompositionRules {
  return rules.deckComposition ?? DEFAULT_DECK_COMPOSITION;
}

export function countCardsByType(
  entries: { quantity: number; cardType: string }[],
): Record<CardType, number> {
  const counts: Record<CardType, number> = {
    character: 0,
    unit: 0,
    event: 0,
    location: 0,
  };
  for (const entry of entries) {
    const type = entry.cardType as CardType;
    if (type in counts) counts[type] += entry.quantity;
  }
  return counts;
}

export function validateDeckTypeCounts(
  typeCounts: Record<CardType, number>,
  composition: DeckCompositionRules,
): string[] {
  const errors: string[] = [];

  for (const cardType of DECK_COMPOSITION_CARD_TYPES) {
    const count = typeCounts[cardType];
    const range = composition[cardType];
    const label = CARD_TYPE_LABELS_PLURAL[cardType];
    if (count < range.min) {
      errors.push(`${label}: need ${range.min}–${range.max} (currently ${count}).`);
    } else if (count > range.max) {
      errors.push(`${label}: max ${range.max} allowed (currently ${count}).`);
    }
  }

  return errors;
}

export function clampDeckQuantity(params: {
  cardType: CardType;
  currentQty: number;
  delta: number;
  typeCounts: Record<CardType, number>;
  totalCards: number;
  deckSize: number;
  maxCopiesPerCard: number;
  composition: DeckCompositionRules;
}): number {
  const maxForType = params.composition[params.cardType].max;
  const typeTotal = params.typeCounts[params.cardType];
  const typeSlots = maxForType - (typeTotal - params.currentQty);
  const deckSlots = params.deckSize - (params.totalCards - params.currentQty);

  const value = Math.max(
    0,
    Math.min(
      params.maxCopiesPerCard,
      params.currentQty + params.delta,
      params.currentQty + typeSlots,
      params.currentQty + deckSlots,
    ),
  );

  return value;
}

/** Suggested midpoint targets that sum to 40. */
export function baselineDeckTargets(): Record<CardType, number> {
  return {
    unit: 19,
    event: 9,
    location: 7,
    character: 5,
  };
}
