import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import {
  buildBalancedBattleStats,
  buildEventBalance,
  buildLocationBalance,
  COST_BY_RARITY,
  type CardBalanceDef,
} from "@/lib/server/card-balance";

export async function applyCardBalance(
  characterId: number,
  cardType: string,
  def: CardBalanceDef,
) {
  const cost = COST_BY_RARITY[def.rarity];
  const archetype = def.archetype ?? null;
  const profile = def.statProfile ?? "balanced";

  if (cardType === "location") {
    await db
      .update(characters)
      .set({
        rarity: def.rarity,
        cost,
        flavorText: def.flavorText,
        archetype: null,
        attack: 0,
        defense: 0,
        abilityTrigger: null,
        ...buildLocationBalance(
          def.rarity,
          def.locationBuffAdjust ?? 0,
          def.locationAbility,
        ),
      })
      .where(eq(characters.id, characterId));
    return;
  }

  if (cardType === "event") {
    if (!def.eventAbility) {
      throw new Error(`Event card #${characterId} is missing eventAbility definition`);
    }
    await db
      .update(characters)
      .set({
        flavorText: def.flavorText,
        ...buildEventBalance(def.rarity, def.eventAbility),
      })
      .where(eq(characters.id, characterId));
    return;
  }

  const stats = buildBalancedBattleStats(def.rarity, archetype, profile, {
    attackAdjust: def.attackAdjust,
    defenseAdjust: def.defenseAdjust,
  });

  const ability = def.customAbility ?? {
    abilityName: stats.abilityName,
    abilityEffect: stats.abilityEffect,
    abilityValue: stats.abilityValue,
    abilityTrigger: null,
  };

  await db
    .update(characters)
    .set({
      rarity: def.rarity,
      cost,
      flavorText: def.flavorText,
      archetype,
      attack: stats.attack,
      defense: stats.defense,
      abilityName: ability.abilityName,
      abilityEffect: ability.abilityEffect,
      abilityValue: ability.abilityValue,
      abilityTrigger: ability.abilityTrigger ?? null,
    })
    .where(eq(characters.id, characterId));
}
