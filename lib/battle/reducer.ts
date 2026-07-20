import { DEFAULT_BATTLE_RULES, normalizeBattleRules } from "@/lib/battle/constants";
import { beginChronosPhase } from "@/lib/battle/setup";
import {
  deployUnitFromHand,
  playEventFromHand,
  moveUnitBetweenLanes,
  unificationOneLane,
} from "@/lib/battle/phases/logistics";
import { playLocationFromHand } from "@/lib/battle/locations";
import { resolveAttack, runConsolidation } from "@/lib/battle/phases/campaign";
import { autoResolvePendingChoice, resolvePendingChoice } from "@/lib/battle/effects";
import { establishInfluenceFromUnit } from "@/lib/battle/influence";
import { appendLog } from "@/lib/battle/rng";
import { nextPhase } from "@/lib/battle/validators";
import { clearTurnFlags, runCampaignStartTriggers } from "@/lib/battle/triggers";
import { normalizeMatchState } from "@/lib/battle/state-normalize";
import type {
  ActionResult,
  BattleAction,
  BattleRules,
  MatchState,
  PlayerId,
} from "@/lib/battle/types";
import { chooseAiAction } from "@/lib/battle/ai";
import { opponentOf } from "@/lib/battle/types";

export function applyAction(
  state: MatchState,
  actor: PlayerId,
  action: BattleAction,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): ActionResult {
  const normalized = normalizeMatchState(state, rules);
  if (normalized.status !== "active") {
    return { state: normalized, events: [], error: "Match is already finished." };
  }
  if (normalized.activePlayer !== actor) {
    return { state: normalized, events: [], error: "Not your turn." };
  }

  let next: MatchState = { ...normalized, pendingEvents: [] };
  const phase = next.phase;

  if (action.type === "resolve_choice") {
    const result = resolvePendingChoice(next, actor, action);
    if (!result) return { state: normalized, events: [], error: "Invalid choice." };
    return { state: result, events: result.pendingEvents };
  }

  if (next.pendingChoice) {
    return { state: normalized, events: [], error: "Resolve the pending choice first." };
  }

  if (action.type === "deploy_unit") {
    if (phase !== "logistics") return { state: normalized, events: [], error: "Can only deploy during Logistics." };
    const result = deployUnitFromHand(next, actor, action.handIndex, action.laneIndex, rules);
    if (!result) return { state: normalized, events: [], error: "Invalid deployment." };
    next = result;
  } else if (action.type === "play_event") {
    if (phase !== "logistics") return { state: normalized, events: [], error: "Can only play events during Logistics." };
    const result = playEventFromHand(next, actor, action, rules);
    if (!result) return { state: normalized, events: [], error: "Invalid event." };
    next = result;
  } else if (action.type === "establish_influence") {
    if (phase !== "logistics") {
      return { state: normalized, events: [], error: "Establish Influence only during Logistics." };
    }
    const result = establishInfluenceFromUnit(
      next,
      actor,
      action.laneIndex,
      action.unitInstanceId,
      rules,
    );
    if (!result) return { state: normalized, events: [], error: "Cannot establish Influence." };
    next = result;
  } else if (action.type === "unification") {
    if (phase !== "logistics") return { state: normalized, events: [], error: "Unification only during Logistics." };
    if (rules.activeLaneCount > 1 && action.fromLaneIndex != null && action.unitInstanceId) {
      const result = moveUnitBetweenLanes(
        next,
        actor,
        action.fromLaneIndex,
        action.laneIndex,
        action.unitInstanceId,
      );
      if (!result) return { state: normalized, events: [], error: "Invalid unification move." };
      next = result;
    } else {
      const result = unificationOneLane(
        next,
        actor,
        action.laneIndex,
        action.monarchInstanceId,
        action.targetInstanceId,
        rules,
      );
      if (!result) return { state: normalized, events: [], error: "Invalid unification." };
      next = result;
    }
  } else if (action.type === "unification_move") {
    if (phase !== "logistics") return { state: normalized, events: [], error: "Unification only during Logistics." };
    const result = moveUnitBetweenLanes(
      next,
      actor,
      action.fromLaneIndex,
      action.laneIndex,
      action.unitInstanceId,
    );
    if (!result) return { state: normalized, events: [], error: "Invalid unification move." };
    next = result;
  } else if (action.type === "play_location") {
    if (phase !== "logistics") return { state: normalized, events: [], error: "Can only play locations during Logistics." };
    const result = playLocationFromHand(next, actor, action.handIndex, action.laneIndex);
    if (!result) return { state: normalized, events: [], error: "Invalid location play." };
    next = result;
  } else if (action.type === "attack") {
    if (phase !== "campaign") return { state: normalized, events: [], error: "Can only attack during Campaign." };
    const result = resolveAttack(
      next,
      actor,
      action.laneIndex,
      action.attackerInstanceId,
      action.defenderInstanceId,
      rules,
    );
    if (!result) return { state: normalized, events: [], error: "Invalid attack." };
    next = result;
  } else if (action.type === "end_phase") {
    if (phase === "consolidation") {
      next = runConsolidation(next, rules);
      if (next.status !== "active") {
        return { state: next, events: next.pendingEvents };
      }
      next = passTurn(next, rules);
      return { state: next, events: next.pendingEvents };
    }

    const upcoming = nextPhase(phase);
    next = { ...next, phase: upcoming };
    next = appendLog(next, "phase", `${actor} advances to ${upcoming}.`);
    if (upcoming === "campaign") {
      next = runCampaignStartTriggers(next, actor);
    }
  } else if (action.type === "redraw_opening_hand") {
    return { state: normalized, events: [], error: "Opening redraw is no longer used." };
  } else {
    return { state: normalized, events: [], error: "Unknown action." };
  }

  return { state: next, events: next.pendingEvents };
}

function passTurn(state: MatchState, rules: BattleRules): MatchState {
  const nextPlayer = opponentOf(state.activePlayer);
  let turnNumber = state.turnNumber;
  if (nextPlayer === "player") {
    turnNumber += 1;
  }

  let next: MatchState = {
    ...state,
    activePlayer: nextPlayer,
    turnNumber,
    phase: "chronos",
  };

  next = clearEndOfTurn(next, state.activePlayer);
  next = clearTurnFlags(next, state.activePlayer);
  next = beginChronosPhase(next, rules);
  return next;
}

function clearEndOfTurn(state: MatchState, endingPlayer: PlayerId): MatchState {
  return {
    ...state,
    lanes: state.lanes.map((lane) => ({
      ...lane,
      playerUnits: lane.playerUnits.map((u) => ({
        ...u,
        tempAttackBonus: u.owner === endingPlayer ? 0 : u.tempAttackBonus,
        tempDefenseBonus: u.owner === endingPlayer ? 0 : u.tempDefenseBonus,
        summoningSickness: u.owner === endingPlayer ? false : u.summoningSickness,
        cannotAttack: u.owner === endingPlayer ? u.isCommitted : u.cannotAttack,
      })),
      aiUnits: lane.aiUnits.map((u) => ({
        ...u,
        tempAttackBonus: u.owner === endingPlayer ? 0 : u.tempAttackBonus,
        tempDefenseBonus: u.owner === endingPlayer ? 0 : u.tempDefenseBonus,
        summoningSickness: u.owner === endingPlayer ? false : u.summoningSickness,
        cannotAttack: u.owner === endingPlayer ? u.isCommitted : u.cannotAttack,
      })),
    })),
  };
}

export function runAiTurn(
  state: MatchState,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): MatchState {
  let current = normalizeMatchState(state, rules);
  let safety = 0;
  while (current.activePlayer === "ai" && current.status === "active" && safety < 80) {
    safety++;

    if (current.pendingChoice) {
      const resolved = autoResolvePendingChoice(current, "ai");
      if (!resolved) break;
      current = resolved;
      continue;
    }

    const action = chooseAiAction(current, rules);
    if (!action) break;
    const result = applyAction(current, "ai", action, rules);
    if (result.error && action.type !== "end_phase") {
      const skip = applyAction(current, "ai", { type: "end_phase" }, rules);
      current = skip.state;
      if (current.activePlayer === "player") break;
      continue;
    }
    current = result.state;
    if (action.type === "end_phase" && current.activePlayer === "player") break;
  }
  return current;
}

export { normalizeBattleRules };
