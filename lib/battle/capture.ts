import { clearTemporaryLaneEffects, syncLaneUnitDefenses } from "@/lib/battle/abilities";
import { destroyUnitsToDiscard } from "@/lib/battle/unit-lifecycle";
import { checkVictoryAfterCapture } from "@/lib/battle/influence";
import { seatLocationFromDeck } from "@/lib/battle/locations";
import { appendLog } from "@/lib/battle/rng";
import type { BattleRules, CardSnapshot, MatchState, PlayerId } from "@/lib/battle/types";
import { playerState, setPlayerState, unitsInLane } from "@/lib/battle/types";

export function resolveCaptureAftermath(
  state: MatchState,
  capturer: PlayerId,
  laneIndex: number,
  capturedLocation: CardSnapshot,
  rules: BattleRules,
): MatchState {
  const lane = state.lanes[laneIndex];
  if (!lane) return state;

  const opponent = capturer === "player" ? "ai" : "player";
  const enemyUnits = unitsInLane(lane, opponent);
  const friendlyUnits = unitsInLane(lane, capturer);

  let next = destroyUnitsToDiscard(state, capturer, laneIndex, enemyUnits, "routed");

  const ps = playerState(next, capturer);
  next = setPlayerState(next, capturer, {
    ...ps,
    capturedLocationHistory: [...ps.capturedLocationHistory, capturedLocation],
  });

  const surviving = friendlyUnits.map((u) => ({
    ...u,
    summoningSickness: true,
    isCommitted: true,
    committedUntilTurn: next.turnNumber + 1,
    cannotAttack: true,
    cannotEstablishInfluence: true,
    tempAttackBonus: 0,
    tempDefenseBonus: 0,
  }));

  const lanes = [...next.lanes];
  lanes[laneIndex] = syncLaneUnitDefenses(
    clearTemporaryLaneEffects({
      ...lane,
      location: null,
      locationOwner: null,
      playerInfluence: 0,
      aiInfluence: 0,
      captureResolvedThisTurn: false,
      playerUnits: capturer === "player" ? surviving : [],
      aiUnits: capturer === "ai" ? surviving : [],
    }),
  );

  next = { ...next, lanes };
  next = appendLog(
    next,
    "capture_aftermath",
    `${capturer} holds the lane with ${surviving.length} surviving unit(s).`,
  );

  next = checkVictoryAfterCapture(next, capturer, rules);
  // No point drawing a new location into a lane that just ended the match.
  if (next.status === "active") {
    next = seatLocationFromDeck(next, laneIndex);
  }

  return next;
}

export function captureActiveLocation(
  state: MatchState,
  capturer: PlayerId,
  laneIndex: number,
  rules: BattleRules,
): MatchState {
  const lane = state.lanes[laneIndex];
  if (!lane?.location) return state;

  const capturedLocation = lane.location;
  const ps = playerState(state, capturer);

  let next: MatchState = {
    ...state,
    [capturer]: {
      ...ps,
      capturedLocations: ps.capturedLocations + 1,
    },
  };

  next = appendLog(
    next,
    "location_captured",
    `${capturer} captures ${capturedLocation.name}! (${playerState(next, capturer).capturedLocations}/${rules.locationsToWin})`,
  );

  return resolveCaptureAftermath(next, capturer, laneIndex, capturedLocation, rules);
}
