import { DEFAULT_BATTLE_RULES } from "@/lib/battle/constants";
import { effectiveAttack } from "@/lib/battle/abilities";
import { appendLog } from "@/lib/battle/rng";
import { removeDeadUnits, updateUnitInLane } from "@/lib/battle/phases/logistics";
import { leaderCountInLane, runDeathTriggers } from "@/lib/battle/triggers";
import { canAttackTarget } from "@/lib/battle/validators";
import type { BattleRules, BoardUnit, MatchState, PlayerId } from "@/lib/battle/types";
import { opponentOf, playerState, setInfluenceForLane, unitsInLane } from "@/lib/battle/types";

function collectDeadUnits(before: BoardUnit[], after: BoardUnit[]): BoardUnit[] {
  const alive = new Set(after.map((u) => u.instanceId));
  return before.filter((u) => !alive.has(u.instanceId));
}

export function resolveAttack(
  state: MatchState,
  actor: PlayerId,
  laneIndex: number,
  attackerInstanceId: string,
  defenderInstanceId: string,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): MatchState | null {
  const lane = state.lanes[laneIndex];
  if (!lane || !lane.location) return null;

  const attackers = unitsInLane(lane, actor);
  const defenders = unitsInLane(lane, opponentOf(actor));
  const attacker = attackers.find((u) => u.instanceId === attackerInstanceId);
  const defender = defenders.find((u) => u.instanceId === defenderInstanceId);
  if (!attacker || !defender) return null;
  if (attacker.summoningSickness || attacker.cannotAttack || attacker.currentDefense <= 0 || defender.currentDefense <= 0) {
    return null;
  }

  if (
    !canAttackTarget(state, actor, laneIndex, attackerInstanceId, defenderInstanceId, rules)
  ) {
    return null;
  }

  const atkDamage = effectiveAttack(attacker, lane, rules, defender.rarity);
  const defDamage = effectiveAttack(defender, lane, rules, attacker.rarity);

  const beforePlayer = [...lane.playerUnits];
  const beforeAi = [...lane.aiUnits];

  let lanes = updateUnitInLane(state.lanes, laneIndex, attacker.instanceId, (u) => ({
    ...u,
    currentDefense: u.currentDefense - defDamage,
  }));
  lanes = updateUnitInLane(lanes, laneIndex, defender.instanceId, (u) => ({
    ...u,
    currentDefense: u.currentDefense - atkDamage,
  }));

  lanes = lanes.map((l, i) => (i === laneIndex ? removeDeadUnits(l) : l));

  let next = { ...state, lanes };
  const updatedLane = next.lanes[laneIndex]!;
  for (const unit of collectDeadUnits(beforePlayer, updatedLane.playerUnits)) {
    next = runDeathTriggers(next, "player", unit);
  }
  for (const unit of collectDeadUnits(beforeAi, updatedLane.aiUnits)) {
    next = runDeathTriggers(next, "ai", unit);
  }

  next = appendLog(
    next,
    "combat",
    `${attacker.name} (${atkDamage} ATK) clashes with ${defender.name} (${defDamage} ATK) in lane ${laneIndex + 1}.`,
  );
  return next;
}

export function runConsolidation(
  state: MatchState,
  rules: BattleRules = DEFAULT_BATTLE_RULES,
): MatchState {
  const actor = state.activePlayer;
  const opponent = opponentOf(actor);
  let next = state;

  next.lanes.forEach((lane, laneIndex) => {
    if (!lane.location) return;
    const friendly = unitsInLane(lane, actor);
    const enemy = unitsInLane(lane, opponent);
    if (friendly.length === 0) return;

    const opponentBlocked = playerState(next, opponent).opponentInfluenceBlocked;
    const uncontested = enemy.length === 0;
    const leaderPresent = leaderCountInLane(lane, actor) > 0;
    let influenceGain = 0;

    if (uncontested && !opponentBlocked) {
      influenceGain += 1;
    }
    if (leaderPresent && uncontested && !opponentBlocked) {
      influenceGain += 1;
    }

    if (influenceGain <= 0) return;

    const current = actor === "player" ? lane.playerInfluence : lane.aiInfluence;
    const lanes = [...next.lanes];
    lanes[laneIndex] = setInfluenceForLane(lane, actor, current + influenceGain);
    next = { ...next, lanes };
    next = appendLog(
      next,
      "influence",
      `${actor} gains ${influenceGain} influence on ${lane.location!.name}.`,
    );

      const updatedLane = next.lanes[laneIndex]!;
      const influence = actor === "player" ? updatedLane.playerInfluence : updatedLane.aiInfluence;
      if (influence >= rules.influenceToCapture) {
        const ps = next[actor];
        next = {
          ...next,
          [actor]: { ...ps, capturedLocations: ps.capturedLocations + 1 },
          lanes: next.lanes.map((l, i) =>
            i === laneIndex
              ? {
                  ...l,
                  playerInfluence: 0,
                  aiInfluence: 0,
                }
              : l,
          ),
        };
        next = appendLog(next, "capture", `${actor} captures ${lane.location.name}!`);

        const replaced = [...next.lanes];
        replaced[laneIndex] = {
          location: null,
          playerUnits: [],
          aiUnits: [],
          playerInfluence: 0,
          aiInfluence: 0,
        };
        next = { ...next, lanes: replaced };
        next = appendLog(
          next,
          "location_cleared",
          "Battlefield cleared — play a location from hand to continue.",
        );
      }
  });

  const ps = next[actor];
  if (ps.capturedLocations >= rules.locationsToWin) {
    next = {
      ...next,
      winner: actor,
      status: actor === "player" ? "won" : "lost",
    };
    next = appendLog(next, "victory", `${actor} wins the match!`);
  }

  return next;
}
