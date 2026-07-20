import type { CardBalanceDef } from "@/lib/server/card-balance";

const P = "a-history-of-britain-volume-2";

/** Schama *History of Britain* Volume 2 — Stuart to Georgian cards from .to-organise. */
export const HISTORY_OF_BRITAIN_VOLUME_2_BALANCE: Record<string, CardBalanceDef> = {
  [`${P}-character-charles-i`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "He ruled by divine right and called Parliament to heel until the kingdoms rose against him—Charles fought for his father's crown and lost both throne and head at Whitehall.",
  },
  [`${P}-character-oliver-cromwell`]: {
    rarity: "legendary",
    archetype: "leader",
    statProfile: "aggressive",
    flavorText:
      "Farmer, MP, and Lord Protector—he broke a king, won Naseby, and ruled without a crown, proving England could be a republic until his son proved republics need more than victory.",
  },
  [`${P}-character-charles-ii`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "balanced",
    flavorText:
      "The Merry Monarch returned from exile to restore theatre, toleration, and a court that laughed again—he survived plots and plagues and left a throne stronger than the sword that had taken his father's.",
  },
  [`${P}-character-james-ii`]: {
    rarity: "rare",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "His Catholic faith broke the compromise his brother had nursed—James fled a daughter and a son-in-law, and Britain learned that crowns could be offered as well as inherited.",
  },
  [`${P}-character-william-iii`]: {
    rarity: "epic",
    archetype: "leader",
    statProfile: "defensive",
    flavorText:
      "Stadtholder of Holland, king by invitation—William crossed the Channel with a Dutch army and a Protestant contract, and Europe's balance shifted at the Boyne and on the Boyne's echoing battlefields.",
  },
  [`${P}-character-mary-ii`]: {
    rarity: "rare",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "She shared the crown with her husband and outlived the politics that brought her home—Mary's reign was brief, Protestant, and the hinge on which Glorious Revolution turned.",
  },
  [`${P}-character-anne`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "Seventeen pregnancies, no surviving heir, and a union forged in grief—Queen Anne's Britain fought Marlborough's wars and united parliaments while the Stuart line died with her.",
  },
  [`${P}-character-james-vi-and-i`]: {
    rarity: "rare",
    archetype: "monarch",
    statProfile: "balanced",
    flavorText:
      "King of Scots who rode south to inherit Elizabeth's England—James preached peace, patronised the Authorised Version, and planted the dynastic fuse that would burn through three kingdoms.",
  },
  [`${P}-character-john-churchill-1st-duke-of-marlborough`]: {
    rarity: "legendary",
    archetype: "leader",
    statProfile: "aggressive",
    flavorText:
      "From courtier to captain-general—Marlborough marched Europe, shattered France at Blenheim, and proved that one English general could hold a coalition together season after season.",
  },
  [`${P}-character-robert-walpole`]: {
    rarity: "rare",
    archetype: "leader",
    statProfile: "defensive",
    flavorText:
      "First among ministers in all but name—Walpole bought loyalty, avoided continental war, and made Georgian politics a matter of patronage, parliament, and prose that sounded like peace.",
  },
  [`${P}-character-george-iii`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "Farmer king, lost colonies, lost reason in the world's eyes—George III reigned longer than any Hanoverian and saw empire, madness, and the birth of a nation that refused his tax.",
  },
  [`${P}-character-louis-xiv`]: {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "Britain's great rival across the Channel—his armies filled Europe with French glory until Blenheim, Malplaquet, and a grandson's debts reminded even the Sun King that walls have horizons.",
  },

  [`${P}-event-wars-of-the-three-kingdoms`]: {
    rarity: "epic",
    eventAbility: {
      abilityName: "Three Crowns Clash",
      abilityEffect: "flat_attack",
      abilityValue: 14,
    },
    flavorText:
      "England, Scotland, and Ireland bled in one quarrel—covenant, confession, and king's prerogative turned Britain into a battlefield of faith and sovereignty.",
  },
  [`${P}-event-execution-of-charles-i`]: {
    rarity: "legendary",
    eventAbility: {
      abilityName: "Regicide",
      abilityEffect: "remove_influence",
      abilityValue: 2,
    },
    flavorText:
      "The axe fell on a king in January 1649—England had tried a monarch for treason and the world learned that sovereignty could be argued with a block and a masked headsman.",
  },
  [`${P}-event-restoration-of-the-monarchy`]: {
    rarity: "rare",
    eventAbility: {
      abilityName: "Return of the King",
      abilityEffect: "heal_unit",
      abilityValue: 20,
    },
    flavorText:
      "In 1660 the ships came back with Charles Stuart—monarchy restored not by conquest but exhaustion, and England chose memory over revolution.",
  },
  [`${P}-event-glorious-revolution`]: {
    rarity: "epic",
    eventAbility: {
      abilityName: "Crown by Contract",
      abilityEffect: "add_influence",
      abilityValue: 2,
    },
    flavorText:
      "Almost without blood in England, James fled and William and Mary accepted terms—Parliament chose the monarch and wrote the revolution into law.",
  },
  [`${P}-event-battle-of-blenheim`]: {
    rarity: "legendary",
    eventAbility: {
      abilityName: "Blenheim Thunder",
      abilityEffect: "flat_attack",
      abilityValue: 18,
    },
    flavorText:
      "Marlborough and Eugene caught the French at the Danube—Blenheim broke Bavaria, saved Vienna, and taught Europe that France could be beaten in an afternoon.",
  },
  [`${P}-event-acts-of-union`]: {
    rarity: "epic",
    eventAbility: {
      abilityName: "One Parliament",
      abilityEffect: "add_influence",
      abilityValue: 1,
    },
    flavorText:
      "In 1707 Edinburgh and Westminster merged their voices—Scotland and England became Great Britain on paper, and trade, tax, and empire would test the bargain for centuries.",
  },
  [`${P}-event-seven-years-war`]: {
    rarity: "epic",
    eventAbility: {
      abilityName: "Global Contest",
      abilityEffect: "flat_attack",
      abilityValue: 12,
    },
    flavorText:
      "From Quebec to Bengal the war ran—Britain seized a French empire on five continents and paid for it with debt that would echo in American taverns.",
  },
  [`${P}-event-american-revolution-begins`]: {
    rarity: "legendary",
    eventAbility: {
      abilityName: "Shot Heard Round",
      abilityEffect: "remove_influence",
      abilityValue: 2,
    },
    flavorText:
      "Lexington's muskets answered George's garrison—colonies that had learned British war turned it against the Crown, and empire discovered it could create rivals.",
  },

  [`${P}-location-naseby`]: {
    rarity: "rare",
    statProfile: "offensive",
    locationBuffAdjust: 2,
    flavorText:
      "Where Cromwell's ironsides broke the king's main field—Naseby ended the First Civil War and proved that godly discipline could shatter royal chivalry.",
  },
  [`${P}-location-oxford`]: {
    rarity: "uncommon",
    statProfile: "defensive",
    locationBuffAdjust: 2,
    flavorText:
      "Royalist capital in a kingdom of garrisons—Oxford's colleges housed a court in arms until Fairfax's ring closed and Charles slipped away to defeat.",
  },
  [`${P}-location-london`]: {
    rarity: "epic",
    statProfile: "balanced",
    locationBuffAdjust: 3,
    flavorText:
      "Smoke, coffee-houses, and the Bank—Hanoverian London grew into an imperial hub where stock, print, and parliament turned trade into power.",
  },
  [`${P}-location-edinburgh`]: {
    rarity: "rare",
    statProfile: "defensive",
    locationBuffAdjust: 2,
    flavorText:
      "Castle rock above a parliament that remembered independence—Edinburgh signed union with England and kept a law, a kirk, and a grudge in the same breath.",
  },
  [`${P}-location-ireland`]: {
    rarity: "rare",
    statProfile: "defensive",
    locationBuffAdjust: 2,
    flavorText:
      "The third kingdom in Britain's wars—Plantation, rebellion, and famine memory made Ireland the crucible where English power met Gaelic endurance.",
  },
  [`${P}-location-blenheim`]: {
    rarity: "rare",
    statProfile: "offensive",
    locationBuffAdjust: 2,
    flavorText:
      "A village on the Danube where France's tide turned—Marlborough's victory here bought a palace in Woodstock and a century of boasting.",
  },
  [`${P}-location-boston`]: {
    rarity: "rare",
    statProfile: "offensive",
    locationBuffAdjust: 2,
    flavorText:
      "Harbour, tea, and town meetings—Boston's wharves became the stage where empire's taxes met colonists who would rather smuggle than submit.",
  },
  [`${P}-location-versailles`]: {
    rarity: "epic",
    statProfile: "defensive",
    locationBuffAdjust: 2,
    flavorText:
      "Louis built mirrors for a world he almost owned—Versailles glittered while Britain's fleets and Marlborough's marches reminded France that splendour is not safety.",
  },

  [`${P}-unit-new-model-army`]: {
    rarity: "legendary",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "Ironsides, discipline, and the New Model—Cromwell forged an army that drilled like Romans and prayed like saints, and broke every royal host sent against it.",
  },
  [`${P}-unit-parliamentarian-forces`]: {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "defensive",
    flavorText:
      "Roundheads, county committees, and godly captains—Parliament's armies fought for law against the king until victory made them argue over what law meant.",
  },
  [`${P}-unit-royalist-forces`]: {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "offensive",
    flavorText:
      "Cavalier gentry, Welsh marchers, and royal standard—Charles's hosts glittered and charged until Naseby taught them that courage without drill is not enough.",
  },
  [`${P}-unit-royal-navy`]: {
    rarity: "epic",
    archetype: "sailor",
    statProfile: "balanced",
    flavorText:
      "From the Medway humiliation to Quebec and the Atlantic—Britain's wooden walls learned to rule waves and choke French trade from Boston to Bengal.",
  },
  [`${P}-unit-british-army`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "balanced",
    flavorText:
      "Red coats on five continents—Hanoverian regiments bought empire with musket volleys, bayonet drill, and the conviction that markets follow flags.",
  },
  [`${P}-unit-continental-army`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "defensive",
    flavorText:
      "Militia turned army under Washington—ragged, hungry, and stubborn, they learned British tactics and outlasted an empire that could win battles and lose a continent.",
  },
};
