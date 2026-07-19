import type { BoardUnit, MatchState, PlayerBattleState } from "@/lib/battle/types";

export function normalizePlayerState(ps: PlayerBattleState): PlayerBattleState {
  return {
    ...ps,
    deployCostReduction: ps.deployCostReduction ?? 0,
    opponentInfluenceBlocked: ps.opponentInfluenceBlocked ?? false,
  };
}

export function normalizeBoardUnit(unit: BoardUnit): BoardUnit {
  return {
    ...unit,
    abilityTrigger: unit.abilityTrigger ?? null,
    cannotAttack: unit.cannotAttack ?? false,
    flavorText: unit.flavorText ?? null,
    cost: unit.cost ?? 0,
  };
}

export function normalizeMatchState(state: MatchState): MatchState {
  return {
    ...state,
    pendingLocation: state.pendingLocation ?? null,
    pendingChoice: state.pendingChoice ?? null,
    player: normalizePlayerState(state.player),
    ai: normalizePlayerState(state.ai),
    lanes: (state.lanes ?? []).map((lane) => ({
      ...lane,
      location: lane.location ?? null,
      playerUnits: (lane.playerUnits ?? []).map(normalizeBoardUnit),
      aiUnits: (lane.aiUnits ?? []).map(normalizeBoardUnit),
    })),
  };
}
