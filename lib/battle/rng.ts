import type { MatchState } from "@/lib/battle/types";
import { playerState, setPlayerState } from "@/lib/battle/types";
import { shuffle } from "@/lib/battle/rng-core";

export { createRng, nextRandom, shuffle } from "@/lib/battle/rng-core";

export function drawCards(
  state: MatchState,
  playerKey: "player" | "ai",
  count: number,
): MatchState {
  if (count <= 0) return state;
  const ps = state[playerKey];
  const deck = [...ps.deck];
  const hand = [...ps.hand];
  for (let i = 0; i < count && deck.length > 0; i++) {
    hand.push(deck.shift()!);
  }
  return {
    ...state,
    [playerKey]: { ...ps, deck, hand },
  };
}

export function peekDeckTop(state: MatchState, playerKey: "player" | "ai", count: number) {
  const deck = playerState(state, playerKey).deck;
  return deck.slice(0, Math.min(count, deck.length));
}

export function reorderDeckTop(
  state: MatchState,
  playerKey: "player" | "ai",
  topCount: number,
  topIndicesInPeek: number[],
): MatchState {
  const ps = playerState(state, playerKey);
  const deck = [...ps.deck];
  const peeked = deck.splice(0, topCount);
  const topCards = topIndicesInPeek.map((index) => peeked[index]!).filter(Boolean);
  const bottomCards = peeked.filter((_, index) => !topIndicesInPeek.includes(index));
  return setPlayerState(state, playerKey, {
    ...ps,
    deck: [...topCards, ...bottomCards, ...deck],
  });
}

export function putCardOnDeckTop(
  state: MatchState,
  playerKey: "player" | "ai",
  card: import("@/lib/battle/types").CardSnapshot,
): MatchState {
  const ps = playerState(state, playerKey);
  return setPlayerState(state, playerKey, {
    ...ps,
    deck: [card, ...ps.deck],
  });
}

export function shufflePlayerDeck(state: MatchState, playerKey: "player" | "ai"): MatchState {
  const ps = playerState(state, playerKey);
  const shuffled = shuffle(ps.deck, state);
  return {
    ...shuffled.state,
    [playerKey]: { ...ps, deck: shuffled.items },
  };
}

export function nextInstanceId(state: MatchState): { state: MatchState; id: string } {
  const id = `u-${state.rngCounter}`;
  return { state: { ...state, rngCounter: state.rngCounter + 1 }, id };
}

export function appendLog(
  state: MatchState,
  type: string,
  message: string,
  events: { type: string; message: string; at: number }[] = [],
): MatchState {
  const entry = { type, message, at: state.log.length };
  return {
    ...state,
    log: [...state.log, entry],
    pendingEvents: [...state.pendingEvents, ...events, entry],
  };
}
