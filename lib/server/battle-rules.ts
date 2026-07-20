import { DEFAULT_BATTLE_RULES, normalizeBattleRules } from "@/lib/battle/constants";
import type { BattleRules } from "@/lib/battle/types";

export { DEFAULT_BATTLE_RULES, normalizeBattleRules };

export async function getBattleRules(): Promise<BattleRules> {
  const { getGameRules } = await import("@/lib/server/game-rules");
  const rules = await getGameRules();
  return normalizeBattleRules(rules.battle);
}

export function parseBattleRulesJson(json: string | null | undefined): BattleRules {
  if (!json) return DEFAULT_BATTLE_RULES;
  try {
    const parsed = JSON.parse(json) as Partial<BattleRules>;
    return normalizeBattleRules(parsed);
  } catch {
    return DEFAULT_BATTLE_RULES;
  }
}

export function serializeBattleRules(rules: BattleRules): string {
  return JSON.stringify(normalizeBattleRules(rules));
}
