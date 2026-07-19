import type { MatchState } from "@/lib/battle/types";

export function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function nextRandom(state: MatchState): { state: MatchState; value: number } {
  const rng = createRng(state.rngSeed + state.rngCounter);
  const value = rng();
  return {
    state: { ...state, rngCounter: state.rngCounter + 1 },
    value,
  };
}

export function shuffle<T>(items: T[], state: MatchState): { items: T[]; state: MatchState } {
  const copy = [...items];
  let nextState = state;
  for (let i = copy.length - 1; i > 0; i--) {
    const roll = nextRandom(nextState);
    nextState = roll.state;
    const j = Math.floor(roll.value * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return { items: copy, state: nextState };
}
