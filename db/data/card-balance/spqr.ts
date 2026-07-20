import type { CardBalanceDef } from "@/lib/server/card-balance";

/** Cards from the catalog book SPQR (Mary Beard / Roman Empire era). */
export const SPQR_CARD_BALANCE: Record<string, CardBalanceDef> = {
  // Characters
  "spqr-character-romulus": {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "Raised by a she-wolf, he ploughed a furrow around the Palatine and killed his brother for leaping it—myth or memory, Rome begins in fratricide and a wall that would never stop growing.",
  },
  "spqr-character-augustus": {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "He found Rome brick and left it marble—turning civil war into peace by wearing a republic's mask over an emperor's will until the world learned to call him father of the country.",
  },
  "spqr-character-julius-caesar": {
    rarity: "legendary",
    archetype: "leader",
    statProfile: "aggressive",
    customAbility: {
      abilityName: "Crosses the Rubicon",
      abilityEffect: "flat_attack",
      abilityValue: 12,
    },
    flavorText:
      "Gaul conquered, the Rubicon crossed, the Senate fled—he made a name into a title and a dictatorship into destiny, until the Ides proved even Caesars bleed.",
  },
  "spqr-character-hannibal": {
    rarity: "legendary",
    archetype: "warrior",
    statProfile: "skirmisher",
    customAbility: {
      abilityName: "Cannae's Lesson",
      abilityEffect: "vs_higher_rarity_attack",
      abilityValue: 10,
    },
    flavorText:
      "Elephants over the Alps, Rome's legions broken at Cannae—he taught Italy fear for fifteen years before the war of attrition he could not win ground him down.",
  },
  "spqr-character-cleopatra-vii": {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "balanced",
    flavorText:
      "Queen of Egypt, ally of Caesar and Antony—she wagered a kingdom on Roman civil war and lost when Actium's sails burned and Octavian's patience outlasted her charm.",
  },
  "spqr-character-cicero": {
    rarity: "epic",
    archetype: "scholar",
    statProfile: "fortress",
    flavorText:
      "His tongue was Rome's sharpest weapon—against Catiline, against Antony, against the Republic's slow death—until proscription lists proved words cannot always outrun the sword.",
  },
  "spqr-character-spartacus": {
    rarity: "epic",
    archetype: "warrior",
    statProfile: "aggressive",
    customAbility: {
      abilityName: "Slave Revolt",
      abilityEffect: "flat_attack",
      abilityValue: 8,
      abilityTrigger: "deploy",
    },
    flavorText:
      "A gladiator who broke his chain and turned Italy upside down—crucified along the Appian Way, his rebellion still haunts every master who trusts a slave with a blade.",
  },
  "spqr-character-nero": {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "He sang while Rome burned, or so the story goes—artist, tyrant, matricide, and the last Julio-Claudian, undone when even the Praetorians tired of his theatre.",
  },
  "spqr-character-remus": {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "skirmisher",
    flavorText:
      "Brother of Rome's founder and victim of its first crime—he mocked the wall, leapt it, and learned that in this city only one king's name would survive the telling.",
  },
  "spqr-character-lucretia": {
    rarity: "rare",
    archetype: "scholar",
    statProfile: "defensive",
    flavorText:
      "Her death was the wound that expelled the kings—Roman virtue made public, private shame turned political, and the Republic born from a woman's refusal to live dishonoured.",
  },
  "spqr-character-catiline": {
    rarity: "uncommon",
    archetype: "leader",
    statProfile: "aggressive",
    flavorText:
      "Debt, disgrace, and a conspiracy to burn the city—Cicero unmasked him, the Senate condemned him, and his rebels died in the hills while Rome learned how close it came to ash.",
  },
  "spqr-character-caracalla": {
    rarity: "uncommon",
    archetype: "monarch",
    statProfile: "aggressive",
    flavorText:
      "He murdered his brother in his mother's arms, extended citizenship to every free man in the empire, and was knifed on a Syrian road—reform and cruelty in one short reign.",
  },

  // Units
  "spqr-unit-roman-legions": {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "balanced",
    flavorText:
      "Shield locked to shield, pilum thrown, gladius in the press—the legion marched on discipline, engineering, and the conviction that Rome's order was worth any river of blood.",
  },
  "spqr-unit-carthaginian-army": {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "African infantry, Numidian horse, and Hannibal's terrible genius—Carthage fought Rome for the Mediterranean and nearly swallowed the wolf whole before Scipio turned the tide.",
  },
  "spqr-unit-spartacus-s-rebel-army": {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "skirmisher",
    flavorText:
      "Gladiators, shepherds, and the desperate broke from Capua and beat consular armies twice—freedom for a season, before Crassus's trenches and crucifixions along the road home.",
  },
  "spqr-unit-italian-allies-socii": {
    rarity: "common",
    archetype: "leader",
    statProfile: "defensive",
    flavorText:
      "They fought Rome's wars for generations without the vote—until the Social War taught the Senate that allies who bleed for you eventually demand a place at the table.",
  },
  "spqr-unit-catiline-s-rebel-army": {
    rarity: "common",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "Ruined aristocrats, desperate veterans, and men with nothing left to lose—Catiline's conspiracy died in Etrurian hills when Rome chose law over flame.",
  },

  // Locations
  "spqr-location-rome": {
    rarity: "legendary",
    locationBuffAdjust: 5,
    flavorText:
      "Seven hills, one wolf, and an appetite that swallowed the world—every road was said to lead here, and every conqueror dreamed of entering through a triumphal arch.",
  },
  "spqr-location-roman-forum": {
    rarity: "epic",
    locationBuffAdjust: 3,
    flavorText:
      "Senators debated, crowds roared, and verdicts fell between temple steps and basilica shade—the Forum was where Rome argued with itself before marching out to win.",
  },
  "spqr-location-italy": {
    rarity: "epic",
    locationBuffAdjust: 2,
    flavorText:
      "Peninsula of Latin hills and Etruscan memory—Italy fed Rome's legions, bore its farms, and learned that local quarrels become empire when one city refuses to stay small.",
  },
  "spqr-location-cannae": {
    rarity: "rare",
    locationBuffAdjust: 3,
    flavorText:
      "On this plain Hannibal encircled and destroyed a Roman army so completely that mothers in the city were forbidden to weep in public lest the state itself collapse.",
  },
  "spqr-location-carthage": {
    rarity: "rare",
    locationBuffAdjust: 2,
    flavorText:
      "Punic harbours and African wealth—Rome's great rival until Scipio Aemilianus razed the city and salted the legend that some wounds must be erased, not merely won.",
  },
  "spqr-location-alps": {
    rarity: "uncommon",
    statProfile: "defensive",
    locationBuffAdjust: 1,
    flavorText:
      "Snow, passes, and the audacity to bring war elephants over them—Hannibal crossed these heights and proved Rome's moat was only geography until someone dared the impossible.",
  },
  "spqr-location-gaul": {
    rarity: "uncommon",
    statProfile: "offensive",
    locationBuffAdjust: 1,
    flavorText:
      "Caesar divided it into three parts and then into one province—Gaul's tribes learned Latin, paid tribute, and supplied the legions that would guard Rome for centuries.",
  },
  "spqr-location-britannia": {
    rarity: "uncommon",
    statProfile: "fortress",
    flavorText:
      "At the edge of the known world, Claudius landed and walls rose—Britannia paid Rome in tin, grain, and auxiliaries while the north remained stubbornly unconquered.",
  },
  "spqr-location-spain": {
    rarity: "common",
    statProfile: "balanced",
    flavorText:
      "Silver from the mines, hardened soldiers from the provinces—Hispania fed Roman paychests and produced the emperors who would later decide who ruled from the Tiber.",
  },
  "spqr-location-syria": {
    rarity: "common",
    statProfile: "defensive",
    flavorText:
      "Eastern frontier of empire—Syria's garrisons watched Parthia, traded with the desert, and supplied the legions that kept Rome's richest provinces from slipping away.",
  },
};
