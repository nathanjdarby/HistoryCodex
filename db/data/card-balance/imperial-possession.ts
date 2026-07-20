import type { CardBalanceDef } from "@/lib/server/card-balance";

const P = "an-imperial-possession-britain-in-the-roman-empire-54-bc-ad-409";

/** David Mattingly — *An Imperial Possession*: Roman Britain catalog cards. */
export const IMPERIAL_POSSESSION_BALANCE: Record<string, CardBalanceDef> = {
  // ── Characters ──────────────────────────────────────────────────────────────

  [`${P}-character-julius-caesar`]: {
    rarity: "legendary",
    archetype: "leader",
    statProfile: "aggressive",
    customAbility: {
      abilityName: "Expeditions to Britain",
      abilityEffect: "flat_attack",
      abilityValue: 10,
    },
    flavorText:
      "Twice he crossed the Ocean with eagles and engineering—Caesar did not hold Britannia, but he proved Rome could reach it, and Britain learned its fate might be decided from the Tiber.",
  },
  [`${P}-character-claudius`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "A limping emperor who needed a triumph—Claudius sent legions to finish what Caesar began, and Britain became province while elephants and pageantry marched through Camulodunum.",
  },
  [`${P}-character-hadrian`]: {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "He toured the edges of empire and drew a line in stone—Hadrian's Wall told Caledonia that Rome would hold what it chose and no more, for now.",
  },
  [`${P}-character-agricola`]: {
    rarity: "epic",
    archetype: "leader",
    statProfile: "aggressive",
    flavorText:
      "Seven seasons he pushed north—Agricola built forts, fed his men from the sea, and at Mons Graupius thought he saw Caledonia break, until recall taught him Rome's appetite has limits.",
  },
  [`${P}-character-septimius-severus`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "aggressive",
    flavorText:
      "Africa-born emperor, brittle with gout and ambition—Severus marched Britain's legions into Caledonia again, died at Eboracum, and left sons to squander what iron had gained.",
  },
  [`${P}-character-carausius`]: {
    rarity: "rare",
    archetype: "leader",
    statProfile: "skirmisher",
    flavorText:
      "Admiral turned usurper—Carausius seized the Classis Britannica, minted his own coins, and ruled the Channel until treachery, not Rome, brought him down.",
  },

  // ── Events ──────────────────────────────────────────────────────────────────

  [`${P}-event-claudian-conquest-of-britain`]: {
    rarity: "legendary",
    eventAbility: {
      abilityName: "Province Declared",
      abilityEffect: "add_influence",
      abilityValue: 2,
    },
    flavorText:
      "In AD 43 four legions landed and did not leave—Catuvellauni resistance broke, client kings bowed, and Britannia entered the empire on Roman terms.",
  },
  [`${P}-event-boudican-revolt`]: {
    rarity: "legendary",
    eventAbility: {
      abilityName: "Fire and Reckoning",
      abilityEffect: "flat_attack",
      abilityValue: 18,
    },
    flavorText:
      "When Rome flogged Boudica and seized her daughters' kingdom, she answered with torches—Camulodunum, Verulamium, and Londinium burned before Paulinus crushed the last British hope.",
  },
  [`${P}-event-caesar-s-expeditions-to-britain`]: {
    rarity: "epic",
    eventAbility: {
      abilityName: "Cross the Ocean",
      abilityEffect: "flat_attack",
      abilityValue: 14,
    },
    flavorText:
      "Fifty-five and fifty-four BC—Caesar bridged the Thames, fought chariots in the surf, took hostages, and left Britain knowing the Ocean was not a wall but a road.",
  },
  [`${P}-event-construction-of-hadrian-s-wall`]: {
    rarity: "epic",
    eventAbility: {
      abilityName: "Frontier in Stone",
      abilityEffect: "block_influence_gain",
      abilityValue: 1,
    },
    flavorText:
      "Milecastles, ditch, and wall from sea to sea—Hadrian's engineers turned policy into masonry and told the north that Rome's patience had found its line.",
  },
  [`${P}-event-agricola-s-northern-campaigns`]: {
    rarity: "epic",
    eventAbility: {
      abilityName: "Push to Caledonia",
      abilityEffect: "flat_attack",
      abilityValue: 14,
    },
    flavorText:
      "Fort by fort Agricola tightened Rome's grip on the north—his fleet circled Scotland while his legions hunted tribes who had never seen a province's tax-collector.",
  },
  [`${P}-event-end-of-roman-rule-in-britain`]: {
    rarity: "legendary",
    eventAbility: {
      abilityName: "Rescript of Honorius",
      abilityEffect: "remove_influence",
      abilityValue: 2,
    },
    flavorText:
      "Legions recalled, coins debased, villas abandoned—in the early fifth century Britain discovered it was no longer an imperial possession, and the Saxon future began in the silence.",
  },
  [`${P}-event-great-conspiracy`]: {
    rarity: "epic",
    eventAbility: {
      abilityName: "Barbarian Conspiracy",
      abilityEffect: "epidemic",
      abilityValue: 12,
    },
    flavorText:
      "In 367 Picts, Scots, Saxons, and Roman deserters rose together—coast and camp burned until Theodosius restored order and Britain learned how thin imperial protection had worn.",
  },
  [`${P}-event-severan-campaigns-in-caledonia`]: {
    rarity: "rare",
    eventAbility: {
      abilityName: "North Again",
      abilityEffect: "flat_attack",
      abilityValue: 10,
    },
    flavorText:
      "Severus rebuilt the wall, marched beyond it, and punished Caledonian raids with devastation—victory by attrition until disease and dynastic quarrels ended the war.",
  },
  [`${P}-event-antonine-advance`]: {
    rarity: "rare",
    eventAbility: {
      abilityName: "Short Frontier",
      abilityEffect: "add_influence",
      abilityValue: 1,
    },
    flavorText:
      "For a generation Rome pushed the frontier north—Antoninus Pius ordered a new wall until retreat taught Britain that even emperors could change their minds.",
  },
  [`${P}-event-carausian-revolt`]: {
    rarity: "rare",
    eventAbility: {
      abilityName: "Empire of the Channel",
      abilityEffect: "remove_influence",
      abilityValue: 1,
    },
    flavorText:
      "While Rome hunted pirates, Carausius became one—then emperor of Britain and Gaul until Allectus's knife and Constantius's fleet restored the fiction of unity.",
  },

  // ── Locations ───────────────────────────────────────────────────────────────

  [`${P}-location-britannia`]: {
    rarity: "legendary",
    statProfile: "balanced",
    locationBuffAdjust: 4,
    flavorText:
      "From the Channel to the Cheviots, mines, villas, and forts—Britannia was Rome's wild northwestern province, richer in lead and trouble than anyone admitted.",
  },
  [`${P}-location-richborough`]: {
    rarity: "epic",
    statProfile: "offensive",
    locationBuffAdjust: 3,
    flavorText:
      "Rutupiae's harbour swallowed Claudius's invasion fleet—Richborough was the front door through which four centuries of Roman power entered the island.",
  },
  [`${P}-location-mons-graupius`]: {
    rarity: "epic",
    statProfile: "offensive",
    locationBuffAdjust: 3,
    flavorText:
      "Somewhere in the Highlands Agricola met the Caledonian host—Tacitus heard a speech about freedom, then wrote of Roman victory and a north that would not stay conquered.",
  },
  [`${P}-location-antonine-wall`]: {
    rarity: "epic",
    statProfile: "defensive",
    locationBuffAdjust: 2,
    locationAbility: {
      abilityName: "Northern Rampart",
      abilityEffect: "flat_defense",
      abilityValue: 35,
    },
    flavorText:
      "Shorter and further north than Hadrian's line—Antoninus built in turf and timber what ambition could not hold, and Rome soon marched back south.",
  },
  [`${P}-location-eboracum`]: {
    rarity: "rare",
    statProfile: "defensive",
    locationBuffAdjust: 2,
    flavorText:
      "York of the legions—Eboracum's fortress crowned emperors and hosted Severus's last campaign, the military heart of Roman Britain.",
  },
  [`${P}-location-camulodunum`]: {
    rarity: "rare",
    statProfile: "offensive",
    locationBuffAdjust: 2,
    flavorText:
      "First Roman colonia, temple to Claudius, seat of procurator greed—Camulodunum's ashes were Boudica's answer to empire dressed as civilization.",
  },
  [`${P}-location-verulamium`]: {
    rarity: "uncommon",
    statProfile: "balanced",
    locationBuffAdjust: 1,
    flavorText:
      "A prosperous town of Romanized Britons—Verulamium's market and mosaic floors burned with the same fury that consumed Londinium in the revolt.",
  },
  [`${P}-location-aquae-sulis`]: {
    rarity: "uncommon",
    statProfile: "defensive",
    locationBuffAdjust: 1,
    flavorText:
      "Hot springs and Sulis Minerva—Bath's waters drew pilgrims who prayed in Latin to a goddess the Britons already knew, empire by syncretism.",
  },

  // ── Units ───────────────────────────────────────────────────────────────────

  [`${P}-unit-roman-legions-in-britain`]: {
    rarity: "legendary",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "II Augusta, IX Hispana, XIV Gemina, XX Valeria Victrix—Britain's legions marched in testudo, built roads, and taught the province what Roman peace meant at spear-point.",
  },
  [`${P}-unit-classis-britannica`]: {
    rarity: "epic",
    archetype: "sailor",
    statProfile: "balanced",
    flavorText:
      "Rome's British fleet—patrolling the Channel, supplying Agricola's northern forts, and once the power base of the usurper who called himself emperor of the sea.",
  },
  [`${P}-unit-boudican-rebel-coalition`]: {
    rarity: "epic",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "Iceni, Trinovantes, and allies who chose fire over tribute—Boudica's coalition nearly drove Rome from the island before disciplined steel broke the chariots.",
  },
  [`${P}-unit-roman-auxiliary-troops`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "balanced",
    flavorText:
      "Batavians, Tungrians, and Britons in Roman pay—auxiliaries garrisoned the wall, fought in the north, and learned empire from the ranks of someone else's eagles.",
  },
  [`${P}-unit-caledonian-forces`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "skirmisher",
    flavorText:
      "Spears, chariots, and hills the legionary hated—Caledonian warbands melted before the line and returned when the camps moved on, freedom measured in raids.",
  },
};
