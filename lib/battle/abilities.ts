import { HIGH_RARITIES } from "@/lib/battle/constants";
import { sailorDefenseBonus } from "@/lib/battle/triggers";
import type { BattleRules, BoardUnit, CardSnapshot, Lane, PlayerId } from "@/lib/battle/types";
import { unitsInLane } from "@/lib/battle/types";

export function eraSynergyBonus(unit: CardSnapshot, location: CardSnapshot | null): number {
  if (!location) return 0;
  if (unit.eraId !== location.eraId) return 0;
  if (location.abilityEffect !== "flat_defense" || location.abilityValue == null) return 0;
  return location.abilityValue;
}

export function monarchCountInLane(lane: Lane, owner: PlayerId): number {
  return unitsInLane(lane, owner).filter(
    (u) => u.archetype === "monarch" && u.currentDefense > 0 && !u.auraSuppressed,
  ).length;
}

export function scholarCountForPlayer(
  state: import("@/lib/battle/types").MatchState,
  player: PlayerId,
): number {
  return state.lanes.reduce((sum, lane) => {
    return sum + unitsInLane(lane, player).filter((u) => u.archetype === "scholar" && u.currentDefense > 0).length;
  }, 0);
}

/** Maximum DEF before damage, including temporary bonuses. */
export function effectiveMaxDefense(unit: BoardUnit, location: CardSnapshot | null): number {
  const locationBonus = location
    ? eraSynergyBonus(
        {
          characterId: unit.characterId,
          eraId: unit.eraId,
          cardType: unit.cardType,
        } as CardSnapshot,
        location,
      )
    : 0;
  const sailorBonus = sailorDefenseBonus(unit, location);
  return Math.max(1, unit.baseDefense + unit.tempDefenseBonus + locationBonus + sailorBonus);
}

export function currentDefenseFromDamage(unit: BoardUnit, location: CardSnapshot | null): number {
  return Math.max(0, effectiveMaxDefense(unit, location) - unit.damageTaken);
}

export function applyDamageToUnit(unit: BoardUnit, amount: number): BoardUnit {
  return { ...unit, damageTaken: unit.damageTaken + Math.max(0, amount) };
}

export function healUnitDefense(
  unit: BoardUnit,
  amount: number,
  location: CardSnapshot | null,
): BoardUnit {
  const max = effectiveMaxDefense(unit, location);
  const current = Math.max(0, max - unit.damageTaken);
  const healed = Math.min(max, current + amount);
  return { ...unit, damageTaken: Math.max(0, max - healed) };
}

export function recalculateUnitDefense(unit: BoardUnit, location: CardSnapshot | null): BoardUnit {
  return syncUnitCurrentDefense(unit, location);
}

export function recalculateLaneEraSynergy(lane: Lane): Lane {
  return syncLaneUnitDefenses(lane);
}

export function clearTemporaryLaneEffects(lane: Lane): Lane {
  const clearSide = (units: BoardUnit[]) =>
    units.map((u) => ({
      ...u,
      tempAttackBonus: 0,
      tempDefenseBonus: 0,
    }));
  return {
    ...lane,
    playerUnits: clearSide(lane.playerUnits),
    aiUnits: clearSide(lane.aiUnits),
    attacksBlocked: false,
  };
}

export function isUnitAlive(unit: BoardUnit, location: CardSnapshot | null): boolean {
  return currentDefenseFromDamage(unit, location) > 0;
}

export function effectiveAttack(
  unit: BoardUnit,
  lane: Lane,
  rules: BattleRules,
  targetRarity?: string,
  monarchAuraSuppressed = false,
): number {
  let atk = unit.baseAttack + unit.tempAttackBonus;

  if (!monarchAuraSuppressed && unit.archetype !== "monarch" && !unit.auraSuppressed) {
    const monarchs = monarchCountInLane(lane, unit.owner);
    if (monarchs > 0) {
      const aura = rules.monarchAuraStacking
        ? rules.monarchAuraAttack * monarchs
        : rules.monarchAuraAttack;
      atk += aura;
    }
  }

  if (
    unit.archetype === "warrior" &&
    targetRarity &&
    HIGH_RARITIES.has(targetRarity) &&
    unit.abilityEffect === "vs_higher_rarity_attack"
  ) {
    const warriorComponent = unit.baseAttack + unit.tempAttackBonus;
    atk = warriorComponent * 2 + (atk - warriorComponent);
  }

  if (unit.abilityEffect === "flat_attack" && unit.abilityValue) {
    atk += unit.abilityValue;
  }

  return Math.max(0, atk);
}

export function getLeaderInfluenceBonus(
  lane: Lane,
  owner: PlayerId,
  rules: BattleRules,
): number {
  const leaders = unitsInLane(lane, owner).filter(
    (u) => u.archetype === "leader" && u.currentDefense > 0,
  );
  if (leaders.length === 0) return 0;
  return rules.leaderBonusStacks
    ? rules.leaderInfluenceBonus * leaders.length
    : rules.leaderInfluenceBonus;
}

export function syncUnitCurrentDefense(unit: BoardUnit, location: CardSnapshot | null): BoardUnit {
  const locationDefBonus = location
    ? eraSynergyBonus(
        { characterId: unit.characterId, eraId: unit.eraId, cardType: unit.cardType } as CardSnapshot,
        location,
      )
    : 0;
  const sailorDefBonus = sailorDefenseBonus(unit, location);
  const currentDefense = currentDefenseFromDamage(
    { ...unit, locationDefBonus, sailorDefBonus },
    location,
  );
  return {
    ...unit,
    locationDefBonus,
    sailorDefBonus,
    eraSynergyBonus: locationDefBonus,
    currentDefense,
  };
}

export function syncLaneUnitDefenses(lane: Lane): Lane {
  const loc = lane.location;
  return {
    ...lane,
    playerUnits: lane.playerUnits.map((u) => syncUnitCurrentDefense(u, loc)),
    aiUnits: lane.aiUnits.map((u) => syncUnitCurrentDefense(u, loc)),
  };
}

export function cardToBoardUnit(
  card: CardSnapshot,
  owner: PlayerId,
  instanceId: string,
  deployedTurn: number,
  location: CardSnapshot | null = null,
): BoardUnit {
  const unit: BoardUnit = {
    instanceId,
    characterId: card.characterId,
    name: card.name,
    owner,
    cardType: card.cardType,
    baseAttack: card.attack,
    baseDefense: card.defense,
    currentDefense: card.defense,
    damageTaken: 0,
    eraId: card.eraId,
    eraName: card.eraName,
    eraColorPrimary: card.eraColorPrimary,
    eraColorSecondary: card.eraColorSecondary,
    rarity: card.rarity,
    archetype: card.archetype,
    abilityName: card.abilityName,
    abilityEffect: card.abilityEffect,
    abilityValue: card.abilityValue,
    abilityTrigger: card.abilityTrigger ?? null,
    imageUrl: card.imageUrl,
    seed: card.seed,
    flavorText: card.flavorText,
    cost: card.cost,
    imageFocusX: card.imageFocusX,
    imageFocusY: card.imageFocusY,
    imageScale: card.imageScale,
    holographic: card.holographic,
    eraSynergyBonus: 0,
    locationDefBonus: 0,
    sailorDefBonus: 0,
    tempAttackBonus: 0,
    tempDefenseBonus: 0,
    summoningSickness: true,
    deployedTurn,
    cannotAttack: false,
    isCommitted: false,
    committedUntilTurn: null,
    cannotEstablishInfluence: false,
    auraSuppressed: false,
  };
  return syncUnitCurrentDefense(unit, location);
}

export function warriorsInLane(lane: Lane, owner: PlayerId): BoardUnit[] {
  return unitsInLane(lane, owner).filter(
    (u) => u.archetype === "warrior" && u.currentDefense > 0,
  );
}

export function mustTargetWarriorFirst(lane: Lane, defenderOwner: PlayerId): boolean {
  return warriorsInLane(lane, defenderOwner).length > 0;
}

export function isValidAttackTarget(
  lane: Lane,
  defender: BoardUnit,
  defenderOwner: PlayerId,
  target: BoardUnit,
): boolean {
  if (target.owner !== defenderOwner) return false;
  const warriors = warriorsInLane(lane, defenderOwner);
  if (warriors.length === 0) return true;
  return target.archetype === "warrior";
}

export function adjacentLaneIndexes(laneIndex: number, laneCount: number): number[] {
  const adjacent: number[] = [];
  if (laneIndex > 0) adjacent.push(laneIndex - 1);
  if (laneIndex < laneCount - 1) adjacent.push(laneIndex + 1);
  return adjacent;
}

export function hasUnificationAbility(card: CardSnapshot): boolean {
  return card.abilityName?.toLowerCase().includes("unification") ?? false;
}

export function opponentUnits(
  state: import("@/lib/battle/types").MatchState,
  player: PlayerId,
  laneIndex: number,
): BoardUnit[] {
  const lane = state.lanes[laneIndex];
  if (!lane) return [];
  return unitsInLane(lane, player === "player" ? "ai" : "player");
}

export function friendlyUnits(
  state: import("@/lib/battle/types").MatchState,
  player: PlayerId,
  laneIndex: number,
): BoardUnit[] {
  const lane = state.lanes[laneIndex];
  if (!lane) return [];
  return unitsInLane(lane, player);
}

export function cardSnapshotFromUnit(unit: BoardUnit): CardSnapshot {
  return {
    characterId: unit.characterId,
    name: unit.name,
    cost: unit.cost,
    attack: unit.baseAttack,
    defense: unit.baseDefense,
    eraId: unit.eraId,
    eraName: unit.eraName,
    eraColorPrimary: unit.eraColorPrimary,
    eraColorSecondary: unit.eraColorSecondary,
    rarity: unit.rarity,
    archetype: unit.archetype,
    cardType: unit.cardType,
    abilityName: unit.abilityName,
    abilityEffect: unit.abilityEffect,
    abilityValue: unit.abilityValue,
    abilityTrigger: unit.abilityTrigger,
    imageUrl: unit.imageUrl,
    seed: unit.seed,
    flavorText: unit.flavorText,
    imageFocusX: unit.imageFocusX,
    imageFocusY: unit.imageFocusY,
    imageScale: unit.imageScale,
    holographic: unit.holographic,
  };
}
