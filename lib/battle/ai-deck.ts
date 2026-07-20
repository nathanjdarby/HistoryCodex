import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import {
  baselineDeckTargets,
  DECK_COMPOSITION_CARD_TYPES,
  type DeckCompositionRules,
} from "@/lib/battle/deck-composition";
import { validateDeckComposition } from "@/lib/battle/validators";
import type { BattleRules, CardSnapshot } from "@/lib/battle/types";

export type AiDeckBuildResult =
  | { ok: true; deck: CardSnapshot[] }
  | { ok: false; error: string };

function byType(pool: CardSnapshot[]) {
  const map: Record<string, CardSnapshot[]> = {
    unit: [],
    event: [],
    location: [],
    character: [],
  };
  for (const card of pool) {
    if (card.cardType in map) map[card.cardType]!.push(card);
  }
  return map;
}

export function buildAiDeckFromPool(
  pool: CardSnapshot[],
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): AiDeckBuildResult {
  if (!pool.some((c) => c.cardType === "location")) {
    return { ok: false, error: "AI card pool contains no Location cards." };
  }

  const byCard = byType(pool);
  const composition = rules.deckComposition;
  const targets = baselineDeckTargets();
  const deck: CardSnapshot[] = [];

  for (const type of DECK_COMPOSITION_CARD_TYPES) {
    const range = composition[type];
    let target = Math.min(targets[type], range.max);
    const available = byCard[type] ?? [];
    if (available.length === 0 && range.min > 0) {
      target = 0;
    }
    let added = 0;
    let idx = 0;
    while (added < target && deck.length < rules.deckSize) {
      if (available.length === 0) break;
      const card = available[idx % available.length]!;
      const copies = deck.filter((c) => c.characterId === card.characterId).length;
      if (copies < rules.maxCopiesPerCard) {
        deck.push(card);
        added++;
      }
      idx++;
      if (idx > available.length * rules.maxCopiesPerCard * 2) break;
    }
  }

  let fillIdx = 0;
  const fillOrder: (keyof DeckCompositionRules)[] = ["unit", "event", "character", "location"];
  const flat = [...pool];
  while (deck.length < rules.deckSize && flat.length > 0) {
    const card = flat[fillIdx % flat.length]!;
    const copies = deck.filter((c) => c.characterId === card.characterId).length;
    if (copies < rules.maxCopiesPerCard) deck.push(card);
    fillIdx++;
    if (fillIdx > flat.length * rules.maxCopiesPerCard * 4) break;
  }

  for (const type of fillOrder) {
    while (deck.length < rules.deckSize) {
      const candidates = byCard[type] ?? [];
      if (candidates.length === 0) break;
      const card = candidates[deck.length % candidates.length]!;
      const copies = deck.filter((c) => c.characterId === card.characterId).length;
      if (copies >= rules.maxCopiesPerCard) break;
      deck.push(card);
    }
  }

  if (deck.length !== rules.deckSize) {
    return {
      ok: false,
      error: `AI deck builder produced ${deck.length}/${rules.deckSize} cards.`,
    };
  }

  const typeCounts = DECK_COMPOSITION_CARD_TYPES.reduce(
    (acc, type) => {
      acc[type] = deck.filter((c) => c.cardType === type).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const entries = Object.entries(
    deck.reduce<Record<number, { quantity: number; cardType: string }>>((acc, c) => {
      acc[c.characterId] = acc[c.characterId] ?? { quantity: 0, cardType: c.cardType };
      acc[c.characterId]!.quantity++;
      return acc;
    }, {}),
  ).map(([id, v]) => ({
    characterId: Number(id),
    quantity: v.quantity,
    cardType: v.cardType,
  }));

  const validation = validateDeckComposition(entries, rules);
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join(" ") };
  }

  void typeCounts;
  return { ok: true, deck };
}
