import { appendLog } from "@/lib/battle/rng";
import { recalculateLaneEraSynergy, syncLaneUnitDefenses } from "@/lib/battle/abilities";
import type { CardSnapshot, Lane, MatchState, PlayerId } from "@/lib/battle/types";
import { createEmptyLane, playerState, setPlayerState } from "@/lib/battle/types";

export { createEmptyLane } from "@/lib/battle/types";

export function applyLocationToLane(
  state: MatchState,
  player: PlayerId,
  laneIndex: number,
  location: CardSnapshot,
): MatchState | null {
  const lane = state.lanes[laneIndex];
  if (!lane) return null;

  let next = state;
  if (lane.location && lane.locationOwner) {
    const ownerPs = playerState(next, lane.locationOwner);
    next = setPlayerState(next, lane.locationOwner, {
      ...ownerPs,
      discard: [...ownerPs.discard, lane.location],
    });
    next = appendLog(
      next,
      "location_replaced",
      `${player} replaces ${lane.location.name} (${lane.locationOwner}'s) with ${location.name}. Influence reset.`,
    );
  } else {
    next = appendLog(next, "location_played", `${player} plays ${location.name} on the battlefield.`);
  }

  const lanes = [...next.lanes];
  lanes[laneIndex] = syncLaneUnitDefenses(
    recalculateLaneEraSynergy({
      ...lane,
      location,
      locationOwner: player,
      playerInfluence: 0,
      aiInfluence: 0,
      captureResolvedThisTurn: false,
    }),
  );
  return { ...next, lanes };
}

export function playLocationFromHand(
  state: MatchState,
  player: PlayerId,
  handIndex: number,
  laneIndex: number,
): MatchState | null {
  const ps = playerState(state, player);
  const hand = [...ps.hand];
  const [card] = hand.splice(handIndex, 1);
  if (!card || card.cardType !== "location") return null;
  if (card.cost > ps.cp) return null;

  let next = setPlayerState(state, player, { ...ps, hand, cp: ps.cp - card.cost });
  const applied = applyLocationToLane(next, player, laneIndex, card);
  if (!applied) return null;

  if (state.lanes[laneIndex]?.location) {
    next = appendLog(applied, "influence_reset", "All Influence on this lane has been reset.");
    return next;
  }
  return applied;
}

/**
 * Draws the next card off the shared location deck (built at setup from
 * both players' deck-list Locations, shuffled once) and seats it directly
 * into an empty lane. Locations are no longer played from hand — this is
 * the sole way a lane ever gets a location, called once per active lane at
 * match start and again immediately after a capture clears the lane.
 */
export function seatLocationFromDeck(state: MatchState, laneIndex: number): MatchState {
  const lane = state.lanes[laneIndex];
  if (!lane || lane.location) return state;

  if (state.locationDeck.length === 0) {
    return appendLog(
      state,
      "location_deck_empty",
      "The location deck is empty — no Location remains to place on this lane.",
    );
  }

  const [location, ...rest] = state.locationDeck;
  const lanes = [...state.lanes];
  lanes[laneIndex] = syncLaneUnitDefenses(
    recalculateLaneEraSynergy({
      ...lane,
      location: location!,
      locationOwner: null,
      playerInfluence: 0,
      aiInfluence: 0,
      captureResolvedThisTurn: false,
    }),
  );

  let next: MatchState = { ...state, lanes, locationDeck: rest };
  next = appendLog(
    next,
    "location_revealed",
    `The location deck reveals ${location!.name}. (${rest.length} location${rest.length === 1 ? "" : "s"} remain.)`,
  );
  return next;
}

export function laneHasInfluenceToLose(lane: Lane): boolean {
  return lane.playerInfluence > 0 || lane.aiInfluence > 0;
}

export function locationReplacementNeedsConfirm(lane: Lane): boolean {
  return lane.location != null && laneHasInfluenceToLose(lane);
}
