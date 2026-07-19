import { appendLog, drawCards } from "@/lib/battle/rng";
import { applyLaneTempBuff } from "@/lib/battle/phases/logistics";
import type { BoardUnit, MatchState, PlayerId } from "@/lib/battle/types";
import {
  opponentOf,
  playerState,
  setInfluenceForLane,
  setPlayerState,
  setUnitsInLane,
  unitsInLane,
} from "@/lib/battle/types";

export function runDeployTriggers(
  state: MatchState,
  player: PlayerId,
  unit: BoardUnit,
  laneIndex: number,
): MatchState {
  if (unit.abilityTrigger !== "deploy" || !unit.abilityEffect) return state;

  let next = state;
  const value = unit.abilityValue ?? 0;

  if (unit.abilityEffect === "draw_card") {
    next = drawCards(next, player, Math.max(1, value || 1));
    next = appendLog(next, "trigger", `${unit.name} deploys: draw ${Math.max(1, value || 1)}.`);
  } else if (unit.abilityEffect === "flat_attack" && value) {
    const lane = next.lanes[laneIndex];
    if (lane) {
      const lanes = [...next.lanes];
      lanes[laneIndex] = applyLaneTempBuff(lane, player, value, 0);
      next = { ...next, lanes };
      next = appendLog(next, "trigger", `${unit.name} deploys: +${value} ATK to lane.`);
    }
  } else if (unit.abilityEffect === "add_influence") {
    const lane = next.lanes[laneIndex];
    if (lane?.location) {
      const current = player === "player" ? lane.playerInfluence : lane.aiInfluence;
      const lanes = [...next.lanes];
      lanes[laneIndex] = setInfluenceForLane(lane, player, current + Math.max(1, value || 1));
      next = { ...next, lanes };
      next = appendLog(next, "trigger", `${unit.name} deploys: gains influence.`);
    }
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
    next = drawCards(next, player, Math.max(1, value || 1));
    next = appendLog(next, "trigger", `${unit.name} falls: draw ${Math.max(1, value || 1)}.`);
  } else if (unit.abilityEffect === "vs_higher_rarity_attack" && value) {
    for (let laneIndex = 0; laneIndex < next.lanes.length; laneIndex++) {
      const lane = next.lanes[laneIndex];
      if (!lane) continue;
      const enemies = unitsInLane(lane, opponentOf(player));
      if (enemies.length === 0) continue;
      const target = enemies[0]!;
      const updated = enemies.map((u) =>
        u.instanceId === target.instanceId
          ? { ...u, currentDefense: u.currentDefense - value }
          : u,
      );
      const lanes = [...next.lanes];
      lanes[laneIndex] = setUnitsInLane(lane, opponentOf(player), updated.filter((u) => u.currentDefense > 0));
      next = { ...next, lanes };
      next = appendLog(next, "trigger", `${unit.name} falls: ${target.name} takes ${value} damage.`);
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
    lanes[laneIndex] = applyLaneTempBuff(lane, player, totalBuff, 0);
    next = { ...next, lanes };
    next = appendLog(next, "trigger", `${player} units rally: +${totalBuff} ATK this Campaign.`);
  });
  return next;
}

export function leaderCountInLane(lane: import("@/lib/battle/types").Lane, owner: PlayerId): number {
  return unitsInLane(lane, owner).filter((u) => u.archetype === "leader" && u.currentDefense > 0).length;
}

export function sailorDefenseBonus(unit: BoardUnit, location: import("@/lib/battle/types").CardSnapshot | null): number {
  if (unit.archetype !== "sailor" || !location) return 0;
  if (unit.eraId !== location.eraId) return 5;
  return 10;
}

export function clearTurnFlags(state: MatchState, endingPlayer: PlayerId): MatchState {
  return setPlayerState(state, endingPlayer, {
    ...playerState(state, endingPlayer),
    opponentInfluenceBlocked: false,
    deployCostReduction: 0,
  });
}
