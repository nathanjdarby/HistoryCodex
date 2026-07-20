import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  ABILITY_EFFECT_ENUM,
  ABILITY_TRIGGER_ENUM,
  CARD_TYPE_ENUM,
  RARITY_ENUM,
  characters,
  eras,
  pointsLedger,
  userCharacters,
} from "@/db/schema";
import { ApiError, slugify } from "@/lib/api-utils";
import { computeDefaultBattleStats } from "@/lib/battle";
import type { CardType } from "@/lib/battle/types";
import { RARITY_ORDER, type RarityTier } from "@/lib/rarity";
import type { Archetype } from "@/lib/sprite/generateSprite";

const FEATURED_RARITIES = ["rare", "epic", "legendary", "mythic"] as const;

const RARITY_SCORE: Record<RarityTier, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
};

export type FeaturedCharacter = {
  id: number;
  name: string;
  flavorText: string | null;
  seed: string;
  rarity: RarityTier;
  cardType: CardType;
  cost: number;
  attack: number;
  defense: number;
  archetype: Archetype | null;
  imageUrl: string | null;
  imageFocusX: number;
  imageFocusY: number;
  imageScale: number;
  holographic: boolean;
  abilityName: string | null;
  abilityEffect: (typeof ABILITY_EFFECT_ENUM)[number] | null;
  abilityValue: number | null;
  abilityTrigger: (typeof ABILITY_TRIGGER_ENUM)[number] | null;
  era: {
    id: number;
    name: string;
    colorPrimary: string;
    colorSecondary: string;
  };
};

export const characterInputSchema = z.object({
  eraId: z.number().int(),
  name: z.string().min(1).max(120),
  flavorText: z.string().max(280).nullable().optional(),
  rarity: z.enum(RARITY_ENUM),
  cardType: z.enum(CARD_TYPE_ENUM).optional(),
  holographic: z.boolean().optional(),
  cost: z.number().int().positive(),
  archetype: z.enum(["warrior", "scholar", "monarch", "merchant", "sailor", "leader"]).nullable().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  imageFocusX: z
    .number()
    .transform((value) => Math.round(value))
    .pipe(z.number().int().min(0).max(100))
    .optional(),
  imageFocusY: z
    .number()
    .transform((value) => Math.round(value))
    .pipe(z.number().int().min(0).max(100))
    .optional(),
  imageScale: z
    .number()
    .transform((value) => Math.round(value))
    .pipe(z.number().int().min(100).max(250))
    .optional(),
  attack: z.number().int().nonnegative().optional(),
  defense: z.number().int().nonnegative().optional(),
  abilityName: z.string().max(80).nullable().optional(),
  abilityEffect: z.enum(ABILITY_EFFECT_ENUM).nullable().optional(),
  abilityValue: z.number().int().nonnegative().nullable().optional(),
  abilityTrigger: z.enum(ABILITY_TRIGGER_ENUM).nullable().optional(),
});

export type CharacterInput = z.infer<typeof characterInputSchema>;

export async function getCharacter(id: number) {
  const [character] = await db.select().from(characters).where(eq(characters.id, id));
  if (!character) throw new ApiError(404, "Character not found");
  return character;
}

export async function createCharacter(input: CharacterInput) {
  const [era] = await db.select().from(eras).where(eq(eras.id, input.eraId));
  if (!era) throw new ApiError(400, "Era not found");

  const seed = `custom-${slugify(input.name)}-${randomUUID().slice(0, 8)}`;
  const defaults = computeDefaultBattleStats(input.rarity, input.archetype ?? null);
  const [created] = await db
    .insert(characters)
    .values({
      ...input,
      seed,
      cardType: input.cardType ?? "character",
      holographic: input.holographic ?? false,
      attack: input.attack ?? defaults.attack,
      defense: input.defense ?? defaults.defense,
      abilityName: input.abilityName === undefined ? defaults.abilityName : input.abilityName,
      abilityEffect:
        input.abilityEffect === undefined ? defaults.abilityEffect : input.abilityEffect,
      abilityValue:
        input.abilityValue === undefined ? defaults.abilityValue : input.abilityValue,
    })
    .returning();
  return created;
}

export async function updateCharacter(id: number, input: Partial<CharacterInput>) {
  await getCharacter(id);
  if (input.eraId !== undefined) {
    const [era] = await db.select().from(eras).where(eq(eras.id, input.eraId));
    if (!era) throw new ApiError(400, "Era not found");
  }
  const [updated] = await db
    .update(characters)
    .set(input)
    .where(eq(characters.id, id))
    .returning();
  return updated;
}

export async function deleteCharacter(id: number) {
  await getCharacter(id);
  await db.delete(userCharacters).where(eq(userCharacters.characterId, id));
  await db
    .update(pointsLedger)
    .set({ characterId: null })
    .where(eq(pointsLedger.characterId, id));
  await db.delete(characters).where(eq(characters.id, id));
}

export async function grantCardCopy(
  userId: number,
  characterId: number,
  sourceBookId?: number | null,
): Promise<number> {
  const [existing] = await db
    .select()
    .from(userCharacters)
    .where(and(eq(userCharacters.userId, userId), eq(userCharacters.characterId, characterId)));

  if (existing) {
    const quantity = existing.quantity + 1;
    await db
      .update(userCharacters)
      .set({ quantity })
      .where(eq(userCharacters.id, existing.id));
    return quantity;
  }

  await db.insert(userCharacters).values({
    userId,
    characterId,
    quantity: 1,
    sourceBookId: sourceBookId ?? null,
  });
  return 1;
}

export async function listCharacters(userId: number, eraId?: number) {
  const rows = await db
    .select({
      character: characters,
      era: eras,
      unlockedAt: userCharacters.unlockedAt,
      quantity: userCharacters.quantity,
    })
    .from(characters)
    .innerJoin(eras, eq(characters.eraId, eras.id))
    .leftJoin(
      userCharacters,
      and(eq(userCharacters.characterId, characters.id), eq(userCharacters.userId, userId)),
    )
    .where(eraId !== undefined ? eq(characters.eraId, eraId) : undefined)
    .orderBy(characters.cost);

  return rows.map((row) => ({
    ...row.character,
    era: row.era,
    owned: row.unlockedAt != null,
    quantity: row.unlockedAt != null ? row.quantity ?? 1 : 0,
    unlockedAt: row.unlockedAt,
  }));
}

function featuredScore(character: {
  rarity: RarityTier;
  imageUrl: string | null;
  holographic: boolean;
}) {
  let score = RARITY_SCORE[character.rarity] * 100;
  if (character.imageUrl) score += 50;
  if (character.holographic) score += 30;
  return score;
}

export async function listFeaturedCharacters(limit = 6): Promise<FeaturedCharacter[]> {
  const rows = await db
    .select({
      character: characters,
      era: eras,
    })
    .from(characters)
    .innerJoin(eras, eq(characters.eraId, eras.id))
    .where(inArray(characters.rarity, [...FEATURED_RARITIES]));

  const ranked = rows
    .map((row) => ({
      ...row.character,
      cardType: row.character.cardType as CardType,
      archetype: row.character.archetype as Archetype | null,
      rarity: row.character.rarity as RarityTier,
      era: {
        id: row.era.id,
        name: row.era.name,
        colorPrimary: row.era.colorPrimary,
        colorSecondary: row.era.colorSecondary,
      },
    }))
    .sort((a, b) => featuredScore(b) - featuredScore(a));

  const picked: FeaturedCharacter[] = [];
  const usedEras = new Set<number>();

  for (const character of ranked) {
    if (picked.length >= limit) break;
    if (usedEras.has(character.era.id)) continue;
    picked.push(character);
    usedEras.add(character.era.id);
  }

  for (const character of ranked) {
    if (picked.length >= limit) break;
    if (picked.some((entry) => entry.id === character.id)) continue;
    picked.push(character);
  }

  return picked.sort(
    (a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity),
  );
}
