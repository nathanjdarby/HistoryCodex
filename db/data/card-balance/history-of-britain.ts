import type { CardBalanceDef } from "@/lib/server/card-balance";

const P = "a-history-of-britain-at-the-edge-of-the-world-3000bc-ad1603";

/** Cards staged in the .to-organise era from Schama's *History of Britain* import. */
export const HISTORY_OF_BRITAIN_CARD_BALANCE: Record<string, CardBalanceDef> = {
  // Characters
  [`${P}-character-anne-boleyn`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "She refused to be a mistress and became a queen—her marriage broke Rome's hold on England and her fall taught the Tudor court that a crown could not save a head.",
  },
  [`${P}-character-edward-i`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "Hammer of the Scots, conqueror of Wales, lawgiver and iron king—he built the frame of Britain with parliament, statute, and relentless war.",
  },
  [`${P}-character-edward-vi`]: {
    rarity: "rare",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "A boy on the throne with reformers at his elbow—his short reign bent England toward Protestant order before faction and fever stole the future.",
  },
  [`${P}-character-eleanor-of-aquitaine`]: {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "Queen of France, then Queen of England, mother of kings and rebel sons—she outlived husbands, crusades, and captivity, and never surrendered her will.",
  },
  [`${P}-character-elizabeth-i`]: {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "Virgin queen, survivor of plots and papist armies—she held a fractured realm together with rhetoric, patience, and the knowledge that to show weakness was to invite the axe.",
  },
  [`${P}-character-henry-ii`]: {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "From Anjou he inherited ambition and from Eleanor a crown that spanned the Channel. His courts, his quarrels, and his sons would define kingship for a century.",
  },
  [`${P}-character-henry-viii`]: {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "aggressive",
    flavorText:
      "Six marriages, one break with Rome, and a crown that answered to no pope—he remade England's soul to suit his dynasty and his appetite.",
  },
  [`${P}-character-mary-i`]: {
    rarity: "rare",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "Bloody only to those who feared her faith—she burned Protestants to restore Rome and died knowing her half-sister would undo every prayer she forced on England.",
  },
  [`${P}-character-mary-queen-of-scots`]: {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "balanced",
    flavorText:
      "Queen in Scotland, prisoner in England—her beauty, marriages, and murders made her a Catholic martyr to some and Elizabeth's most dangerous rival to others.",
  },
  [`${P}-character-richard-ii`]: {
    rarity: "rare",
    archetype: "monarch",
    statProfile: "balanced",
    flavorText:
      "Poetic, proud, and brittle—he ruled by majesty and revenge until his cousins decided a king could be unmade as well as crowned.",
  },
  [`${P}-character-robert-the-bruce`]: {
    rarity: "legendary",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "He lost, hid, and endured until Bannockburn—then proved that a Scottish king with spears and stubborn hills could break an English empire's pride.",
  },
  [`${P}-character-thomas-becket`]: {
    rarity: "rare",
    archetype: "scholar",
    statProfile: "fortress",
    flavorText:
      "The king's friend became the Church's martyr. Four knights in Canterbury proved that even a crown could not command a conscience without blood.",
  },
  [`${P}-character-thomas-cromwell`]: {
    rarity: "epic",
    archetype: "scholar",
    statProfile: "offensive",
    flavorText:
      "Blacksmith's son turned king's hammer—he dissolved monasteries, rewrote law, and made Henry's break with Rome workable until one bad marriage cost him everything.",
  },
  [`${P}-character-william-the-conqueror`]: {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "He crossed the Channel with iron hooves and Norman steel; by sunset at Senlac, England had a new dynasty written in blood.",
  },

  // Units
  [`${P}-unit-anglo-saxons`]: {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "defensive",
    flavorText:
      "Settlement, kingdom, and shield-wall—before Normans and Vikings remade the map, the Saxons learned to farm, pray, and die shoulder to shoulder.",
  },
  [`${P}-unit-english-royal-army`]: {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "balanced",
    flavorText:
      "Knights, archers, and men-at-arms under the royal lion—paid, summoned, and marched across the island until war and tax forged something like a nation.",
  },
  [`${P}-unit-norman-army`]: {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "Mail, horse, and castle-building conquerors—1066 was only the beginning; their law, their French, and their fortresses reshaped England for centuries.",
  },
  [`${P}-unit-scottish-army`]: {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "Wallace, Bruce, and Bannockburn—northern spears and stubborn hills broke more than one English dream of one island ruled from Westminster.",
  },
  [`${P}-unit-vikings`]: {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "skirmisher",
    flavorText:
      "Keels on the horizon, axes in the surf—raiders who settled, traded, and crowned kings until Britain learned the North Sea was never a safe border.",
  },
  [`${P}-unit-welsh-forces`]: {
    rarity: "common",
    archetype: "warrior",
    statProfile: "defensive",
    flavorText:
      "Princes in the mountains held out long after lowland kings fell. Castles ringed their land, but their memory outlasted conquest.",
  },

  // Locations
  [`${P}-location-canterbury-cathedral`]: {
    rarity: "uncommon",
    statProfile: "defensive",
    locationBuffAdjust: 2,
    flavorText:
      "Pilgrims' road and martyrs' shrine—Becket's blood in the choir turned Canterbury into a warning that even kings must answer to God.",
  },
  [`${P}-location-england`]: {
    rarity: "rare",
    statProfile: "balanced",
    locationBuffAdjust: 2,
    flavorText:
      "From the Channel to the Cheviots, a kingdom forged by conquest, law, and argument—the prize every dynasty fought to hold, reform, or break.",
  },
  [`${P}-location-hastings`]: {
    rarity: "epic",
    statProfile: "offensive",
    locationBuffAdjust: 4,
    flavorText:
      "Senlac Ridge, 14 October 1066—where Harold's shield-wall broke and England learned that a single afternoon could rewrite a thousand years of fate.",
  },
  [`${P}-location-kilkenny`]: {
    rarity: "uncommon",
    statProfile: "defensive",
    flavorText:
      "Norman stone in Gaelic country—where English law met Irish lordship and Britain's story spilled across the sea into another island's grievance.",
  },
  [`${P}-location-london`]: {
    rarity: "uncommon",
    statProfile: "balanced",
    locationBuffAdjust: 1,
    flavorText:
      "Wealth, riot, and politics in stone and timber—London's merchants and mobs could make or break a king as surely as any army in the field.",
  },
  [`${P}-location-orkney`]: {
    rarity: "uncommon",
    statProfile: "fortress",
    flavorText:
      "Norwegian earls and Neolithic silence—where the northern edge of Britain kept its own calendar of stone, saga, and sea.",
  },
  [`${P}-location-scotland`]: {
    rarity: "uncommon",
    statProfile: "aggressive",
    flavorText:
      "Beyond Hadrian's shadow, Scottish kings and English conquerors collided for generations—Bannockburn answered Falkirk, and the border never truly rested.",
  },
  [`${P}-location-skara-brae`]: {
    rarity: "rare",
    statProfile: "fortress",
    locationBuffAdjust: 2,
    flavorText:
      "Stone beds and buried hearths on Orkney—five thousand years before crowns, Britain's islanders already knew how to endure the winter dark.",
  },
  [`${P}-location-wales`]: {
    rarity: "uncommon",
    statProfile: "defensive",
    flavorText:
      "Castles rose where princes had ruled—Caernarfon, Conwy, Harlech—an iron ring around a people who still sing of lost independence.",
  },
};
