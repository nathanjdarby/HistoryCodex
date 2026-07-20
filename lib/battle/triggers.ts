import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import { syncUnitCurrentDefense } from "@/lib/battle/abilities";
import { gainInfluence } from "@/lib/battle/influence";
import { appendLog, drawCardsWithExhaustion } from "@/lib/battle/rng";
import { applyLaneTempBuff as laneBuff } from "@/lib/battle/phases/logistics";
import type { BoardUnit, MatchState, PlayerId } from "@/lib/battle/types";
import { opponentOf, setUnitsInLane, unitsInLane } from "@/lib/battle/types";

export function runDeployTriggers(
  state: MatchState,
  player: PlayerId,
  unit: BoardUnit,
  laneIndex: number,
): MatchState {
  if (unit.abilityTrigger !== "deploy" || !unit.abilityEffect) return state;

  let next = state;
  const value = unit.abilityValue ?? 0;
  const lane = next.lanes[laneIndex];

  if (unit.abilityEffect === "draw_card") {
    const draw = drawCardsWithExhaustion(next, player, Math.max(1, value || 1));
    next = draw.state;
    next = appendLog(next, "trigger", `${unit.name} deploys: draw ${Math.max(1, value || 1)}.`);
  } else if (unit.abilityEffect === "flat_attack" && value && lane) {
    const lanes = [...next.lanes];
    lanes[laneIndex] = laneBuff(lane, player, value, 0);
    next = { ...next, lanes };
    next = appendLog(next, "trigger", `${unit.name} deploys: +${value} ATK to lane until end of turn.`);
  } else if (unit.abilityEffect === "add_influence" && lane?.location) {
    next = gainInfluence(next, player, laneIndex, Math.max(1, value || 1), DEFAULT_BATTLE_RULES, "event");
    next = appendLog(next, "trigger", `${unit.name} deploys: gains Influence.`);
  }

  return next;
}

export function runDeathTriggers(
  state: MatchState,
  player: PlayerId,
  unit: BoardUnit,
): MatchState {
  if (unit.abilityTrigger !== "death" || !unit.abilityEffect) return state;

  let next = state;
  const value = unit.abilityValue ?? 0;

  if (unit.abilityEffect === "draw_card") {
    const draw = drawCardsWithExhaustion(next, player, Math.max(1, value || 1));
    next = draw.state;
    next = appendLog(next, "death_trigger", `${unit.name} falls: draw ${Math.max(1, value || 1)}.`);
  } else if (unit.abilityEffect === "vs_higher_rarity_attack" && value) {
    for (let li = 0; li < next.lanes.length; li++) {
      const lane = next.lanes[li];
      if (!lane) continue;
      const enemies = unitsInLane(lane, opponentOf(player)).filter((u) => u.currentDefense > 0);
      if (enemies.length === 0) continue;
      const target = enemies[0]!;
      const updated = enemies.map((u) =>
        u.instanceId === target.instanceId
          ? syncUnitCurrentDefense({ ...u, damageTaken: u.damageTaken + value }, lane.location)
          : u,
      );
      const lanes = [...next.lanes];
      lanes[li] = setUnitsInLane(
        lane,
        opponentOf(player),
        updated.filter((u) => u.currentDefense > 0),
      );
      next = { ...next, lanes };
      next = appendLog(next, "death_trigger", `${unit.name} falls: ${target.name} takes ${value} damage.`);
      break;
    }
  }

  return next;
}

export function runCampaignStartTriggers(state: MatchState, player: PlayerId): MatchState {
  let next = state;
  next.lanes.forEach((lane, laneIndex) => {
    const units = unitsInLane(lane, player).filter(
      (u) => u.abilityTrigger === "campaign_start" && u.abilityEffect === "flat_attack" && u.abilityValue,
    );
    if (units.length === 0) return;
    const totalBuff = units.reduce((sum, u) => sum + (u.abilityValue ?? 0), 0);
    const lanes = [...next.lanes];
    lanes[laneIndex] = laneBuff(lane, player, totalBuff, 0);
    next = { ...next, lanes };
    next = appendLog(next, "trigger", `${player} units rally: +${totalBuff} ATK this Campaign.`);
  });
  return next;
}

export function leaderCountInLane(lane: import("@/lib/battle/types").Lane, owner: PlayerId): number {
  return unitsInLane(lane, owner).filter((u) => u.archetype === "leader" && u.currentDefense > 0).length;
}

export function sailorDefenseBonus(
  unit: BoardUnit,
  location: import("@/lib/battle/types").CardSnapshot | null,
): number {
  if (unit.archetype !== "sailor" || !location) return 0;
  if (unit.eraId !== location.eraId) return 5;
  return 10;
}

export function clearTurnFlags(state: MatchState, endingPlayer: PlayerId): MatchState {
  const ps = state[endingPlayer];
  return {
    ...state,
    [endingPlayer]: {
      ...ps,
      opponentInfluenceBlocked: false,
      deployCostReduction: 0,
      attacksBlockedThisTurn: false,
      monarchAuraSuppressed: false,
    },
    lanes: state.lanes.map((lane) => ({
      ...lane,
      attacksBlocked: false,
    })),
  };
}
