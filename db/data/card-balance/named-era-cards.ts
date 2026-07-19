export const NAMED_ERA_CARD_BALANCE: Record<
  string,
  import("@/lib/server/card-balance").CardBalanceDef
> = {
  // Characters
  "custom-cleopatra-vii-2fadc6e5": {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "The last Ptolemy to rule as Pharaoh—she wagered on Rome's generals, lost to Rome's legions, and chose an asp's bite rather than a conqueror's triumph.",
  },
  "custom-hatshepsut-def90c02": {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "balanced",
    flavorText:
      "She wore the false beard of kings and ruled as Pharaoh in her own name. While rivals were chiselled from the walls, her obelisks still shout across the centuries.",
  },
  "custom-george-i-04632353": {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "He spoke little English and loved Hanover more than London, yet his crown steadied a kingdom still haunted by civil war and disputed succession.",
  },
  "custom-george-ii-bc3e1dec": {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "At Dettingen he rode into musket fire—the last British king to lead his soldiers on the battlefield—and lent the Hanoverian line its stubborn nerve.",
  },
  "custom-george-iii-a774e308": {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "Madness and majesty shared his throne; he lost America, endured riot and war, and outlived storms of opinion to die the longest-reigning king.",
  },
  "custom-george-iv-e9e37ce9": {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "balanced",
    flavorText:
      "He spent a fortune on palaces and pageantry while the country groaned under debt. Flamboyant, ridiculed, unforgettable—he turned the crown into theatre.",
  },
  "custom-william-iv-8d75413f": {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "The Sailor King cast off the navy's discipline for parliament's quarrels, and in his short reign opened the door to a reformed Britain.",
  },
  "custom-henry-viii-4830a1c1": {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "aggressive",
    flavorText:
      "Six marriages, one break with Rome, and a crown that answered to no pope—he remade England's soul to suit his dynasty and his appetite.",
  },
  "custom-william-the-conqueror-3a817566": {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "He crossed the Channel with iron hooves and Norman steel; by sunset at Senlac, England had a new dynasty written in blood.",
  },
  "custom-sukarno-c493004c": {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "When the colonial flag still flew, he proclaimed merdeka to a waiting archipelago. With voice, defiance, and vision he forged a nation from a thousand islands.",
  },
  "custom-general-sudirman-c62a755e": {
    rarity: "epic",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "Young in rank but steadfast in command, he led a barefoot army through jungle and rice fields. Illness could not unseat him—only the struggle for merdeka mattered.",
  },
  "custom-boudica-22d5054a": {
    rarity: "legendary",
    archetype: "warrior",
    statProfile: "aggressive",
    attackAdjust: -4,
    defenseAdjust: 4,
    flavorText:
      "When Rome flogged a queen and seized her kingdom, she answered with fire—Camulodunum, Verulamium, and Londinium burned in her wrath.",
  },
  "custom-caratacus-fb888308": {
    rarity: "legendary",
    archetype: "warrior",
    statProfile: "balanced",
    flavorText:
      "Hunted through the Welsh hills, captured before Claudius, yet he spoke as a king unbroken—and Rome, astonished, let him live.",
  },
  "custom-arthur-camelot-3f889046": {
    rarity: "mythic",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "The sword from the stone, the Round Table, and a kingdom summoned from legend—when Arthur rides, enemies learn that myth can cut as deep as steel.",
  },
  "custom-merlin-camelot-52cfcf6e": {
    rarity: "mythic",
    archetype: "scholar",
    statProfile: "fortress",
    defenseAdjust: 10,
    flavorText:
      "Born of air and prophecy, he bends fate behind a wall of wards and counsel—the war is won in whispers long before the spear breaks.",
  },

  // Roman Britain units
  "roman-britain-1": {
    rarity: "common",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "When the eagles marched inland, the war-bands did not scatter—they painted themselves for death and met iron with fury.",
  },
  "roman-britain-2": {
    rarity: "common",
    archetype: "scholar",
    statProfile: "fortress",
    flavorText:
      "The ouate read the birds, the bones, and the boundary stones—keeper of tribal memory when Rome tried to rewrite it.",
  },
  "roman-britain-3": {
    rarity: "common",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "Rome gave him a diadem and a magistrate's seal. He bowed in the forum and ruled in the hillfort, smiling at both masters.",
  },
  "roman-britain-4": {
    rarity: "uncommon",
    archetype: "merchant",
    statProfile: "defensive",
    flavorText:
      "From the grazing hills to the tribal markets, he drove horn and hide along paths Rome's surveyors never mapped.",
  },
  "roman-britain-5": {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "skirmisher",
    flavorText:
      "Woad marked him as death's herald before the first blow fell. Legionaries learned to dread the blue streaks gleaming in the mist.",
  },
  "roman-britain-6": {
    rarity: "rare",
    archetype: "scholar",
    statProfile: "fortress",
    flavorText:
      "In oak groves older than Rome, he read the sky, the sick, and the omens—and told no centurion what the gods had said.",
  },
  "roman-britain-7": {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "No province stamped his authority, yet the hill tribes rose when he called—an insurgent king Rome could not buy and could not ignore.",
  },
  "roman-britain-8": {
    rarity: "epic",
    archetype: "merchant",
    statProfile: "balanced",
    flavorText:
      "Cornwall's tin flowed to the Mediterranean while Rome watched its frontiers. He weighed every ingot and knew the empire's hunger.",
  },

  // Ancient Greece – Classical units
  "ancient-greece-classical-1": {
    rarity: "common",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "He closed in the press of battle where the spear broke and the xiphos did its work—Greek war turned intimate and merciless.",
  },
  "ancient-greece-classical-2": {
    rarity: "common",
    archetype: "scholar",
    statProfile: "fortress",
    flavorText:
      "Like the father of history before him, he set down what was seen and heard—so the deeds of Greeks and barbarians would not vanish with the witnesses.",
  },
  "ancient-greece-classical-3": {
    rarity: "common",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "For a year he held the archonship and spoke for the polis. Debate in the assembly rose and fell, but the city's law bore his name.",
  },
  "ancient-greece-classical-4": {
    rarity: "uncommon",
    archetype: "merchant",
    statProfile: "defensive",
    flavorText:
      "Wine, olives, gossip, and credit changed hands under his awning. The agora's noise was his ledger, and Athens ran on what he sold.",
  },
  "ancient-greece-classical-5": {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "offensive",
    flavorText:
      "With the hoplon locked in the phalanx he did not yield a palm's breadth of ground. Sparta asked for nothing louder than his silence in the line.",
  },
  "ancient-greece-classical-6": {
    rarity: "rare",
    archetype: "scholar",
    statProfile: "fortress",
    flavorText:
      "Beneath the colonnades he asked what virtue is, what the good life demands, and whether a city can be just. Athens listened, then argued back.",
  },
  "ancient-greece-classical-7": {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "Invested with full command, he held the fate of fleet and phalanx in one voice. When the strategos spoke, allies marched or hesitated as one.",
  },
  "ancient-greece-classical-8": {
    rarity: "epic",
    archetype: "merchant",
    statProfile: "balanced",
    flavorText:
      "He weighed the grain, taxed the ships, and kept the Piraeus honest—or close enough. When trade flowed, Athens ate; when it stalled, the city noticed.",
  },

  // Roman Empire units
  "roman-empire-1": {
    rarity: "common",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "He marched in the testudo, threw the pilum, and closed with the gladius—discipline forged into steel at the empire's edge.",
  },
  "roman-empire-2": {
    rarity: "common",
    archetype: "scholar",
    statProfile: "fortress",
    flavorText:
      "Every levy, every grain ration, every promotion passed through his tablets—and the machine of empire ran on his ink.",
  },
  "roman-empire-3": {
    rarity: "common",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "From the curule seat he spoke with the weight of law. Senators listened, provincials petitioned, and Rome's order held.",
  },
  "roman-empire-4": {
    rarity: "uncommon",
    archetype: "merchant",
    statProfile: "defensive",
    flavorText:
      "In the Forum's clamour he found profit—contracts, loans, and favours traded faster than any edict could follow.",
  },
  "roman-empire-5": {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "offensive",
    flavorText:
      "They chose emperors and unmade them. The Praetorian barracks ran with politics as much as blood.",
  },
  "roman-empire-6": {
    rarity: "rare",
    archetype: "scholar",
    statProfile: "fortress",
    flavorText:
      "Fortune could strip him of all but reason, and reason alone was enough. In Rome's courts, his calm outlasted every storm.",
  },
  "roman-empire-7": {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "The eagles still flew for Rome, but in the provinces a rival standard rose—and legions learned to question who truly wore the purple.",
  },
  "roman-empire-8": {
    rarity: "epic",
    archetype: "merchant",
    statProfile: "balanced",
    flavorText:
      "He commanded the fleets that fed Rome—grain from Africa, oil from Spain—and the city held its breath when his ships were late.",
  },

  // Ancient Egypt – Old Kingdom units
  "ancient-egypt-old-kingdom-1": {
    rarity: "common",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "A bronze khopesh in the pharaoh's host—he meets the enemy at the ford and does not yield the first palm's breadth of Nile mud.",
  },
  "ancient-egypt-old-kingdom-2": {
    rarity: "common",
    archetype: "scholar",
    statProfile: "fortress",
    flavorText:
      "He sets down grain tallies, temple offerings, and the king's victories on papyrus—what is written in the Old Kingdom outlives tomb and dynasty alike.",
  },
  "ancient-egypt-old-kingdom-3": {
    rarity: "common",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "Crown not yet his, yet he governs when the pharaoh is young or absent—patience and vigilance keep the Two Lands from fracturing.",
  },
  "ancient-egypt-old-kingdom-4": {
    rarity: "uncommon",
    archetype: "merchant",
    statProfile: "defensive",
    flavorText:
      "From Memphis to the delta markets he moves grain, linen, and credit; armies march on bread before they march on bronze.",
  },
  "ancient-egypt-old-kingdom-5": {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "offensive",
    flavorText:
      "Six-spoked wheels, bow at full draw, and the thunder of hooves across the desert flank—the chariot corps strikes before the infantry can answer.",
  },
  "ancient-egypt-old-kingdom-6": {
    rarity: "rare",
    archetype: "scholar",
    statProfile: "fortress",
    flavorText:
      "In the House of Life he reads omens, tends the sick, and speaks for ma'at when steel would only deepen the quarrel.",
  },
  "ancient-egypt-old-kingdom-7": {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "He does not merely inherit the throne—he seizes it, daring rivals to test whether the crook and flail or the challenger breaks first.",
  },
  "ancient-egypt-old-kingdom-8": {
    rarity: "rare",
    archetype: "merchant",
    statProfile: "balanced",
    flavorText:
      "He weighs the harvest, taxes the river traffic, and keeps Memphis honest—or close enough. When trade flows, Egypt eats; when it stalls, the kingdom notices.",
  },

  // Signature units
  "unit-fallen-martyr": {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "defensive",
    flavorText: "Their sacrifice echoes beyond the grave.",
    customAbility: {
      abilityName: "Martyrdom",
      abilityEffect: "vs_higher_rarity_attack",
      abilityValue: 10,
      abilityTrigger: "death",
    },
  },
  "unit-rally-captain": {
    rarity: "rare",
    archetype: "leader",
    statProfile: "balanced",
    flavorText: "Inspires the host at the opening of battle.",
    customAbility: {
      abilityName: "Opening Rally",
      abilityEffect: "flat_attack",
      abilityValue: 8,
      abilityTrigger: "campaign_start",
    },
  },
  "unit-occupation-force": {
    rarity: "rare",
    archetype: "leader",
    statProfile: "defensive",
    flavorText: "Establishes a foothold the moment they arrive.",
    customAbility: {
      abilityName: "Beachhead",
      abilityEffect: "add_influence",
      abilityValue: 1,
      abilityTrigger: "deploy",
    },
  },
  "unit-coastal-navigator": {
    rarity: "uncommon",
    archetype: "sailor",
    statProfile: "defensive",
    flavorText: "Knows every tide and inlet.",
    customAbility: {
      abilityName: "Sea Legs",
      abilityEffect: "flat_defense",
      abilityValue: 8,
    },
  },
  "unit-trade-convoy": {
    rarity: "uncommon",
    archetype: "merchant",
    statProfile: "fortress",
    flavorText: "Brings supplies and momentum to the front.",
    customAbility: {
      abilityName: "Supply Line",
      abilityEffect: "flat_attack",
      abilityValue: 5,
      abilityTrigger: "deploy",
    },
  },
  "unit-royal-chronicler": {
    rarity: "uncommon",
    archetype: "scholar",
    statProfile: "fortress",
    flavorText: "Records every maneuver for posterity.",
    customAbility: {
      abilityName: "Fresh Insight",
      abilityEffect: "draw_card",
      abilityValue: 1,
      abilityTrigger: "deploy",
    },
  },
  "custom-georgian-sailor-3f35d93c": {
    rarity: "common",
    archetype: "sailor",
    statProfile: "skirmisher",
    flavorText:
      "He knows the Channel's moods and the navy's drill—quick on the yards, quicker when the watch turns hostile.",
  },

  // Special locations
  "location-hadrians-wall": {
    rarity: "epic",
    statProfile: "defensive",
    flavorText: "A frontier that bends but does not break.",
    locationAbility: {
      abilityName: "Frontier Hold",
      abilityEffect: "flat_defense",
      abilityValue: 40,
    },
  },
  "location-westminster-hall": {
    rarity: "legendary",
    statProfile: "defensive",
    flavorText: "Parliament's heart beats with authority.",
    locationAbility: {
      abilityName: "Seat of Power",
      abilityEffect: "flat_defense",
      abilityValue: 60,
    },
  },
  "location-portsmouth-dockyards": {
    rarity: "rare",
    statProfile: "defensive",
    flavorText: "The fleet gathers before the storm.",
    locationAbility: {
      abilityName: "Naval Base",
      abilityEffect: "flat_defense",
      abilityValue: 30,
    },
  },
};
