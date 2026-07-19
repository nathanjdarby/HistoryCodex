import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import { beginChronosPhase, redrawOpeningHand } from "@/lib/battle/setup";
import {
  deployUnitFromHand,
  playEventFromHand,
  moveUnitBetweenLanes,
} from "@/lib/battle/phases/logistics";
import { playLocationFromHand } from "@/lib/battle/locations";
import { resolveAttack, runConsolidation } from "@/lib/battle/phases/campaign";
import { autoResolvePendingChoice, resolvePendingChoice } from "@/lib/battle/effects";
import { appendLog } from "@/lib/battle/rng";
import { nextPhase } from "@/lib/battle/validators";
import { clearTurnFlags, runCampaignStartTriggers } from "@/lib/battle/triggers";
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
  if (state.status !== "active") {
    return { state, events: [], error: "Match is already finished." };
  }
  if (state.activePlayer !== actor) {
    return { state, events: [], error: "Not your turn." };
  }

  let next: MatchState = { ...state, pendingEvents: [] };
  const phase = next.phase;

  if (action.type === "resolve_choice") {
    const result = resolvePendingChoice(next, actor, action);
    if (!result) return { state, events: [], error: "Invalid choice." };
    next = result;
    return { state: next, events: next.pendingEvents };
  }

  if (next.pendingChoice) {
    return { state, events: [], error: "Resolve the pending choice first." };
  }

  if (phase === "opening") {
    if (action.type !== "redraw_opening_hand") {
      return { state, events: [], error: "Redraw your opening hand before the match begins." };
    }
    const result = redrawOpeningHand(next, actor, rules);
    if (!result) return { state, events: [], error: "Cannot redraw opening hand." };
    next = result;
    return { state: next, events: next.pendingEvents };
  }

  if (action.type === "deploy_unit") {
    if (phase !== "logistics") return { state, events: [], error: "Can only deploy during Logistics." };
    const result = deployUnitFromHand(next, actor, action.handIndex, action.laneIndex, rules);
    if (!result) return { state, events: [], error: "Invalid deployment." };
    next = result;
  } else if (action.type === "play_event") {
    if (phase !== "logistics") return { state, events: [], error: "Can only play events during Logistics." };
    const result = playEventFromHand(next, actor, action, rules);
    if (!result) return { state, events: [], error: "Invalid event." };
    next = result;
  } else if (action.type === "unification_move") {
    if (phase !== "logistics") return { state, events: [], error: "Unification only during Logistics." };
    const result = moveUnitBetweenLanes(
      next,
      actor,
      action.fromLaneIndex,
      action.laneIndex,
      action.unitInstanceId,
    );
    if (!result) return { state, events: [], error: "Invalid unification move." };
    next = result;
  } else if (action.type === "play_location") {
    if (phase !== "logistics") return { state, events: [], error: "Can only play locations during Logistics." };
    const result = playLocationFromHand(next, actor, action.handIndex, action.laneIndex);
    if (!result) return { state, events: [], error: "Invalid location play." };
    next = result;
  } else if (action.type === "attack") {
    if (phase !== "campaign") return { state, events: [], error: "Can only attack during Campaign." };
    const result = resolveAttack(
      next,
      actor,
      action.laneIndex,
      action.attackerInstanceId,
      action.defenderInstanceId,
      rules,
    );
    if (!result) return { state, events: [], error: "Invalid attack." };
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
  } else {
    return { state, events: [], error: "Unknown action." };
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
        tempAttackBonus: 0,
        tempDefenseBonus: 0,
        summoningSickness: u.owner === endingPlayer ? false : u.summoningSickness,
        cannotAttack: u.owner === endingPlayer ? false : u.cannotAttack,
      })),
      aiUnits: lane.aiUnits.map((u) => ({
        ...u,
        tempAttackBonus: 0,
        tempDefenseBonus: 0,
        summoningSickness: u.owner === endingPlayer ? false : u.summoningSickness,
        cannotAttack: u.owner === endingPlayer ? false : u.cannotAttack,
      })),
    })),
  };
}

export function runAiTurn(
  state: MatchState,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): MatchState {
  let current = state;
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
