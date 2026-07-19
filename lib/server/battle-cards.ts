import type { InferSelectModel } from "drizzle-orm";
import { characters, eras } from "@/db/schema";
import type { AbilityEffect, CardSnapshot, Rarity } from "@/lib/battle/types";

type CharacterRow = InferSelectModel<typeof characters>;
type EraRow = InferSelectModel<typeof eras>;

export function toCardSnapshot(
  character: CharacterRow,
  era: Pick<EraRow, "name" | "colorPrimary" | "colorSecondary">,
): CardSnapshot {
  return {
    characterId: character.id,
    name: character.name,
    cost: character.cost,
    attack: character.attack,
    defense: character.defense,
    eraId: character.eraId,
    eraName: era.name,
    eraColorPrimary: era.colorPrimary,
    eraColorSecondary: era.colorSecondary,
    rarity: character.rarity as Rarity,
    archetype: character.archetype,
    cardType: character.cardType,
    abilityName: character.abilityName,
    abilityEffect: character.abilityEffect as AbilityEffect | null,
    abilityValue: character.abilityValue,
    abilityTrigger: (character.abilityTrigger ?? null) as import("@/lib/battle/types").AbilityTrigger | null,
    imageUrl: character.imageUrl,
    seed: character.seed,
    flavorText: character.flavorText,
    imageFocusX: character.imageFocusX,
    imageFocusY: character.imageFocusY,
    imageScale: character.imageScale,
    holographic: character.holographic,
  };
}

export function expandDeckSnapshots(
  cards: CardSnapshot[],
  quantities: Map<number, number>,
): CardSnapshot[] {
  const deck: CardSnapshot[] = [];
  for (const card of cards) {
    const qty = quantities.get(card.characterId) ?? 0;
    for (let i = 0; i < qty; i++) deck.push({ ...card });
  }
  return deck;
}
