import type { CardDesignData } from "@history-codex/card-renderer/types";
import type { AbilityEffect, AbilityTrigger } from "@/lib/battle";
import type { CardType } from "@/lib/battle/types";
import type { ImageFrame } from "@/lib/image-frame";
import type { RarityTier } from "@/lib/rarity";
import type { Archetype } from "@/lib/sprite/generateSprite";

export type CardDesignInput = {
  name: string;
  rarity: RarityTier;
  cardType: CardType;
  cost: number;
  attack: number;
  defense: number;
  archetype: Archetype | null;
  era: { name: string; colorPrimary: string; colorSecondary: string };
  abilityName: string | null;
  abilityEffect: AbilityEffect | null;
  abilityValue: number | null;
  abilityTrigger: AbilityTrigger | null;
  flavorText: string | null;
  imageUrl: string | null;
  imageFrame?: ImageFrame;
  dexLabel: string;
  locked?: boolean;
  layoutId?: string | null;
  extras?: Record<string, unknown>;
};

export function toCardDesignData(input: CardDesignInput): CardDesignData {
  return {
    name: input.name,
    rarity: input.rarity,
    cardType: input.cardType,
    cost: input.cost,
    attack: input.attack,
    defense: input.defense,
    archetype: input.archetype,
    era: input.era,
    abilityName: input.abilityName,
    abilityEffect: input.abilityEffect,
    abilityValue: input.abilityValue,
    abilityTrigger: input.abilityTrigger,
    flavorText: input.flavorText,
    imageUrl: input.imageUrl,
    imageFrame: input.imageFrame ?? { focusX: 50, focusY: 50, scale: 100 },
    holographic: false,
    dexLabel: input.dexLabel,
    locked: input.locked ?? false,
    layoutId: input.layoutId ?? null,
    extras: input.extras ?? {},
  };
}
