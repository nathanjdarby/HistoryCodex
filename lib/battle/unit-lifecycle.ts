import { cardSnapshotFromUnit } from "@/lib/battle/abilities";
import { runDeathTriggers } from "@/lib/battle/triggers";
import { isUnitAlive, syncUnitCurrentDefense } from "@/lib/battle/abilities";
import type { BoardUnit, MatchState, PlayerId } from "@/lib/battle/types";
import { playerState, setPlayerState, setUnitsInLane, unitsInLane } from "@/lib/battle/types";
import { appendLog } from "@/lib/battle/rng";

export function discardDestroyedUnit(
  state: MatchState,
  owner: PlayerId,
  unit: BoardUnit,
  reason: "destroyed" | "routed" = "destroyed",
): MatchState {
  const ps = playerState(state, owner);
  const card = cardSnapshotFromUnit(unit);
  const next = setPlayerState(state, owner, {
    ...ps,
    discard: [...ps.discard, card],
  });
  return appendLog(
    next,
    reason === "routed" ? "unit_routed" : "unit_destroyed",
    `${unit.name} ${reason === "routed" ? "is routed" : "is destroyed"} and sent to discard.`,
  );
}

export function removeDeadUnitsFromLane(state: MatchState, laneIndex: number): MatchState {
  const lane = state.lanes[laneIndex];
  if (!lane) return state;

  let next = state;
  const location = lane.location;

  for (const owner of ["player", "ai"] as PlayerId[]) {
    const units = unitsInLane(lane, owner);
    const alive: BoardUnit[] = [];
    for (const unit of units) {
      if (isUnitAlive(unit, location)) {
        alive.push(syncUnitCurrentDefense(unit, location));
      } else if (unit.damageTaken > 0) {
        next = discardDestroyedUnit(next, owner, unit, "destroyed");
        next = runDeathTriggers(next, owner, unit);
      }
    }

    const lanes = [...next.lanes];
    lanes[laneIndex] = setUnitsInLane(lanes[laneIndex]!, owner, alive);
    next = { ...next, lanes };
  }

  return next;
}

export function destroyUnitsToDiscard(
  state: MatchState,
  capturer: PlayerId,
  laneIndex: number,
  units: BoardUnit[],
  reason: "destroyed" | "routed",
): MatchState {
  let next = state;
  const opponent = capturer === "player" ? "ai" : "player";
  const lane = next.lanes[laneIndex];
  if (!lane) return state;

  const remaining = unitsInLane(lane, opponent).filter(
    (u) => !units.some((d) => d.instanceId === u.instanceId),
  );

  for (const unit of units) {
    next = discardDestroyedUnit(next, opponent, unit, reason);
    if (reason === "destroyed" || reason === "routed") {
      next = runDeathTriggers(next, opponent, unit);
    }
  }

  const lanes = [...next.lanes];
  lanes[laneIndex] = setUnitsInLane(lanes[laneIndex]!, opponent, remaining);
  return { ...next, lanes };
}
