import type { CardBalanceDef } from "@/lib/server/card-balance";

const P = "history-of-norway";

/** France — A History from Gaul to de Gaulle (import seeds use legacy folder prefix). */
export const FRANCE_FROM_GAUL_TO_DE_GAULLE_BALANCE: Record<string, CardBalanceDef> = {
  [`${P}-character-julius-caesar`]: {
    rarity: "legendary",
    archetype: "leader",
    statProfile: "aggressive",
    customAbility: {
      abilityName: "Crosses the Rubicon",
      abilityEffect: "flat_attack",
      abilityValue: 12,
    },
    flavorText:
      "He bridged the Rhine, crossed to Britain, and broke Gaul at Alesia—before Rome's civil wars made a dictator of the conqueror.",
  },
  [`${P}-character-vercingetorix`]: {
    rarity: "legendary",
    archetype: "warrior",
    statProfile: "defensive",
    flavorText:
      "He united the tribes, burned Roman grain, and held Alesia until starvation did what legions could not—Gaul's last great stand for independence.",
  },
  [`${P}-character-charlemagne`]: {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "King of the Franks and emperor in the West—he bound sword and scripture into an empire that remembered Rome while inventing Europe.",
  },
  [`${P}-character-joan-of-arc`]: {
    rarity: "legendary",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "A peasant girl who heard voices and lifted a siege—she turned the Hundred Years' War until Burgundy and English fire answered prophecy with ashes.",
  },
  [`${P}-character-louis-xiv`]: {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "L'état, c'est moi—Versailles glittered, armies marched, and Europe learned that one king could make the sun itself seem a court decoration.",
  },
  [`${P}-character-napoleon-bonaparte`]: {
    rarity: "legendary",
    archetype: "leader",
    statProfile: "aggressive",
    customAbility: {
      abilityName: "Grande Tactique",
      abilityEffect: "flat_attack",
      abilityValue: 10,
    },
    flavorText:
      "From Corsican artillery officer to Emperor of the French—he remade Europe's map until Waterloo proved even genius has a horizon.",
  },
  [`${P}-character-charles-de-gaulle`]: {
    rarity: "legendary",
    archetype: "leader",
    statProfile: "defensive",
    flavorText:
      "When France fell, he spoke from London and refused the verdict—Free France, the Fourth Republic, and the Fifth were all born from that stubborn No.",
  },
  [`${P}-character-francis-i`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "balanced",
    flavorText:
      "Rival of Charles V, patron of Leonardo and Fontainebleau—he fought for Italy, lost, and still made France the envy of Renaissance courts.",
  },
  [`${P}-character-henry-iv`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "balanced",
    flavorText:
      "Paris is well worth a Mass—he ended the Wars of Religion with conversion and cunning, and the Bourbons learned to rule by compromise as well as sword.",
  },
  [`${P}-character-louis-xvi`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "A well-meaning king who could not read the storm—bankruptcy, privilege, and American example broke the ancien régime on his watch.",
  },
  [`${P}-character-marie-antoinette`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "Austrian princess, French queen, symbol of excess—whether she said let them eat cake or not, the guillotine answered for a dying world.",
  },
  [`${P}-character-maximilien-robespierre`]: {
    rarity: "epic",
    archetype: "scholar",
    statProfile: "offensive",
    flavorText:
      "The Incorruptible sent kings and rivals alike to the guillotine—virtue became terror until the Convention decided virtue had gone far enough.",
  },
  [`${P}-character-charles-vii`]: {
    rarity: "rare",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "The king Joan restored—weak, wary, and ultimately victorious when Burgundy switched sides and English ambition bled out in France.",
  },
  [`${P}-character-louis-xi`]: {
    rarity: "rare",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "The Universal Spider—he schemed, bribed, and outlasted the great dukes until the crown, not the nobles, defined France.",
  },
  [`${P}-character-napoleon-iii`]: {
    rarity: "rare",
    archetype: "monarch",
    statProfile: "balanced",
    flavorText:
      "Nephew of the Emperor, architect of boulevards and disaster—Sedan broke the Second Empire and opened the door to a republic he never mastered.",
  },
  [`${P}-character-philippe-petain`]: {
    rarity: "rare",
    archetype: "leader",
    statProfile: "fortress",
    flavorText:
      "Hero of Verdun who chose armistice over exile—Marshal of France, head of Vichy, and the bitterest argument in modern French memory.",
  },
  [`${P}-character-emile-zola`]: {
    rarity: "uncommon",
    archetype: "scholar",
    statProfile: "fortress",
    flavorText:
      "J'accuse—he put his name on the line for Dreyfus and proved that a novelist's pen could shake an army and a republic.",
  },

  [`${P}-unit-roman-legions`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "balanced",
    flavorText:
      "Eagle, pilum, and testudo—Gaul learned Latin at spear-point, and the road network still remembers where the legions marched.",
  },
  [`${P}-unit-gaulish-coalition-under-vercingetorix`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "defensive",
    flavorText:
      "Tribes who shared little except Roman danger—at Alesia they fought as one until the ring closed and Gaul became province.",
  },
  [`${P}-unit-frankish-army-of-charlemagne`]: {
    rarity: "epic",
    archetype: "warrior",
    statProfile: "offensive",
    flavorText:
      "Heavy cavalry and oath-bound followers—Frankish steel and Christian mission carved an empire from the Pyrenees to the Elbe.",
  },
  [`${P}-unit-french-royal-army`]: {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "balanced",
    flavorText:
      "Men-at-arms, gendarmes, and royal ordinance—before the levée en masse, France's kings bought war with feudal summons and gold.",
  },
  [`${P}-unit-french-revolutionary-army`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "Citizens in ranks, nation in arms—enthusiasm, artillery, and the tricolour turned a king's army into a revolution that marched across Europe.",
  },
  [`${P}-unit-grande-armee`]: {
    rarity: "legendary",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "Marshals, corps, and the Emperor's eye—at Ulm and Austerlitz it seemed invincible until the Russian winter and Spanish ulcer consumed it.",
  },
  [`${P}-unit-free-french-forces`]: {
    rarity: "rare",
    archetype: "leader",
    statProfile: "defensive",
    flavorText:
      "A few ships, a broadcast, and men who refused defeat—from Bir Hakeim to Paris, they kept France's name alive in exile.",
  },
  [`${P}-unit-french-resistance`]: {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "skirmisher",
    flavorText:
      "Railway lines cut, collaborators hunted, messages smuggled—occupation bred networks that made liberation a home-grown act as well as an Allied one.",
  },

  [`${P}-location-gaul`]: {
    rarity: "rare",
    statProfile: "defensive",
    locationBuffAdjust: 2,
    flavorText:
      "Three lands in one—Celtic hill-forts, Roman cities, and the memory of tribes who gave France its first name and its first defiance.",
  },
  [`${P}-location-reims`]: {
    rarity: "uncommon",
    statProfile: "fortress",
    locationBuffAdjust: 2,
    flavorText:
      "Where Clovis was baptised and kings were crowned—Reims made sacred oil and cathedral stone the hinge of French legitimacy.",
  },
  [`${P}-location-normandy`]: {
    rarity: "uncommon",
    statProfile: "balanced",
    flavorText:
      "Viking settlement turned duchy turned launchpad—William sailed from here to remake England, and France kept the coast that faced the Channel.",
  },
  [`${P}-location-orleans`]: {
    rarity: "rare",
    statProfile: "offensive",
    locationBuffAdjust: 3,
    flavorText:
      "The siege Joan lifted—when Orléans held, the Valois cause lived; when it fell, England might have swallowed France whole.",
  },
  [`${P}-location-agincourt`]: {
    rarity: "rare",
    statProfile: "offensive",
    locationBuffAdjust: 2,
    flavorText:
      "Mud, longbows, and French chivalry broken in an afternoon—Henry V's victory haunted Valois kings until Joan changed the story.",
  },
  [`${P}-location-paris`]: {
    rarity: "epic",
    statProfile: "balanced",
    locationBuffAdjust: 3,
    flavorText:
      "Revolution, commune, liberation parade—every French century writes its chapter in the streets between the Seine and the barricades.",
  },
  [`${P}-location-versailles`]: {
    rarity: "epic",
    statProfile: "fortress",
    locationBuffAdjust: 4,
    flavorText:
      "Louis XIV built a palace that was a machine for awe—Versailles dazzled Europe and bankrupted France in the same gilded breath.",
  },
  [`${P}-location-bastille`]: {
    rarity: "rare",
    statProfile: "offensive",
    locationBuffAdjust: 2,
    flavorText:
      "A medieval fortress stormed on 14 July 1789—its fall was mostly symbolic, but symbols can topple thrones faster than cannons.",
  },
  [`${P}-location-valmy`]: {
    rarity: "uncommon",
    statProfile: "offensive",
    flavorText:
      "Cannonade on a rainy ridge—Goethe heard history's cannon at Valmy, where a revolutionary army first proved it could stand against Europe's professionals.",
  },
  [`${P}-location-waterloo`]: {
    rarity: "epic",
    statProfile: "defensive",
    locationBuffAdjust: 3,
    flavorText:
      "A Belgian field that ended an empire—Napoleon's last gamble broke on Wellington, Blücher, and the mud of June.",
  },
  [`${P}-location-verdun`]: {
    rarity: "legendary",
    statProfile: "fortress",
    locationBuffAdjust: 5,
    flavorText:
      "They shall not pass—Verdun consumed a generation in shell-fire and became the bloodiest synonym for French endurance in the Great War.",
  },
  [`${P}-location-vichy`]: {
    rarity: "uncommon",
    statProfile: "defensive",
    flavorText:
      "Spa town turned seat of collaboration—Pétain's regime ruled the unoccupied south until liberation erased its name from honour.",
  },
};
