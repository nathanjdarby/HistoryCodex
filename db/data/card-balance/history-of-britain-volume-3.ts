import type { CardBalanceDef } from "@/lib/server/card-balance";

const P = "a-history-of-britain-volume-3";

/** Schama *History of Britain* Volume 3 — Georgian to Modern cards from .to-organise. */
export const HISTORY_OF_BRITAIN_VOLUME_3_BALANCE: Record<string, CardBalanceDef> = {
  // ── Characters ──────────────────────────────────────────────────────────────

  [`${P}-character-horatio-nelson`]: {
    rarity: "legendary",
    archetype: "sailor",
    statProfile: "aggressive",
    flavorText:
      "Blind in one eye, missing an arm, unbeaten at sea—Nelson closed at Trafalgar until French and Spanish lines shattered and Britain ruled the waves for a century.",
  },
  [`${P}-character-arthur-wellesley-1st-duke-of-wellington`]: {
    rarity: "legendary",
    archetype: "leader",
    statProfile: "defensive",
    flavorText:
      "Iron duke of Peninsular grit and Waterloo's mud—Wellington learned to beat Napoleon by patience, supply, and the conviction that British infantry could hold any line.",
  },
  [`${P}-character-edmund-burke`]: {
    rarity: "epic",
    archetype: "scholar",
    statProfile: "defensive",
    flavorText:
      "Prophet of ordered liberty—Burke warned that abstract rights could guillotine kings and that reform must respect the fabric of society stitched across generations.",
  },
  [`${P}-character-thomas-paine`]: {
    rarity: "rare",
    archetype: "scholar",
    statProfile: "offensive",
    flavorText:
      "Corset-maker, pamphleteer, republican—Paine wrote common sense into American rebellion and Rights of Man into British fear, and paid for both with exile.",
  },
  [`${P}-character-queen-victoria`]: {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "Sixty-three years on the throne—Victoria gave her name to an age of railways, empire, industry, and the paradox of a widow-queen who embodied progress and propriety.",
  },
  [`${P}-character-prince-albert`]: {
    rarity: "rare",
    archetype: "leader",
    statProfile: "balanced",
    flavorText:
      "German prince who became Britain's conscience—Albert championed science, the Great Exhibition, and a monarchy that served industry as well as ceremony.",
  },
  [`${P}-character-florence-nightingale`]: {
    rarity: "epic",
    archetype: "scholar",
    statProfile: "defensive",
    customAbility: {
      abilityName: "Lady with the Lamp",
      abilityEffect: "heal_unit",
      abilityValue: 18,
      abilityTrigger: "deploy",
    },
    flavorText:
      "She counted the dead at Scutari and rewrote army medicine—Nightingale proved that statistics, sanitation, and stubborn mercy could save more lives than glory.",
  },
  [`${P}-character-william-ewart-gladstone`]: {
    rarity: "epic",
    archetype: "leader",
    statProfile: "balanced",
    flavorText:
      "Four times prime minister, forever wrestling his soul—Gladstone preached free trade, Irish home rule, and a moral politics that exhausted allies and awed opponents.",
  },
  [`${P}-character-benjamin-disraeli`]: {
    rarity: "epic",
    archetype: "leader",
    statProfile: "offensive",
    flavorText:
      "Novelist, dandy, and imperial showman—Disraeli bought Suez, crowned Victoria empress, and proved that romance could be as potent in Westminster as reason.",
  },
  [`${P}-character-charles-george-gordon`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "Chinese Gordon, saint to the public, martyr at Khartoum—he held empires together with charisma and prayer until the Mahdi's spears answered Britain's delay.",
  },
  [`${P}-character-winston-churchill`]: {
    rarity: "legendary",
    archetype: "leader",
    statProfile: "defensive",
    flavorText:
      "Bulldog voice in Britain's darkest hour—Churchill rallied a nation with rhetoric, cigar smoke, and the refusal to treat surrender as a verb.",
  },

  // ── Events ──────────────────────────────────────────────────────────────────

  [`${P}-event-battle-of-trafalgar`]: {
    rarity: "legendary",
    eventAbility: {
      abilityName: "England Expects",
      abilityEffect: "flat_attack",
      abilityValue: 18,
    },
    flavorText:
      "Twenty-seven British ships broke the Combined Fleet off Cape Trafalgar—Nelson died victorious, and no enemy fleet would dare challenge Britain's oceans again.",
  },
  [`${P}-event-battle-of-waterloo`]: {
    rarity: "legendary",
    eventAbility: {
      abilityName: "Hundred Days End",
      abilityEffect: "remove_influence",
      abilityValue: 2,
    },
    flavorText:
      "Rain, mud, and Wellington's line held until Blücher came—Waterloo ended Napoleon and taught Europe that one afternoon could redraw a century.",
  },
  [`${P}-event-great-reform-act`]: {
    rarity: "epic",
    eventAbility: {
      abilityName: "Expand the Franchise",
      abilityEffect: "reform",
      abilityValue: 1,
    },
    flavorText:
      "In 1832 rotten boroughs fell and industrial towns gained voice—Britain bent without breaking, and parliament learned that reform could defuse revolution.",
  },
  [`${P}-event-great-exhibition`]: {
    rarity: "rare",
    eventAbility: {
      abilityName: "Crystal Palace Showcase",
      abilityEffect: "add_influence",
      abilityValue: 2,
    },
    flavorText:
      "Under iron and glass the world came to Hyde Park—Britain displayed steam, steel, and self-confidence, and called it the workshop of the world.",
  },
  [`${P}-event-great-famine-in-ireland`]: {
    rarity: "epic",
    eventAbility: {
      abilityName: "An Gorta Mór",
      abilityEffect: "epidemic",
      abilityValue: 12,
    },
    flavorText:
      "Potato blight, grain exports, and absentee landlords—a million dead and a million fled, and Ireland would never trust England's famine relief again.",
  },
  [`${P}-event-indian-rebellion-of-1857`]: {
    rarity: "legendary",
    eventAbility: {
      abilityName: "Sepoy Mutiny",
      abilityEffect: "flat_attack",
      abilityValue: 16,
    },
    flavorText:
      "Greased cartridges lit a subcontinent—Delhi, Cawnpore, and Lucknow burned until British vengeance and the Raj replaced the East India Company's rule.",
  },
  [`${P}-event-indian-independence-and-partition`]: {
    rarity: "legendary",
    eventAbility: {
      abilityName: "Midnight Freedom",
      abilityEffect: "treaty",
      abilityValue: 2,
    },
    flavorText:
      "In 1947 empire released its jewel—India and Pakistan were born amid partition's trains of corpses, and Britain learned that freedom could cost more than dominion.",
  },
  [`${P}-event-representation-of-the-people-act-1918`]: {
    rarity: "epic",
    eventAbility: {
      abilityName: "Votes for Heroes",
      abilityEffect: "reform",
      abilityValue: 1,
    },
    flavorText:
      "War widened the franchise—men who survived the trenches and women who kept the factories won a say in Westminster, and democracy grew by crisis.",
  },
  [`${P}-event-first-world-war`]: {
    rarity: "legendary",
    eventAbility: {
      abilityName: "War to End Wars",
      abilityEffect: "block_influence_gain",
      abilityValue: 1,
    },
    flavorText:
      "Trenches from Flanders to Gallipoli—Britain sent its youth into machine guns and gas, and emerged victorious, bankrupt, and haunted by the Somme.",
  },
  [`${P}-event-second-world-war`]: {
    rarity: "legendary",
    eventAbility: {
      abilityName: "Total War",
      abilityEffect: "flat_attack",
      abilityValue: 20,
    },
    flavorText:
      "From Dunkirk's boats to D-Day's beaches—Britain fought alone, then in alliance, until fascism broke and a new world order rose from the rubble.",
  },

  // ── Locations ───────────────────────────────────────────────────────────────

  [`${P}-location-trafalgar`]: {
    rarity: "epic",
    statProfile: "offensive",
    locationBuffAdjust: 3,
    flavorText:
      "Cape Trafalgar off Spain's coast—where Nelson crossed the enemy line and Britain's navy wrote its supremacy in French and Spanish wrecks.",
  },
  [`${P}-location-waterloo`]: {
    rarity: "epic",
    statProfile: "defensive",
    locationBuffAdjust: 3,
    flavorText:
      "Belgian fields near a village whose name means fate—Wellington's ridge held here while Europe's future was decided in an afternoon of cannon and cuirassiers.",
  },
  [`${P}-location-london`]: {
    rarity: "epic",
    statProfile: "balanced",
    locationBuffAdjust: 3,
    flavorText:
      "Smoke, docks, and the world's money—Victorian London swallowed villages, spewed factories, and became the imperial metropolis where trade and parliament ruled.",
  },
  [`${P}-location-westminster`]: {
    rarity: "rare",
    statProfile: "defensive",
    locationBuffAdjust: 2,
    flavorText:
      "Palace, abbey, and the mother of parliaments—Westminster is where reform acts, budget speeches, and prime ministers turn argument into law.",
  },
  [`${P}-location-crystal-palace`]: {
    rarity: "rare",
    statProfile: "balanced",
    locationBuffAdjust: 2,
    flavorText:
      "Iron skeleton and glass skin in Hyde Park—Albert's exhibition hall displayed the empire's ingenuity before fire consumed the symbol of Victorian confidence.",
  },
  [`${P}-location-india`]: {
    rarity: "legendary",
    statProfile: "offensive",
    locationBuffAdjust: 3,
    flavorText:
      "Jewel of empire from Bengal to Bombay—India fed British trade, tested British armies, and eventually taught Britain that dominion without consent cannot last.",
  },
  [`${P}-location-delhi`]: {
    rarity: "rare",
    statProfile: "offensive",
    locationBuffAdjust: 2,
    flavorText:
      "Mughal splendour and Raj bureaucracy—Delhi was rebel capital in 1857 and imperial capital thereafter, the heart of a subcontinent ruled from a viceroy's desk.",
  },
  [`${P}-location-ireland`]: {
    rarity: "rare",
    statProfile: "defensive",
    locationBuffAdjust: 2,
    flavorText:
      "Green fields and bitter memory—Ireland's famine, risings, and partition made it the wound in Britain's union that no statute fully healed.",
  },
  [`${P}-location-gallipoli`]: {
    rarity: "rare",
    statProfile: "defensive",
    locationBuffAdjust: 2,
    flavorText:
      "Dardanelles cliffs and Anzac beaches—Churchill's gamble drowned in Turkish fire, and Britain learned that naval power alone cannot open a continent.",
  },
  [`${P}-location-britain`]: {
    rarity: "legendary",
    statProfile: "balanced",
    locationBuffAdjust: 4,
    flavorText:
      "Island nation that outlasted Napoleon, two world wars, and the loss of empire—Britain is the stage on which Schama's final volume plays out its contradictions.",
  },

  // ── Units ───────────────────────────────────────────────────────────────────

  [`${P}-unit-royal-navy`]: {
    rarity: "legendary",
    archetype: "sailor",
    statProfile: "aggressive",
    flavorText:
      "From Trafalgar's line to Jutland's dreadnoughts—Britain's wooden walls and steel fleets choked enemies with blockade and ruled the routes of empire.",
  },
  [`${P}-unit-british-army`]: {
    rarity: "epic",
    archetype: "warrior",
    statProfile: "balanced",
    flavorText:
      "Red coats at Waterloo, khaki in the Punjab, tin hats on the Somme—Britain's army fought every kind of war imperial ambition demanded.",
  },
  [`${P}-unit-east-india-company-armies`]: {
    rarity: "epic",
    archetype: "warrior",
    statProfile: "offensive",
    flavorText:
      "Sepoys, regiments, and shareholders with cannon—Company armies conquered Bengal and the Punjab until rebellion taught London to rule India in the Crown's name.",
  },
  [`${P}-unit-indian-rebels-of-1857`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "Mutinous sepoys, peasant levies, and old kingdoms restored—1857's rebels held Delhi and Lucknow until British vengeance and loyal troops broke the uprising.",
  },
  [`${P}-unit-british-expeditionary-force`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "defensive",
    flavorText:
      "Professional soldiers shipped to France in 1914—small, superbly trained, and soon swallowed by trench warfare, the BEF began a war that would remake Britain.",
  },
};
