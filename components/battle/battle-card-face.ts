import type { AbilityTrigger, BoardUnit, CardSnapshot } from "@/lib/battle/types";
import type { CharacterCardPreviewProps } from "@/components/character-card-preview";
import type { ImageFrame } from "@/lib/image-frame";
import { clampImageFrame } from "@/lib/image-frame";
import { dexNumber } from "@/lib/rarity";
import type { Character, Era } from "@/lib/types";
import type { Archetype } from "@/lib/sprite/generateSprite";

export type BattleCardFace = {
  characterId: number;
  name: string;
  cost: number;
  attack: number;
  defense: number;
  eraName: string;
  eraColorPrimary: string;
  eraColorSecondary: string;
  rarity: CardSnapshot["rarity"];
  archetype: string | null;
  cardType: CardSnapshot["cardType"];
  abilityName: string | null;
  abilityEffect: CardSnapshot["abilityEffect"];
  abilityValue: number | null;
  abilityTrigger: AbilityTrigger | null;
  imageUrl: string | null;
  seed: string;
  flavorText: string | null;
  imageFocusX?: number;
  imageFocusY?: number;
  imageScale?: number;
  holographic?: boolean;
};

const FALLBACK_ERA = {
  eraColorPrimary: "#3d3228",
  eraColorSecondary: "#1a1510",
};

export function cardSnapshotToFace(card: CardSnapshot): BattleCardFace {
  return {
    characterId: card.characterId,
    name: card.name,
    cost: card.cost,
    attack: card.attack,
    defense: card.defense,
    eraName: card.eraName,
    eraColorPrimary: card.eraColorPrimary ?? FALLBACK_ERA.eraColorPrimary,
    eraColorSecondary: card.eraColorSecondary ?? FALLBACK_ERA.eraColorSecondary,
    rarity: card.rarity,
    archetype: card.archetype,
    cardType: card.cardType,
    abilityName: card.abilityName,
    abilityEffect: card.abilityEffect,
    abilityValue: card.abilityValue,
    abilityTrigger: card.abilityTrigger,
    imageUrl: card.imageUrl,
    seed: card.seed,
    flavorText: card.flavorText ?? null,
    imageFocusX: card.imageFocusX,
    imageFocusY: card.imageFocusY,
    imageScale: card.imageScale,
    holographic: card.holographic,
  };
}

export function characterToBattleCardFace(
  character: Character & { era?: Pick<Era, "name" | "colorPrimary" | "colorSecondary"> },
): BattleCardFace {
  return {
    characterId: character.id,
    name: character.name,
    cost: character.cost,
    attack: character.attack,
    defense: character.defense,
    eraName: character.era?.name ?? "",
    eraColorPrimary: character.era?.colorPrimary ?? FALLBACK_ERA.eraColorPrimary,
    eraColorSecondary: character.era?.colorSecondary ?? FALLBACK_ERA.eraColorSecondary,
    rarity: character.rarity,
    archetype: character.archetype,
    cardType: character.cardType,
    abilityName: character.abilityName,
    abilityEffect: character.abilityEffect as CardSnapshot["abilityEffect"],
    abilityValue: character.abilityValue,
    abilityTrigger: (character.abilityTrigger ?? null) as AbilityTrigger | null,
    imageUrl: character.imageUrl,
    seed: character.seed,
    flavorText: character.flavorText,
    imageFocusX: character.imageFocusX ?? undefined,
    imageFocusY: character.imageFocusY ?? undefined,
    imageScale: character.imageScale ?? undefined,
    holographic: character.holographic ?? false,
  };
}

export function boardUnitToFace(unit: BoardUnit): BattleCardFace {
  return {
    characterId: unit.characterId,
    name: unit.name,
    cost: unit.cost ?? 0,
    attack: unit.baseAttack + unit.tempAttackBonus,
    defense: unit.currentDefense,
    eraName: unit.eraName ?? "",
    eraColorPrimary: unit.eraColorPrimary ?? FALLBACK_ERA.eraColorPrimary,
    eraColorSecondary: unit.eraColorSecondary ?? FALLBACK_ERA.eraColorSecondary,
    rarity: unit.rarity,
    archetype: unit.archetype,
    cardType: unit.cardType ?? "character",
    abilityName: unit.abilityName,
    abilityEffect: unit.abilityEffect,
    abilityValue: unit.abilityValue,
    abilityTrigger: unit.abilityTrigger,
    imageUrl: unit.imageUrl ?? null,
    seed: unit.seed ?? `${unit.characterId}-${unit.instanceId}`,
    flavorText: unit.flavorText ?? null,
    imageFocusX: unit.imageFocusX,
    imageFocusY: unit.imageFocusY,
    imageScale: unit.imageScale,
    holographic: unit.holographic,
  };
}

function imageFrameFromFace(card: BattleCardFace): ImageFrame | undefined {
  if (
    card.imageFocusX == null &&
    card.imageFocusY == null &&
    card.imageScale == null
  ) {
    return undefined;
  }
  return clampImageFrame({
    focusX: card.imageFocusX,
    focusY: card.imageFocusY,
    scale: card.imageScale,
  });
}

export function battleCardFaceToPreviewProps(
  card: BattleCardFace,
  options?: {
    flavorText?: string | null;
    showCost?: boolean;
    showCombat?: boolean;
  },
): CharacterCardPreviewProps {
  return {
    name: card.name,
    rarity: card.rarity,
    cardType: card.cardType,
    cost: card.cost,
    attack: card.attack,
    defense: card.defense,
    archetype: card.archetype as Archetype | null,
    era: {
      name: card.eraName,
      colorPrimary: card.eraColorPrimary,
      colorSecondary: card.eraColorSecondary,
    },
    abilityName: card.abilityName,
    abilityEffect: card.abilityEffect,
    abilityValue: card.abilityValue,
    abilityTrigger: card.abilityTrigger,
    flavorText: options?.flavorText ?? card.flavorText,
    seed: card.seed,
    imageUrl: card.imageUrl,
    imageFrame: imageFrameFromFace(card),
    holographic: card.holographic ?? false,
    dexLabel: dexNumber(card.characterId),
    density: "full",
    showCost: options?.showCost,
    showCombat: options?.showCombat,
  };
}
