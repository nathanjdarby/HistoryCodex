import type { CardBalanceDef } from "@/lib/server/card-balance";

export const GLOBAL_EVENT_BALANCE: Record<string, CardBalanceDef> = {
  "event-royal-survey": {
    rarity: "common",
    flavorText: "Scry the chronicles before the battle begins.",
    eventAbility: { abilityName: "Royal Survey", abilityEffect: "scry", abilityValue: 2 },
  },
  "event-westminster-archives": {
    rarity: "rare",
    flavorText: "Search the records for the right commander.",
    eventAbility: { abilityName: "Archive Search", abilityEffect: "search_deck", abilityValue: 5 },
  },
  "event-historical-revision": {
    rarity: "uncommon",
    flavorText: "Rewrite the record; restore a lost asset.",
    eventAbility: {
      abilityName: "Selective Recall",
      abilityEffect: "discard_to_hand",
      abilityValue: 1,
    },
  },
  "event-mobilize-reserves": {
    rarity: "common",
    flavorText: "Cut the weak link; reinforce the line.",
    eventAbility: {
      abilityName: "Supply Requisition",
      abilityEffect: "discard_draw",
      abilityValue: 2,
    },
  },
  "event-field-surgeon": {
    rarity: "common",
    flavorText: "Patch the wounded before the next clash.",
    eventAbility: { abilityName: "Field Repair", abilityEffect: "heal_unit", abilityValue: 15 },
  },
  "event-proclamation": {
    rarity: "rare",
    flavorText: "A decree shifts the balance of power.",
    eventAbility: { abilityName: "Propaganda Push", abilityEffect: "add_influence", abilityValue: 1 },
  },
  "event-undermine-authority": {
    rarity: "epic",
    flavorText: "Sow doubt among the occupiers.",
    eventAbility: {
      abilityName: "Counter-Influence",
      abilityEffect: "remove_influence",
      abilityValue: 1,
    },
  },
  "event-war-bonds": {
    rarity: "uncommon",
    flavorText: "Finance the next deployment at a discount.",
    eventAbility: { abilityName: "War Bonds", abilityEffect: "cost_reduction", abilityValue: 15 },
  },
  "event-protracted-siege": {
    rarity: "rare",
    flavorText: "Delay the enemy's claim to the territory.",
    eventAbility: {
      abilityName: "Siege Delay",
      abilityEffect: "block_influence_gain",
      abilityValue: 1,
    },
  },
  "event-relocate-capital": {
    rarity: "legendary",
    flavorText: "Move the seat of power to fresher ground.",
    eventAbility: {
      abilityName: "Relocate Capital",
      abilityEffect: "replace_location",
      abilityValue: 1,
    },
  },
};
