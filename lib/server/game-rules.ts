import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { gameRules } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import type { BattleRules } from "@/lib/battle/types";
import { parseBattleRulesJson, serializeBattleRules, normalizeBattleRules } from "@/lib/server/battle-rules";

export type GameRules = {
  milestones: number[];
  pointsPerMilestone: number;
  dailyPointCap: number;
  weeklyPointCap: number;
  packGeneralMultiplier: number;
  minSecondsPerPage: number;
  softSecondsPerPage: number;
  maxWpm: number;
  softWpm: number;
  bulkPageJumpThreshold: number;
  minTrustForInstantAward: number;
  trustDecayPerFlag: number;
  trustGainOnApprove: number;
  battle: BattleRules;
  updatedAt: Date | null;
};

export const DEFAULT_GAME_RULES: GameRules = {
  milestones: [25, 50, 75, 100],
  pointsPerMilestone: 25,
  dailyPointCap: 150,
  weeklyPointCap: 600,
  packGeneralMultiplier: 1.25,
  minSecondsPerPage: 90,
  softSecondsPerPage: 120,
  maxWpm: 400,
  softWpm: 300,
  bulkPageJumpThreshold: 50,
  minTrustForInstantAward: 70,
  trustDecayPerFlag: 10,
  trustGainOnApprove: 5,
  battle: DEFAULT_BATTLE_RULES,
  updatedAt: null,
};

let cachedRules: GameRules = DEFAULT_GAME_RULES;

export const gameRulesInputSchema = z
  .object({
    milestones: z.array(z.number().int().min(1).max(100)).min(1).max(10),
    pointsPerMilestone: z.number().int().min(1).max(1000),
    dailyPointCap: z.number().int().min(1).max(10000),
    weeklyPointCap: z.number().int().min(1).max(50000),
    packGeneralMultiplier: z.number().min(1).max(5),
    minSecondsPerPage: z.number().int().min(1).max(600),
    softSecondsPerPage: z.number().int().min(1).max(600),
    maxWpm: z.number().int().min(50).max(2000),
    softWpm: z.number().int().min(50).max(2000),
    bulkPageJumpThreshold: z.number().int().min(1).max(500),
    minTrustForInstantAward: z.number().int().min(0).max(100),
    trustDecayPerFlag: z.number().int().min(0).max(100),
    trustGainOnApprove: z.number().int().min(0).max(100),
    battleCpTrack: z.array(z.number().int().min(1).max(1000)).min(1).max(10),
    battleCpCap: z.number().int().min(1).max(2000),
    battleDeckSize: z.number().int().min(10).max(60),
    battleOpeningHandSize: z.number().int().min(1).max(10),
    battleMaxCopiesPerCard: z.number().int().min(1).max(4),
    battleInfluenceToCapture: z.number().int().min(1).max(10),
    battleLocationsToWin: z.number().int().min(1).max(10),
    battleMerchantRefundCp: z.number().int().min(0).max(200),
    battleMonarchAuraAttack: z.number().int().min(0).max(100),
    battleMaxEventsPerTurn: z.number().int().min(0).max(5),
    battleAllowCpOverflow: z.boolean().optional(),
    battleLeaderInfluenceBonus: z.number().int().min(0).max(5).optional(),
    battleLeaderBonusStacks: z.boolean().optional(),
    battleMonarchAuraStacking: z.boolean().optional(),
    battleScholarBonusDrawCap: z.number().int().min(0).max(10).optional(),
    battleMaxEstablishInfluencePerTurn: z.number().int().min(0).max(3).optional(),
    battleFailedChronosDrawsToLose: z.number().int().min(1).max(10).optional(),
  })
  .refine((data) => data.softSecondsPerPage >= data.minSecondsPerPage, {
    message: "Soft seconds per page must be at least the minimum.",
  })
  .refine((data) => data.maxWpm >= data.softWpm, {
    message: "Max WPM must be at least the soft WPM.",
  })
  .refine((data) => data.weeklyPointCap >= data.dailyPointCap, {
    message: "Weekly cap must be at least the daily cap.",
  })
  .refine(
    (data) => {
      const sorted = [...data.milestones].sort((a, b) => a - b);
      return sorted.every((value, index) => index === 0 || value > sorted[index - 1]!);
    },
    { message: "Milestones must be unique and ascending." },
  );

export type GameRulesInput = z.infer<typeof gameRulesInputSchema>;

function rowToRules(row: typeof gameRules.$inferSelect): GameRules {
  let milestones: number[];
  try {
    const parsed = JSON.parse(row.milestonesJson);
    if (!Array.isArray(parsed)) throw new Error("invalid milestones");
    milestones = parsed.map(Number);
  } catch {
    milestones = DEFAULT_GAME_RULES.milestones;
  }

  return {
    milestones,
    pointsPerMilestone: row.pointsPerMilestone,
    dailyPointCap: row.dailyPointCap,
    weeklyPointCap: row.weeklyPointCap,
    packGeneralMultiplier: row.packGeneralMultiplier,
    minSecondsPerPage: row.minSecondsPerPage,
    softSecondsPerPage: row.softSecondsPerPage,
    maxWpm: row.maxWpm,
    softWpm: row.softWpm,
    bulkPageJumpThreshold: row.bulkPageJumpThreshold,
    minTrustForInstantAward: row.minTrustForInstantAward,
    trustDecayPerFlag: row.trustDecayPerFlag,
    trustGainOnApprove: row.trustGainOnApprove,
    battle: parseBattleRulesJson(row.battleRulesJson),
    updatedAt: row.updatedAt,
  };
}

function battleFromInput(input: GameRulesInput): BattleRules {
  return normalizeBattleRules({
    cpTrack: input.battleCpTrack,
    cpCap: input.battleCpCap,
    deckSize: input.battleDeckSize,
    openingHandSize: input.battleOpeningHandSize,
    maxCopiesPerCard: input.battleMaxCopiesPerCard,
    activeLaneCount: DEFAULT_BATTLE_RULES.activeLaneCount,
    influenceToCapture: input.battleInfluenceToCapture,
    locationsToWin: input.battleLocationsToWin,
    merchantRefundCp: input.battleMerchantRefundCp,
    monarchAuraAttack: input.battleMonarchAuraAttack,
    monarchAuraStacking: input.battleMonarchAuraStacking ?? DEFAULT_BATTLE_RULES.monarchAuraStacking,
    maxEventsPerTurn: input.battleMaxEventsPerTurn,
    allowCpOverflow: input.battleAllowCpOverflow ?? DEFAULT_BATTLE_RULES.allowCpOverflow,
    leaderInfluenceBonus: input.battleLeaderInfluenceBonus ?? DEFAULT_BATTLE_RULES.leaderInfluenceBonus,
    leaderBonusStacks: input.battleLeaderBonusStacks ?? DEFAULT_BATTLE_RULES.leaderBonusStacks,
    scholarBonusDrawCap: input.battleScholarBonusDrawCap ?? DEFAULT_BATTLE_RULES.scholarBonusDrawCap,
    maxEstablishInfluencePerTurn:
      input.battleMaxEstablishInfluencePerTurn ?? DEFAULT_BATTLE_RULES.maxEstablishInfluencePerTurn,
    failedChronosDrawsToLose:
      input.battleFailedChronosDrawsToLose ?? DEFAULT_BATTLE_RULES.failedChronosDrawsToLose,
  });
}

function normalizeMilestones(milestones: number[]) {
  return [...milestones].sort((a, b) => a - b);
}

async function ensureDefaultGameRules() {
  const [existing] = await db.select().from(gameRules).where(eq(gameRules.id, 1));
  if (existing) return rowToRules(existing);

  const defaults = DEFAULT_GAME_RULES;
  await db.insert(gameRules).values({
    id: 1,
    milestonesJson: JSON.stringify(defaults.milestones),
    pointsPerMilestone: defaults.pointsPerMilestone,
    dailyPointCap: defaults.dailyPointCap,
    weeklyPointCap: defaults.weeklyPointCap,
    packGeneralMultiplier: defaults.packGeneralMultiplier,
    minSecondsPerPage: defaults.minSecondsPerPage,
    softSecondsPerPage: defaults.softSecondsPerPage,
    maxWpm: defaults.maxWpm,
    softWpm: defaults.softWpm,
    bulkPageJumpThreshold: defaults.bulkPageJumpThreshold,
    minTrustForInstantAward: defaults.minTrustForInstantAward,
    trustDecayPerFlag: defaults.trustDecayPerFlag,
    trustGainOnApprove: defaults.trustGainOnApprove,
    battleRulesJson: serializeBattleRules(defaults.battle),
  });

  return defaults;
}

export function getGameRulesSync(): GameRules {
  return cachedRules;
}

export async function getGameRules(): Promise<GameRules> {
  const rules = await ensureDefaultGameRules();
  cachedRules = rules;
  return rules;
}

export async function updateGameRules(input: GameRulesInput): Promise<GameRules> {
  const milestones = normalizeMilestones(input.milestones);
  const battle = battleFromInput(input);
  const now = new Date();

  await db
    .insert(gameRules)
    .values({
      id: 1,
      milestonesJson: JSON.stringify(milestones),
      pointsPerMilestone: input.pointsPerMilestone,
      dailyPointCap: input.dailyPointCap,
      weeklyPointCap: input.weeklyPointCap,
      packGeneralMultiplier: input.packGeneralMultiplier,
      minSecondsPerPage: input.minSecondsPerPage,
      softSecondsPerPage: input.softSecondsPerPage,
      maxWpm: input.maxWpm,
      softWpm: input.softWpm,
      bulkPageJumpThreshold: input.bulkPageJumpThreshold,
      minTrustForInstantAward: input.minTrustForInstantAward,
      trustDecayPerFlag: input.trustDecayPerFlag,
      trustGainOnApprove: input.trustGainOnApprove,
      battleRulesJson: serializeBattleRules(battle),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: gameRules.id,
      set: {
        milestonesJson: JSON.stringify(milestones),
        pointsPerMilestone: input.pointsPerMilestone,
        dailyPointCap: input.dailyPointCap,
        weeklyPointCap: input.weeklyPointCap,
        packGeneralMultiplier: input.packGeneralMultiplier,
        minSecondsPerPage: input.minSecondsPerPage,
        softSecondsPerPage: input.softSecondsPerPage,
        maxWpm: input.maxWpm,
        softWpm: input.softWpm,
        bulkPageJumpThreshold: input.bulkPageJumpThreshold,
        minTrustForInstantAward: input.minTrustForInstantAward,
        trustDecayPerFlag: input.trustDecayPerFlag,
        trustGainOnApprove: input.trustGainOnApprove,
        battleRulesJson: serializeBattleRules(battle),
        updatedAt: now,
      },
    });

  cachedRules = {
    milestones,
    pointsPerMilestone: input.pointsPerMilestone,
    dailyPointCap: input.dailyPointCap,
    weeklyPointCap: input.weeklyPointCap,
    packGeneralMultiplier: input.packGeneralMultiplier,
    minSecondsPerPage: input.minSecondsPerPage,
    softSecondsPerPage: input.softSecondsPerPage,
    maxWpm: input.maxWpm,
    softWpm: input.softWpm,
    bulkPageJumpThreshold: input.bulkPageJumpThreshold,
    minTrustForInstantAward: input.minTrustForInstantAward,
    trustDecayPerFlag: input.trustDecayPerFlag,
    trustGainOnApprove: input.trustGainOnApprove,
    battle,
    updatedAt: now,
  };
  return cachedRules;
}

export function milestoneTypeForPercent(percent: number): `milestone_${number}` | null {
  const rules = getGameRulesSync();
  if (!rules.milestones.includes(percent)) return null;
  return `milestone_${percent}`;
}

export function maxPointsPerBook(rules: GameRules = getGameRulesSync()) {
  return rules.milestones.length * rules.pointsPerMilestone;
}

export function describeEarnRules(rules: GameRules = getGameRulesSync()) {
  return {
    readingMilestones: {
      milestones: rules.milestones,
      pointsPerMilestone: rules.pointsPerMilestone,
      maxPerBook: maxPointsPerBook(rules),
    },
    sessionCaps: {
      dailyPointCap: rules.dailyPointCap,
      weeklyPointCap: rules.weeklyPointCap,
    },
    packPricing: {
      generalMultiplier: rules.packGeneralMultiplier,
    },
  };
}

export function assertValidGameRulesInput(input: GameRulesInput) {
  const result = gameRulesInputSchema.safeParse(input);
  if (!result.success) {
    throw new ApiError(400, result.error.issues[0]?.message ?? "Invalid game rules");
  }
  return result.data;
}
