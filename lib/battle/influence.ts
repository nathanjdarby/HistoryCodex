import { captureActiveLocation } from "@/lib/battle/capture";
import { appendLog } from "@/lib/battle/rng";
import { getLeaderInfluenceBonus } from "@/lib/battle/abilities";
import type { BattleRules, MatchState, PlayerId } from "@/lib/battle/types";
import {
  opponentOf,
  playerState,
  setInfluenceForLane,
  setPlayerState,
  setUnitsInLane,
  unitsInLane,
} from "@/lib/battle/types";

export function checkVictoryAfterCapture(
  state: MatchState,
  capturer: PlayerId,
  rules: BattleRules,
): MatchState {
  const ps = playerState(state, capturer);
  if (ps.capturedLocations >= rules.locationsToWin) {
    return appendLog(
      {
        ...state,
        winner: capturer,
        status: capturer === "player" ? "won" : "lost",
      },
      "victory",
      `${capturer} wins by capturing ${rules.locationsToWin} Locations!`,
    );
  }
  return state;
}

export function gainInfluence(
  state: MatchState,
  player: PlayerId,
  laneIndex: number,
  amount: number,
  rules: BattleRules,
  source: "establish" | "consolidation" | "event",
): MatchState {
  if (amount <= 0) return state;
  const lane = state.lanes[laneIndex];
  if (!lane?.location || lane.captureResolvedThisTurn) return state;

  const opponent = opponentOf(player);
  if (source !== "event" && playerState(state, opponent).opponentInfluenceBlocked) {
    return appendLog(state, "influence_blocked", `${player} cannot gain Influence — blocked this turn.`);
  }

  const current = player === "player" ? lane.playerInfluence : lane.aiInfluence;
  const capped = Math.min(current + amount, rules.influenceToCapture);
  const gained = capped - current;
  if (gained <= 0) return state;

  const lanes = [...state.lanes];
  lanes[laneIndex] = setInfluenceForLane(lane, player, capped);
  let next: MatchState = { ...state, lanes };

  const label =
    source === "establish"
      ? "influence_established"
      : source === "consolidation"
        ? "influence_passive"
        : "influence_event";
  next = appendLog(
    next,
    label,
    `${player} gains ${gained} Influence on ${lane.location.name} (${capped}/${rules.influenceToCapture}).`,
  );

  if (capped >= rules.influenceToCapture) {
    lanes[laneIndex] = { ...lanes[laneIndex]!, captureResolvedThisTurn: true };
    next = { ...next, lanes };
    next = captureActiveLocation(next, player, laneIndex, rules);
  }

  return next;
}

export function runConsolidationInfluence(
  state: MatchState,
  rules: BattleRules,
): MatchState {
  const actor = state.activePlayer;
  const opponent = opponentOf(actor);
  let next = state;

  next.lanes.forEach((lane, laneIndex) => {
    if (!lane.location || lane.captureResolvedThisTurn) return;

    const friendly = unitsInLane(lane, actor).filter((u) => u.currentDefense > 0);
    const enemy = unitsInLane(lane, opponent).filter((u) => u.currentDefense > 0);
    if (friendly.length === 0 || enemy.length > 0) return;

    const opponentBlocked = playerState(next, opponent).opponentInfluenceBlocked;
    if (opponentBlocked) {
      next = appendLog(next, "influence_blocked", `${actor} cannot gain passive Influence — opponent blocked.`);
      return;
    }

    let influenceGain = 1;
    const leaderBonus = getLeaderInfluenceBonus(lane, actor, rules);
    if (leaderBonus > 0) {
      influenceGain += leaderBonus;
      next = appendLog(next, "leader_bonus", `Leader grants +${leaderBonus} Influence.`);
    }

    next = gainInfluence(next, actor, laneIndex, influenceGain, rules, "consolidation");
  });

  return next;
}

export function establishInfluenceFromUnit(
  state: MatchState,
  player: PlayerId,
  laneIndex: number,
  unitInstanceId: string,
  rules: BattleRules,
): MatchState | null {
  if (state.phase !== "logistics") return null;
  const ps = playerState(state, player);
  if (ps.hasEstablishedInfluenceThisTurn) return null;
  if (ps.eventsPlayedThisTurn >= rules.maxEstablishInfluencePerTurn && rules.maxEstablishInfluencePerTurn === 0) {
    return null;
  }

  const lane = state.lanes[laneIndex];
  if (!lane?.location || lane.captureResolvedThisTurn) return null;

  const opponent = opponentOf(player);
  if (playerState(state, opponent).opponentInfluenceBlocked) return null;

  const unit = unitsInLane(lane, player).find((u) => u.instanceId === unitInstanceId);
  if (!unit || unit.currentDefense <= 0) return null;
  if (unit.summoningSickness || unit.cannotEstablishInfluence || unit.isCommitted) return null;

  const updatedUnits = unitsInLane(lane, player).map((u) =>
    u.instanceId === unitInstanceId
      ? {
          ...u,
          isCommitted: true,
          committedUntilTurn: state.turnNumber,
          cannotAttack: true,
        }
      : u,
  );

  const lanes = [...state.lanes];
  lanes[laneIndex] = setUnitsInLane(lane, player, updatedUnits);

  let next = setPlayerState(
    { ...state, lanes },
    player,
    { ...ps, hasEstablishedInfluenceThisTurn: true },
  );

  next = appendLog(
    next,
    "establish_influence",
    `${player} commits ${unit.name} to establish Influence. It cannot attack this turn.`,
  );

  return gainInfluence(next, player, laneIndex, 1, rules, "establish");
}
