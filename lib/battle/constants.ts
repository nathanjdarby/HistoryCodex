import type { DeckCompositionRules } from "@/lib/battle/deck-composition";
import { DEFAULT_DECK_COMPOSITION } from "@/lib/battle/deck-composition";
import type { BattleRules } from "@/lib/battle/types";

export const DEFAULT_BATTLE_RULES: BattleRules = {
  cpTrack: [50, 100, 150, 225, 300, 450],
  cpCap: 450,
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
  monarchAuraStacking: false,
  maxEventsPerTurn: 1,
  allowCpOverflow: false,
  leaderInfluenceBonus: 1,
  leaderBonusStacks: false,
  scholarBonusDrawCap: 2,
  maxEstablishInfluencePerTurn: 1,
  failedChronosDrawsToLose: 3,
};

export function cpForTurn(turnNumber: number, rules: BattleRules = DEFAULT_BATTLE_RULES): number {
  const index = Math.max(0, turnNumber - 1);
  if (index >= rules.cpTrack.length) return rules.cpCap;
  return Math.min(rules.cpTrack[index] ?? rules.cpCap, rules.cpCap);
}

export function applyCpGain(current: number, amount: number, rules: BattleRules): number {
  const next = current + amount;
  if (rules.allowCpOverflow) return next;
  return Math.min(next, rules.cpCap);
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
  return rules.deckSize - composition.location.min;
}

export function normalizeBattleRules(partial?: Partial<BattleRules>): BattleRules {
  return {
    ...DEFAULT_BATTLE_RULES,
    ...partial,
    cpTrack: partial?.cpTrack ?? DEFAULT_BATTLE_RULES.cpTrack,
    deckComposition: {
      ...DEFAULT_BATTLE_RULES.deckComposition,
      ...partial?.deckComposition,
      unit: { ...DEFAULT_BATTLE_RULES.deckComposition.unit, ...partial?.deckComposition?.unit },
      event: { ...DEFAULT_BATTLE_RULES.deckComposition.event, ...partial?.deckComposition?.event },
      location: {
        ...DEFAULT_BATTLE_RULES.deckComposition.location,
        ...partial?.deckComposition?.location,
      },
      character: {
        ...DEFAULT_BATTLE_RULES.deckComposition.character,
        ...partial?.deckComposition?.character,
      },
    },
  };
}
