import { HIGH_RARITIES } from "@/lib/battle/constants";
import { sailorDefenseBonus } from "@/lib/battle/triggers";
import type {
  BattleRules,
  BoardUnit,
  CardSnapshot,
  Lane,
  MatchState,
  PlayerId,
} from "@/lib/battle/types";
import { opponentOf, unitsInLane } from "@/lib/battle/types";

export function eraSynergyBonus(unit: CardSnapshot, location: CardSnapshot | null): number {
  if (!location) return 0;
  if (unit.eraId !== location.eraId) return 0;
  if (location.abilityEffect !== "flat_defense" || location.abilityValue == null) return 0;
  return location.abilityValue;
}

export function monarchCountInLane(lane: Lane, owner: PlayerId): number {
  return unitsInLane(lane, owner).filter((u) => u.archetype === "monarch").length;
}

export function scholarCountForPlayer(state: MatchState, player: PlayerId): number {
  return state.lanes.reduce((sum, lane) => {
    return sum + unitsInLane(lane, player).filter((u) => u.archetype === "scholar").length;
  }, 0);
}

export function effectiveAttack(
  unit: BoardUnit,
  lane: Lane,
  rules: BattleRules,
  targetRarity?: string,
): number {
  let atk = unit.baseAttack + unit.tempAttackBonus;
  const monarchs = monarchCountInLane(lane, unit.owner);
  if (unit.archetype !== "monarch" && monarchs > 0) {
    atk += rules.monarchAuraAttack * monarchs;
  }
  if (
    unit.archetype === "warrior" &&
    targetRarity &&
    HIGH_RARITIES.has(targetRarity) &&
    unit.abilityEffect === "vs_higher_rarity_attack"
  ) {
    atk *= 2;
  }
  if (unit.abilityEffect === "flat_attack" && unit.abilityValue) {
    atk += unit.abilityValue;
  }
  return Math.max(0, atk);
}

export function effectiveDefense(unit: BoardUnit, lane: Lane): number {
  let def = unit.currentDefense + unit.tempDefenseBonus;
  if (unit.abilityEffect === "flat_defense" && unit.abilityValue) {
    def += unit.abilityValue;
  }
  void lane;
  return Math.max(0, def);
}

export function cardToBoardUnit(
  card: CardSnapshot,
  owner: PlayerId,
  instanceId: string,
  deployedTurn: number,
  eraSynergy: number,
  location: CardSnapshot | null = null,
): BoardUnit {
  const sailorBonus = sailorDefenseBonus(
    {
      archetype: card.archetype,
      eraId: card.eraId,
    } as BoardUnit,
    location,
  );
  const baseDefense = card.defense + eraSynergy + sailorBonus;
  return {
    instanceId,
    characterId: card.characterId,
    name: card.name,
    owner,
    cardType: card.cardType,
    baseAttack: card.attack,
    baseDefense,
    currentDefense: baseDefense,
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
    eraSynergyBonus: eraSynergy,
    tempAttackBonus: 0,
    tempDefenseBonus: 0,
    summoningSickness: true,
    deployedTurn,
    cannotAttack: false,
  };
}

export function warriorsInLane(lane: Lane, owner: PlayerId): BoardUnit[] {
  return unitsInLane(lane, owner).filter((u) => u.archetype === "warrior");
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
  return target.archetype === "warrior" || warriors.every((w) => w.currentDefense <= 0);
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

export function opponentUnits(state: MatchState, player: PlayerId, laneIndex: number): BoardUnit[] {
  const lane = state.lanes[laneIndex];
  if (!lane) return [];
  return unitsInLane(lane, opponentOf(player));
}

export function friendlyUnits(state: MatchState, player: PlayerId, laneIndex: number): BoardUnit[] {
  const lane = state.lanes[laneIndex];
  if (!lane) return [];
  return unitsInLane(lane, player);
}
