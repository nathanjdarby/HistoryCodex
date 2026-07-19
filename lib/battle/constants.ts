import type { BattleRules } from "@/lib/battle/types";
import { DEFAULT_DECK_COMPOSITION } from "@/lib/battle/deck-composition";

export const DEFAULT_BATTLE_RULES: BattleRules = {
  cpTrack: [50, 100, 150, 200, 300],
  cpCap: 300,
  deckSize: 40,
  openingHandSize: 5,
  maxCopiesPerCard: 3,
  activeLaneCount: 1,
  influenceToCapture: 3,
  locationsToWin: 3,
  locationsInDeck: DEFAULT_DECK_COMPOSITION.location.min,
  deckComposition: DEFAULT_DECK_COMPOSITION,
  merchantRefundCp: 20,
  monarchAuraAttack: 10,
  maxEventsPerTurn: 1,
};

export function cpForTurn(turnNumber: number, rules: BattleRules = DEFAULT_BATTLE_RULES): number {
  const index = Math.max(0, turnNumber - 1);
  if (index >= rules.cpTrack.length) return rules.cpCap;
  return rules.cpTrack[index] ?? rules.cpCap;
}

export const HIGH_RARITIES = new Set(["epic", "legendary", "mythic"]);

export function isMainDeckType(cardType: string): boolean {
  return cardType === "character" || cardType === "unit" || cardType === "event";
}

export function isLocationDeckType(cardType: string): boolean {
  return cardType === "location";
}

/** Main Chronos deck cards (character, unit, event). */
export function isPlayableDeckType(cardType: string): boolean {
  return isMainDeckType(cardType);
}

export function mainDeckSize(rules: BattleRules = DEFAULT_BATTLE_RULES): number {
  const composition = rules.deckComposition ?? DEFAULT_DECK_COMPOSITION;
  return (
    rules.deckSize -
    composition.location.min
  );
}
