import { appendLog } from "@/lib/battle/rng";
import type { CardSnapshot, Lane, MatchState, PlayerId } from "@/lib/battle/types";
import { playerState, setPlayerState } from "@/lib/battle/types";

export function createEmptyLane(): Lane {
  return {
    location: null,
    playerInfluence: 0,
    aiInfluence: 0,
    playerUnits: [],
    aiUnits: [],
  };
}

export function applyLocationToLane(
  state: MatchState,
  player: PlayerId,
  laneIndex: number,
  location: CardSnapshot,
): MatchState | null {
  const lane = state.lanes[laneIndex];
  if (!lane) return null;

  const hadLocation = lane.location !== null;
  const oldLocation = lane.location;

  const lanes = [...state.lanes];
  lanes[laneIndex] = {
    ...lane,
    location,
    playerInfluence: 0,
    aiInfluence: 0,
  };

  let next: MatchState = { ...state, lanes };

  if (hadLocation && oldLocation) {
    const ps = playerState(next, player);
    next = setPlayerState(next, player, {
      ...ps,
      discard: [...ps.discard, oldLocation],
    });
  }

  const message = hadLocation
    ? `${player} plays ${location.name}, overriding ${oldLocation!.name} — influence reset.`
    : `${player} plays ${location.name} on the battlefield.`;
  return appendLog(next, "location_play", message);
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

  const next = setPlayerState(state, player, { ...ps, hand, cp: ps.cp - card.cost });
  return applyLocationToLane(next, player, laneIndex, card);
}
