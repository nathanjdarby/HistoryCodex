import { clearTemporaryLaneEffects, syncLaneUnitDefenses } from "@/lib/battle/abilities";
import { checkVictoryAfterCapture } from "@/lib/battle/influence";
import { seatLocationFromDeck } from "@/lib/battle/locations";
import { appendLog } from "@/lib/battle/rng";
import type { BattleRules, CardSnapshot, MatchState, PlayerId } from "@/lib/battle/types";
import { playerState, setPlayerState } from "@/lib/battle/types";

export function resolveCaptureAftermath(
  state: MatchState,
  capturer: PlayerId,
  laneIndex: number,
  capturedLocation: CardSnapshot,
  rules: BattleRules,
): MatchState {
  const lane = state.lanes[laneIndex];
  if (!lane) return state;

  const ps = playerState(state, capturer);
  let next = setPlayerState(state, capturer, {
    ...ps,
    capturedLocationHistory: [...ps.capturedLocationHistory, capturedLocation],
  });

  const lanes = [...next.lanes];
  lanes[laneIndex] = syncLaneUnitDefenses(
    clearTemporaryLaneEffects({
      ...lane,
      location: null,
      locationOwner: null,
      playerInfluence: 0,
      aiInfluence: 0,
      captureResolvedThisTurn: false,
    }),
  );

  next = { ...next, lanes };
  next = appendLog(
    next,
    "capture_aftermath",
    `${capturer} captures the location — units hold the lane as the next site is revealed.`,
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
