import { DEFAULT_BATTLE_RULES, applyCpGain } from "@/lib/battle/constants";
import {
  cardToBoardUnit,
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
    cp = applyCpGain(cp, rules.merchantRefundCp, rules);
  }

  const { state: idState, id } = nextInstanceId(next);
  next = idState;
  const unit = cardToBoardUnit(card, player, id, next.turnNumber, lane.location);

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
      deployCostReductionUses: 0,
    },
  );

  const synergy = unit.locationDefBonus;
  next = appendLog(
    next,
    "deploy",
    `${player} deploys ${card.name}${synergy ? ` (+${synergy} DEF era synergy)` : ""}.`,
  );

  if (card.archetype === "merchant") {
    next = appendLog(next, "merchant_refund", `${player} gains ${rules.merchantRefundCp} CP from Merchant.`);
  }

  next = runDeployTriggers(next, player, unit, laneIndex);
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

export function unificationOneLane(
  state: MatchState,
  player: PlayerId,
  laneIndex: number,
  monarchInstanceId: string,
  targetInstanceId: string,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): MatchState | null {
  const ps = playerState(state, player);
  if (ps.hasUsedUnificationThisTurn) return null;

  const lane = state.lanes[laneIndex];
  if (!lane?.location) return null;

  const units = unitsInLane(lane, player);
  const monarch = units.find((u) => u.instanceId === monarchInstanceId);
  const target = units.find((u) => u.instanceId === targetInstanceId);
  if (!monarch || !target) return null;
  if (!hasUnificationAbility({ abilityName: monarch.abilityName } as import("@/lib/battle/types").CardSnapshot)) {
    return null;
  }
  if (target.instanceId === monarch.instanceId) return null;

  const bonus = monarch.abilityValue ?? 10;
  const updated = units.map((u) => {
    if (u.instanceId !== targetInstanceId) return u;
    return {
      ...u,
      summoningSickness: false,
      isCommitted: false,
      committedUntilTurn: null,
      cannotAttack: false,
      cannotEstablishInfluence: false,
      tempAttackBonus: u.tempAttackBonus + bonus,
    };
  });

  const lanes = [...state.lanes];
  lanes[laneIndex] = setUnitsInLane(lane, player, updated);
  let next = setPlayerState({ ...state, lanes }, player, {
    ...ps,
    hasUsedUnificationThisTurn: true,
  });
  next = appendLog(
    next,
    "unification",
    `${monarch.name} unifies ${target.name}: ready and +${bonus} ATK until end of turn.`,
  );
  void rules;
  return next;
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
