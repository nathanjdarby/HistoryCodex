import { and, eq, inArray, type InferSelectModel } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  boosterPacks,
  CARD_TYPE_ENUM,
  characters,
  eras,
  pointsLedger,
  userCharacters,
} from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { RARITY_ORDER, type RarityTier } from "@/lib/rarity";
import { getEraPointsBalance, spendEraPoints, spendGeneralPoints } from "@/lib/server/era-points";
import {
  assertValidPackPaymentMethod,
  defaultPackPaymentMethod,
  getPackPrices,
  type PackPaymentMethod,
  resolvePackPrice,
} from "@/lib/pack-pricing";
import { grantCardCopy } from "@/lib/server/characters";
import { getGameRules } from "@/lib/server/game-rules";
import { getUserStats } from "@/lib/server/stats";

const packConfigBaseSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullable().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  cardsPerPack: z.number().int().min(1).max(20).optional(),
  price: z.number().int().positive(),
  eraId: z.number().int().nullable().optional(),
  cardType: z.enum(CARD_TYPE_ENUM).nullable().optional(),
  weightCommon: z.number().int().nonnegative(),
  weightUncommon: z.number().int().nonnegative(),
  weightRare: z.number().int().nonnegative(),
  weightEpic: z.number().int().nonnegative(),
  weightLegendary: z.number().int().nonnegative(),
  weightMythic: z.number().int().nonnegative(),
  active: z.boolean().optional(),
});

const atLeastOneWeight = (v: {
  weightCommon: number;
  weightUncommon: number;
  weightRare: number;
  weightEpic: number;
  weightLegendary: number;
  weightMythic: number;
}) =>
  v.weightCommon +
    v.weightUncommon +
    v.weightRare +
    v.weightEpic +
    v.weightLegendary +
    v.weightMythic >
  0;
const weightRefineOptions = {
  message: "At least one rarity weight must be greater than 0",
  path: ["weightCommon"] as string[],
};

// Full create validation — all weight fields required, so "at least one > 0" is meaningful.
export const packConfigInputSchema = packConfigBaseSchema.refine(
  atLeastOneWeight,
  weightRefineOptions,
);

// Partial update validation — .partial() can't be called after .refine(), and a partial
// update may not touch weights at all, so the "at least one > 0" check only applies when
// every weight field is present in the same request (i.e. the admin form resubmitting all of them).
export const packConfigUpdateSchema = packConfigBaseSchema.partial().refine((v) => {
  const touchesAllWeights =
    v.weightCommon !== undefined &&
    v.weightUncommon !== undefined &&
    v.weightRare !== undefined &&
    v.weightEpic !== undefined &&
    v.weightLegendary !== undefined &&
    v.weightMythic !== undefined;
  if (!touchesAllWeights) return true;
  return atLeastOneWeight(v as Parameters<typeof atLeastOneWeight>[0]);
}, weightRefineOptions);

export type PackConfigInput = z.infer<typeof packConfigInputSchema>;
type PackConfig = InferSelectModel<typeof boosterPacks>;

export type PackConfigForShop = PackConfig & { eraName: string | null };

export type PackPoolCard = CharacterRow & {
  era: InferSelectModel<typeof eras>;
  owned: boolean;
  quantity: number;
};

export type PackDetailForShop = {
  pack: PackConfigForShop & { era: InferSelectModel<typeof eras> | null };
  eligibility: Awaited<ReturnType<typeof getPackEligibility>>;
  poolCards: PackPoolCard[];
  dropRates: Partial<Record<RarityTier, number>>;
};

function computeDropRates(
  config: PackConfig,
  poolCards: Array<{ rarity: string }>,
): Partial<Record<RarityTier, number>> {
  if (poolCards.length === 0) return {};

  const presentRarities = new Set(poolCards.map((card) => card.rarity as RarityTier));
  const weights = weightsFromConfig(config);
  const total = RARITY_ORDER.filter((rarity) => presentRarities.has(rarity)).reduce(
    (sum, rarity) => sum + weights[rarity],
    0,
  );
  if (total <= 0) return {};

  const rates: Partial<Record<RarityTier, number>> = {};
  for (const rarity of RARITY_ORDER) {
    if (!presentRarities.has(rarity)) continue;
    rates[rarity] = Math.round((weights[rarity] / total) * 1000) / 10;
  }
  return rates;
}

function defaultPackDescription(
  pack: PackConfigForShop & { era: InferSelectModel<typeof eras> | null },
  poolSize: number,
) {
  const eraLabel = pack.era?.name ?? pack.eraName ?? "history";
  const cardTypeLabel = pack.cardType ? `${pack.cardType} cards` : "collectible cards";
  return `Pull ${pack.cardsPerPack} ${cardTypeLabel} from ${eraLabel}. This pack draws from a pool of ${poolSize} unique card${poolSize === 1 ? "" : "s"} — build your collection, chase rare pulls, and strengthen your decks with duplicates.`;
}

async function attachEraNames(configs: PackConfig[]): Promise<PackConfigForShop[]> {
  if (configs.length === 0) return [];

  const eraIds = [...new Set(configs.map((config) => config.eraId).filter((id): id is number => id != null))];
  const eraRows =
    eraIds.length > 0
      ? await db.select({ id: eras.id, name: eras.name }).from(eras).where(inArray(eras.id, eraIds))
      : [];
  const eraNameById = new Map(eraRows.map((era) => [era.id, era.name]));

  return configs.map((config) => ({
    ...config,
    eraName: config.eraId != null ? eraNameById.get(config.eraId) ?? "Unknown era" : null,
  }));
}

export async function listPackConfigs() {
  return db.select().from(boosterPacks).orderBy(boosterPacks.id);
}

export async function listActivePackConfigs() {
  return db
    .select()
    .from(boosterPacks)
    .where(eq(boosterPacks.active, true))
    .orderBy(boosterPacks.id);
}

export async function listActivePackConfigsForShop() {
  return attachEraNames(await listActivePackConfigs());
}

export async function getPackConfig(id: number) {
  const [config] = await db.select().from(boosterPacks).where(eq(boosterPacks.id, id));
  if (!config) throw new ApiError(404, "Pack not found");
  return config;
}

async function assertEraExists(eraId: number) {
  const [era] = await db.select().from(eras).where(eq(eras.id, eraId));
  if (!era) throw new ApiError(400, "Era not found");
}

export async function createPackConfig(input: PackConfigInput) {
  if (input.eraId != null) await assertEraExists(input.eraId);
  const [created] = await db
    .insert(boosterPacks)
    .values({
      ...input,
      cardsPerPack: input.cardsPerPack ?? 10,
    })
    .returning();
  return created;
}

export async function updatePackConfig(id: number, input: Partial<PackConfigInput>) {
  await getPackConfig(id);
  if (input.eraId != null) await assertEraExists(input.eraId);
  const [updated] = await db
    .update(boosterPacks)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(boosterPacks.id, id))
    .returning();
  return updated;
}

export async function deletePackConfig(id: number) {
  await getPackConfig(id);
  await db
    .update(pointsLedger)
    .set({ packConfigId: null })
    .where(eq(pointsLedger.packConfigId, id));
  await db.delete(boosterPacks).where(eq(boosterPacks.id, id));
}

function weightsFromConfig(config: PackConfig): Record<RarityTier, number> {
  return {
    common: config.weightCommon,
    uncommon: config.weightUncommon,
    rare: config.weightRare,
    epic: config.weightEpic,
    legendary: config.weightLegendary,
    mythic: config.weightMythic,
  };
}

function pickWeightedRarity(
  available: Partial<Record<RarityTier, number>>,
  weights: Record<RarityTier, number>,
): RarityTier {
  const entries = RARITY_ORDER.filter((r) => (available[r] ?? 0) > 0).map(
    (r) => [r, weights[r]] as const,
  );
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of entries) {
    if (roll < weight) return rarity;
    roll -= weight;
  }
  return entries[entries.length - 1][0];
}

type CharacterRow = InferSelectModel<typeof characters>;

function buildEligiblePool(config: PackConfig) {
  const conditions = [];
  if (config.eraId != null) conditions.push(eq(characters.eraId, config.eraId));
  if (config.cardType != null) conditions.push(eq(characters.cardType, config.cardType));

  return db
    .select()
    .from(characters)
    .where(conditions.length ? and(...conditions) : undefined);
}

async function pickOneCharacter(config: PackConfig): Promise<CharacterRow> {
  const eligible = await buildEligiblePool(config);
  if (eligible.length === 0) {
    throw new ApiError(400, "No eligible cards remain for this pack.");
  }

  const byRarity: Partial<Record<RarityTier, CharacterRow[]>> = {};
  for (const character of eligible) {
    (byRarity[character.rarity] ??= []).push(character);
  }
  const availableCounts = Object.fromEntries(
    Object.entries(byRarity).map(([rarity, list]) => [rarity, list!.length]),
  ) as Partial<Record<RarityTier, number>>;

  const rarity = pickWeightedRarity(availableCounts, weightsFromConfig(config));
  const pool = byRarity[rarity]!;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function openPack(
  userId: number,
  packConfigId: number,
  paymentMethod?: PackPaymentMethod,
) {
  const config = await getPackConfig(packConfigId);
  if (!config.active) {
    throw new ApiError(400, "This pack is not currently available.");
  }

  const method = paymentMethod ?? defaultPackPaymentMethod(config);
  try {
    assertValidPackPaymentMethod(config, method);
  } catch (error) {
    throw new ApiError(400, error instanceof Error ? error.message : "Invalid payment method.");
  }

  const price = resolvePackPrice(config, method, (await getGameRules()).packGeneralMultiplier);
  const stats = await getUserStats(userId);

  if (method === "era" && config.eraId != null) {
    const eraBalance = await getEraPointsBalance(userId, config.eraId);
    if (eraBalance < price) {
      const [era] = await db.select({ name: eras.name }).from(eras).where(eq(eras.id, config.eraId));
      throw new ApiError(
        400,
        `Not enough ${era?.name ?? "era"} points — you have ${eraBalance}, this pack costs ${price}.`,
      );
    }
  } else if (stats.pointsBalance < price) {
    throw new ApiError(400, `Not enough points — this pack costs ${price} points.`);
  }

  const eligibility = await getPackEligibility(userId, packConfigId);
  if (eligibility.poolSize === 0) {
    throw new ApiError(400, "No cards are configured for this pack.");
  }

  const pulled: Array<CharacterRow & { quantity: number }> = [];

  for (let i = 0; i < config.cardsPerPack; i++) {
    const picked = await pickOneCharacter(config);
    const quantity = await grantCardCopy(userId, picked.id);
    pulled.push({ ...picked, quantity });
  }

  await db.insert(pointsLedger).values({
    userId,
    type: "spend_pack",
    points: -price,
    eraId: method === "era" && config.eraId != null ? config.eraId : null,
    characterId: pulled[0]?.id ?? null,
    packConfigId: config.id,
    metadata:
      config.eraId != null ? JSON.stringify({ paymentMethod: method, packEraId: config.eraId }) : null,
  });

  if (method === "era" && config.eraId != null) {
    await spendEraPoints(userId, config.eraId, price);
  } else {
    await spendGeneralPoints(userId, price);
  }

  const charactersWithEra = await Promise.all(
    pulled.map(async ({ quantity, ...character }) => {
      const [pickedEra] = await db.select().from(eras).where(eq(eras.id, character.eraId));
      return { ...character, era: pickedEra, quantity };
    }),
  );

  return {
    characters: charactersWithEra,
    stats: await getUserStats(userId),
    paymentMethod: method,
    pricePaid: price,
  };
}

export async function getPackEligibility(userId: number, packConfigId: number) {
  const config = await getPackConfig(packConfigId);

  const conditions = [];
  if (config.eraId != null) conditions.push(eq(characters.eraId, config.eraId));
  if (config.cardType != null) conditions.push(eq(characters.cardType, config.cardType));

  const poolRows = await db
    .select({ id: characters.id })
    .from(characters)
    .where(conditions.length ? and(...conditions) : undefined);

  const stats = await getUserStats(userId);
  const rules = await getGameRules();
  const prices = getPackPrices(config, rules.packGeneralMultiplier);

  return {
    remaining: poolRows.length,
    poolSize: poolRows.length,
    cardsPerPack: config.cardsPerPack,
    price: prices.eraPrice ?? prices.generalPrice,
    eraPrice: prices.eraPrice,
    generalPrice: prices.generalPrice,
    active: config.active,
    eraId: config.eraId,
    eraPointsBalance:
      config.eraId != null ? await getEraPointsBalance(userId, config.eraId) : null,
    globalPointsBalance: stats.pointsBalance,
    defaultPaymentMethod: defaultPackPaymentMethod(config),
  };
}

export async function getPackDetailForShop(
  userId: number,
  packConfigId: number,
): Promise<PackDetailForShop> {
  const config = await getPackConfig(packConfigId);
  if (!config.active) {
    throw new ApiError(404, "Pack not found");
  }

  const [packSummary] = await attachEraNames([config]);
  const era =
    config.eraId != null
      ? (await db.select().from(eras).where(eq(eras.id, config.eraId)))[0] ?? null
      : null;

  const conditions = [];
  if (config.eraId != null) conditions.push(eq(characters.eraId, config.eraId));
  if (config.cardType != null) conditions.push(eq(characters.cardType, config.cardType));

  const poolRows = await db
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
    .where(conditions.length ? and(...conditions) : undefined);

  const poolCards: PackPoolCard[] = poolRows
    .map((row) => ({
      ...row.character,
      era: row.era,
      owned: row.unlockedAt != null,
      quantity: row.unlockedAt != null ? row.quantity ?? 1 : 0,
    }))
    .sort((a, b) => {
      const rarityDiff =
        RARITY_ORDER.indexOf(b.rarity as RarityTier) -
        RARITY_ORDER.indexOf(a.rarity as RarityTier);
      if (rarityDiff !== 0) return rarityDiff;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

  const eligibility = await getPackEligibility(userId, packConfigId);
  const dropRates = computeDropRates(config, poolCards);
  const pack = {
    ...packSummary,
    era,
    description:
      packSummary.description?.trim() ||
      defaultPackDescription({ ...packSummary, era }, poolCards.length),
  };

  return {
    pack,
    eligibility,
    poolCards,
    dropRates,
  };
}
