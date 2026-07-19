import { sql } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import {
  ABILITY_EFFECT_CATALOG,
  ABILITY_TRIGGER_CATALOG,
  ABILITY_VALUE_MATH,
  ARCHETYPE_PASSIVE_CATALOG,
} from "@/lib/battle/ability-catalog";

export type AbilityUsageRow = {
  abilityEffect: string;
  abilityTrigger: string | null;
  cardType: string;
  count: number;
};

export type NamedAbilityUsageRow = {
  abilityName: string;
  abilityEffect: string | null;
  abilityTrigger: string | null;
  cardType: string;
  count: number;
};

export async function getAbilityAdminCatalog() {
  const usageRows = await db
    .select({
      abilityEffect: characters.abilityEffect,
      abilityTrigger: characters.abilityTrigger,
      cardType: characters.cardType,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(characters)
    .where(sql`${characters.abilityEffect} is not null or ${characters.abilityName} is not null`)
    .groupBy(characters.abilityEffect, characters.abilityTrigger, characters.cardType);

  const namedRows = await db
    .select({
      abilityName: characters.abilityName,
      abilityEffect: characters.abilityEffect,
      abilityTrigger: characters.abilityTrigger,
      cardType: characters.cardType,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(characters)
    .where(sql`${characters.abilityName} is not null`)
    .groupBy(
      characters.abilityName,
      characters.abilityEffect,
      characters.abilityTrigger,
      characters.cardType,
    )
    .orderBy(sql`count(*) desc`, characters.abilityName);

  const totalWithAbility = usageRows.reduce((sum, row) => sum + row.count, 0);

  return {
    effects: ABILITY_EFFECT_CATALOG,
    triggers: ABILITY_TRIGGER_CATALOG,
    archetypePassives: ARCHETYPE_PASSIVE_CATALOG,
    valueMath: ABILITY_VALUE_MATH,
    usage: usageRows as AbilityUsageRow[],
    namedUsage: namedRows as NamedAbilityUsageRow[],
    totals: {
      cardsWithAbility: totalWithAbility,
      distinctNamedAbilities: namedRows.length,
    },
  };
}
