import type { CharacterCardPreviewProps } from "@/components/character-card-preview";
import type { AbilityEffect, AbilityTrigger } from "@/lib/battle";
import { imageFrameFromCharacter } from "@/lib/image-frame";
import { dexNumber } from "@/lib/rarity";
import type { Character, Era } from "@/lib/types";

type CharacterLike = Pick<
  Character,
  | "id"
  | "name"
  | "rarity"
  | "cardType"
  | "cost"
  | "attack"
  | "defense"
  | "archetype"
  | "abilityName"
  | "abilityEffect"
  | "abilityValue"
  | "abilityTrigger"
  | "flavorText"
  | "seed"
  | "imageUrl"
  | "imageFocusX"
  | "imageFocusY"
  | "imageScale"
  | "holographic"
  | "layoutId"
> & {
  era: Pick<Era, "name" | "colorPrimary" | "colorSecondary">;
};

/**
 * Columns already mapped explicitly onto CharacterCardPreviewProps/CardDesignData.
 * Everything else present on the row (house, future registry-backed columns) is
 * collected generically into extras — new custom columns need a schema.ts entry
 * to be queryable, but never a change here or in the render pipeline.
 */
const CHARACTER_CARD_MAPPED_KEYS = new Set<string>([
  "id",
  "eraId",
  "era",
  "name",
  "rarity",
  "cardType",
  "cost",
  "attack",
  "defense",
  "archetype",
  "abilityName",
  "abilityEffect",
  "abilityValue",
  "abilityTrigger",
  "flavorText",
  "seed",
  "imageUrl",
  "imageFocusX",
  "imageFocusY",
  "imageScale",
  "holographic",
  "layoutId",
  "createdAt",
]);

export function characterExtras(character: Record<string, unknown>): Record<string, unknown> {
  const extras: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(character)) {
    if (CHARACTER_CARD_MAPPED_KEYS.has(key)) continue;
    if (value !== undefined) extras[key] = value;
  }
  return extras;
}

export function characterToCardPreviewProps(
  character: CharacterLike,
  options: Partial<CharacterCardPreviewProps> = {},
): CharacterCardPreviewProps {
  return {
    name: character.name,
    rarity: character.rarity,
    cardType: character.cardType,
    cost: character.cost,
    attack: character.attack,
    defense: character.defense,
    archetype: character.archetype,
    era: {
      name: character.era.name,
      colorPrimary: character.era.colorPrimary,
      colorSecondary: character.era.colorSecondary,
    },
    abilityName: character.abilityName,
    abilityEffect: character.abilityEffect as AbilityEffect | null,
    abilityValue: character.abilityValue,
    abilityTrigger: character.abilityTrigger as AbilityTrigger | null,
    flavorText: character.flavorText,
    seed: character.seed,
    imageUrl: character.imageUrl,
    imageFrame: imageFrameFromCharacter(character),
    holographic: character.holographic,
    layoutId: character.layoutId != null ? String(character.layoutId) : null,
    dexLabel: dexNumber(character.id),
    density: "full",
    reserveHeaderActionsSpace: false,
    extras: characterExtras(character),
    ...options,
  };
}
