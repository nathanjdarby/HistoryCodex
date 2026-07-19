import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import type { BattleRules } from "@/lib/battle/types";
import { getGameRules } from "@/lib/server/game-rules";

export { DEFAULT_BATTLE_RULES };

export async function getBattleRules(): Promise<BattleRules> {
  const rules = await getGameRules();
  return rules.battle;
}

export function parseBattleRulesJson(json: string | null | undefined): BattleRules {
  if (!json) return DEFAULT_BATTLE_RULES;
  try {
    const parsed = JSON.parse(json) as Partial<BattleRules>;
    return {
      ...DEFAULT_BATTLE_RULES,
      ...parsed,
      cpTrack: parsed.cpTrack ?? DEFAULT_BATTLE_RULES.cpTrack,
      deckComposition: {
        ...DEFAULT_BATTLE_RULES.deckComposition,
        ...parsed.deckComposition,
        unit: { ...DEFAULT_BATTLE_RULES.deckComposition.unit, ...parsed.deckComposition?.unit },
        event: { ...DEFAULT_BATTLE_RULES.deckComposition.event, ...parsed.deckComposition?.event },
        location: {
          ...DEFAULT_BATTLE_RULES.deckComposition.location,
          ...parsed.deckComposition?.location,
        },
        character: {
          ...DEFAULT_BATTLE_RULES.deckComposition.character,
          ...parsed.deckComposition?.character,
        },
      },
    };
  } catch {
    return DEFAULT_BATTLE_RULES;
  }
}

export function serializeBattleRules(rules: BattleRules): string {
  return JSON.stringify(rules);
}
