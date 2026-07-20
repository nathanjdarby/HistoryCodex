import { DEFAULT_BATTLE_RULES, normalizeBattleRules } from "@/lib/battle/constants";
import { syncUnitCurrentDefense } from "@/lib/battle/abilities";
import type {
  BattleRules,
  BoardUnit,
  Lane,
  MatchState,
  PlayerBattleState,
} from "@/lib/battle/types";
import { createEmptyLane } from "@/lib/battle/types";

export function normalizePlayerState(ps: PlayerBattleState): PlayerBattleState {
  return {
    ...ps,
    deployCostReduction: ps.deployCostReduction ?? 0,
    deployCostReductionUses: ps.deployCostReductionUses ?? 0,
    opponentInfluenceBlocked: ps.opponentInfluenceBlocked ?? false,
    capturedLocationHistory: ps.capturedLocationHistory ?? [],
    hasEstablishedInfluenceThisTurn: ps.hasEstablishedInfluenceThisTurn ?? false,
    hasUsedUnificationThisTurn: ps.hasUsedUnificationThisTurn ?? false,
    deckExhausted: ps.deckExhausted ?? false,
    failedChronosDraws: ps.failedChronosDraws ?? 0,
    attacksBlockedThisTurn: ps.attacksBlockedThisTurn ?? false,
    monarchAuraSuppressed: ps.monarchAuraSuppressed ?? false,
  };
}

export function normalizeBoardUnit(unit: BoardUnit, location: import("@/lib/battle/types").CardSnapshot | null): BoardUnit {
  const base: BoardUnit = {
    ...unit,
    damageTaken: unit.damageTaken ?? Math.max(0, (unit.baseDefense ?? 0) - (unit.currentDefense ?? 0)),
    abilityTrigger: unit.abilityTrigger ?? null,
    cannotAttack: unit.cannotAttack ?? false,
    flavorText: unit.flavorText ?? null,
    cost: unit.cost ?? 0,
    eraSynergyBonus: unit.eraSynergyBonus ?? 0,
    locationDefBonus: unit.locationDefBonus ?? unit.eraSynergyBonus ?? 0,
    sailorDefBonus: unit.sailorDefBonus ?? 0,
    isCommitted: unit.isCommitted ?? false,
    committedUntilTurn: unit.committedUntilTurn ?? null,
    cannotEstablishInfluence: unit.cannotEstablishInfluence ?? false,
    auraSuppressed: unit.auraSuppressed ?? false,
  };
  return syncUnitCurrentDefense(base, location);
}

export function normalizeLane(lane: Lane): Lane {
  const location = lane.location ?? null;
  return {
    ...createEmptyLane(),
    ...lane,
    location,
    locationOwner: lane.locationOwner ?? null,
    captureResolvedThisTurn: lane.captureResolvedThisTurn ?? false,
    attacksBlocked: lane.attacksBlocked ?? false,
    playerUnits: (lane.playerUnits ?? []).map((u) => normalizeBoardUnit(u, location)),
    aiUnits: (lane.aiUnits ?? []).map((u) => normalizeBoardUnit(u, location)),
  };
}

export function normalizeMatchState(
  state: MatchState,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): MatchState {
  void rules;
  if (state.status !== "active" && state.winner) {
    return {
      ...state,
      player: normalizePlayerState(state.player),
      ai: normalizePlayerState(state.ai),
      lanes: (state.lanes ?? []).map(normalizeLane),
      pendingLocation: state.pendingLocation ?? null,
      pendingChoice: state.pendingChoice ?? null,
    };
  }

  return {
    ...state,
    pendingLocation: state.pendingLocation ?? null,
    pendingChoice: state.pendingChoice ?? null,
    player: normalizePlayerState(state.player),
    ai: normalizePlayerState(state.ai),
    lanes: (state.lanes ?? []).map(normalizeLane),
  };
}

export function normalizeBattleState(state: MatchState, rules?: Partial<BattleRules>): MatchState {
  return normalizeMatchState(state, normalizeBattleRules(rules));
}
