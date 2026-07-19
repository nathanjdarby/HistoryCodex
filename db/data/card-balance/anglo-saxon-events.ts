import type { CardBalanceDef } from "@/lib/server/card-balance";

/** Anglo-Saxon era event cards (Alfred / Wessex starter support). */
export const ANGLO_SAXON_EVENT_BALANCE: Record<string, CardBalanceDef> = {
  "event-danegeld": {
    rarity: "common",
    flavorText:
      "Silver bought breathing room when the host was spent—tribute to the Dane until the fyrd could stand again.",
    eventAbility: {
      abilityName: "Tribute Payment",
      abilityEffect: "vs_lower_rarity_attack",
      abilityValue: 15,
    },
  },
  "event-fyrd-muster": {
    rarity: "common",
    flavorText:
      "The shire reeve called every able freeman—spears from barns, shields from halls, the levy mustered before the raiders returned.",
    eventAbility: {
      abilityName: "Levy Scouts",
      abilityEffect: "scry",
      abilityValue: 2,
    },
  },
  "event-burh-fortification": {
    rarity: "common",
    flavorText:
      "Alfred ringed Wessex with fortified towns—each burh a knot in the net that could not be cut at a single stroke.",
    eventAbility: {
      abilityName: "Burh Wall",
      abilityEffect: "flat_defense",
      abilityValue: 10,
    },
  },
  "event-battle-of-edington": {
    rarity: "uncommon",
    flavorText:
      "At Edington field Alfred broke Guthrum's host and chased the Danes to their camp—the shield-wall held when England seemed lost.",
    eventAbility: {
      abilityName: "Wessex Counterstroke",
      abilityEffect: "flat_attack",
      abilityValue: 12,
    },
  },
  "event-treaty-of-wedmore": {
    rarity: "uncommon",
    flavorText:
      "Beatten foe became baptised ally—Guthrum took the chrism at Wedmore and East Anglia learned to live beside Wessex.",
    eventAbility: {
      abilityName: "Peace Oath",
      abilityEffect: "heal_unit",
      abilityValue: 18,
    },
  },
  "event-lindisfarne-raid": {
    rarity: "uncommon",
    flavorText:
      "Dragon-prowed ships struck the holy isle in 793—blood on the stones of Lindisfarne, and England woke to the Viking Age.",
    eventAbility: {
      abilityName: "Sudden Raid",
      abilityEffect: "vs_higher_rarity_attack",
      abilityValue: 20,
    },
  },
};
