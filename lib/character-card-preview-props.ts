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
> & {
  era: Pick<Era, "name" | "colorPrimary" | "colorSecondary">;
};

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
    dexLabel: dexNumber(character.id),
    density: "full",
    reserveHeaderActionsSpace: false,
    ...options,
  };
}
