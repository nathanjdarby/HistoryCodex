import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import {
  cardToBoardUnit,
  eraSynergyBonus,
  hasUnificationAbility,
  adjacentLaneIndexes,
} from "@/lib/battle/abilities";
import { applyEventEffect } from "@/lib/battle/effects";
import { runDeployTriggers } from "@/lib/battle/triggers";
import { appendLog, nextInstanceId } from "@/lib/battle/rng";
import type {
  BattleRules,
  BoardUnit,
  Lane,
  MatchState,
  PlayEventAction,
  PlayerId,
} from "@/lib/battle/types";
import {
  opponentOf,
  playerState,
  setPlayerState,
  setUnitsInLane,
  unitsInLane,
} from "@/lib/battle/types";

function removeFromHand(state: MatchState, player: PlayerId, handIndex: number) {
  const ps = playerState(state, player);
  const hand = [...ps.hand];
  const [card] = hand.splice(handIndex, 1);
  if (!card) return null;
  return { card, state: setPlayerState(state, player, { ...ps, hand }) };
}

export function deployUnitFromHand(
  state: MatchState,
  player: PlayerId,
  handIndex: number,
  laneIndex: number,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): MatchState | null {
  const lane = state.lanes[laneIndex];
  if (!lane || !lane.location) return null;
  const removed = removeFromHand(state, player, handIndex);
  if (!removed) return null;
  const { card } = removed;
  if (card.cardType !== "character" && card.cardType !== "unit") return null;

  const ps = playerState(removed.state, player);
  const effectiveCost = Math.max(0, card.cost - ps.deployCostReduction);
  if (effectiveCost > ps.cp) return null;

  let next = removed.state;
  let cp = ps.cp - effectiveCost;
  if (card.archetype === "merchant") {
    cp += rules.merchantRefundCp;
  }

  const synergy = eraSynergyBonus(card, lane.location);
  const { state: idState, id } = nextInstanceId(next);
  next = idState;
  const unit = cardToBoardUnit(card, player, id, next.turnNumber, synergy, lane.location);

  const lanes = [...next.lanes];
  const updatedLane = { ...lane };
  const units = [...unitsInLane(updatedLane, player), unit];
  lanes[laneIndex] = setUnitsInLane(updatedLane, player, units);

  next = setPlayerState(
    { ...next, lanes },
    player,
    {
      ...ps,
      cp,
      deployCostReduction: 0,
    },
  );

  next = appendLog(
    next,
    "deploy",
    `${player} deploys ${card.name} to lane ${laneIndex + 1}${synergy ? ` (+${synergy} DEF era synergy)` : ""}.`,
  );

  if (card.archetype === "merchant") {
    next = appendLog(next, "merchant_refund", `${player} gains ${rules.merchantRefundCp} CP from Merchant.`);
  }

  next = runDeployTriggers(next, player, unit, laneIndex);

  if (hasUnificationAbility(card)) {
    next = { ...next, phase: next.phase };
  }

  return next;
}

export function applyLaneTempBuff(
  lane: Lane,
  owner: PlayerId,
  attackBonus: number,
  defenseBonus: number,
): Lane {
  const units = unitsInLane(lane, owner).map((u) => ({
    ...u,
    tempAttackBonus: u.tempAttackBonus + attackBonus,
    tempDefenseBonus: u.tempDefenseBonus + defenseBonus,
  }));
  return setUnitsInLane(lane, owner, units);
}

export function playEventFromHand(
  state: MatchState,
  player: PlayerId,
  action: PlayEventAction,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): MatchState | null {
  if (state.pendingChoice) return null;
  const ps = playerState(state, player);
  if (ps.eventsPlayedThisTurn >= rules.maxEventsPerTurn) return null;

  const removed = removeFromHand(state, player, action.handIndex);
  if (!removed) return null;
  const { card } = removed;
  if (card.cardType !== "event") return null;
  if (card.cost > playerState(removed.state, player).cp) return null;

  return applyEventEffect(removed.state, player, card, action, rules);
}

export function clearTempBonuses(state: MatchState): MatchState {
  const lanes = state.lanes.map((lane) => ({
    ...lane,
    playerUnits: lane.playerUnits.map((u) => ({ ...u, tempAttackBonus: 0, tempDefenseBonus: 0 })),
    aiUnits: lane.aiUnits.map((u) => ({ ...u, tempAttackBonus: 0, tempDefenseBonus: 0 })),
  }));
  return { ...state, lanes };
}

export function moveUnitBetweenLanes(
  state: MatchState,
  player: PlayerId,
  fromLaneIndex: number,
  toLaneIndex: number,
  unitInstanceId: string,
): MatchState | null {
  const fromLane = state.lanes[fromLaneIndex];
  const toLane = state.lanes[toLaneIndex];
  if (!fromLane || !toLane) return null;
  if (!adjacentLaneIndexes(toLaneIndex, state.lanes.length).includes(fromLaneIndex)) return null;

  const fromUnits = unitsInLane(fromLane, player);
  const unit = fromUnits.find((u) => u.instanceId === unitInstanceId);
  if (!unit) return null;

  const lanes = [...state.lanes];
  lanes[fromLaneIndex] = setUnitsInLane(
    fromLane,
    player,
    fromUnits.filter((u) => u.instanceId !== unitInstanceId),
  );
  lanes[toLaneIndex] = setUnitsInLane(toLane, player, [...unitsInLane(toLane, player), unit]);
  return appendLog(state, "unification", `${player} moves ${unit.name} to lane ${toLaneIndex + 1}.`, []);
}

export function removeDeadUnits(lane: Lane): Lane {
  return {
    ...lane,
    playerUnits: lane.playerUnits.filter((u) => u.currentDefense > 0),
    aiUnits: lane.aiUnits.filter((u) => u.currentDefense > 0),
  };
}

export function updateUnitInLane(
  lanes: Lane[],
  laneIndex: number,
  instanceId: string,
  updater: (unit: BoardUnit) => BoardUnit,
): Lane[] {
  const lane = lanes[laneIndex];
  if (!lane) return lanes;
  const updateSide = (units: BoardUnit[]) =>
    units.map((u) => (u.instanceId === instanceId ? updater(u) : u));
  const copy = [...lanes];
  copy[laneIndex] = {
    ...lane,
    playerUnits: updateSide(lane.playerUnits),
    aiUnits: updateSide(lane.aiUnits),
  };
  return copy;
}
