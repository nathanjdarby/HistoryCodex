export const FIRST_KING_CARD_BALANCE: Record<
  string,
  import("@/lib/server/card-balance").CardBalanceDef
> = {
  // Characters
  "custom-constantine-ii-216934a2": {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "King of Alba when the Saxon tide ran highest—he held the north's craggy spine and met Æthelstan's triumph with stubborn exile, not surrender.",
  },
  "custom-athelstan-the-first-king-of-england-439c907c": {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "At Brunanburh he broke the northern alliance and claimed a title no Saxon king had held before—the first true King of all England.",
  },
  "custom-alfred-the-great-410428f8": {
    rarity: "legendary",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "When the Danes held the kingdom, he hid in the marshes, learned their ways, and returned—not merely to reign, but to rebuild a realm worth defending.",
  },
  "custom-edward-the-elder-05404c88": {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "offensive",
    flavorText:
      "Son of Alfred, father of England's reconquest—he pushed the Danelaw back border by border until Wessex's shield became a kingdom's sword.",
  },
  "custom-edmund-c47011ea": {
    rarity: "epic",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "The Martyred King fell to a Viking knife at Pucklechurch, but his short reign burned fierce—Mercia taken, Northumbria claimed, before treachery cut him down.",
  },
  "custom-thelfl-d-66197d10": {
    rarity: "epic",
    archetype: "monarch",
    statProfile: "balanced",
    flavorText:
      "Daughter of Alfred, Lady of the Mercians—she fortified towns, led armies, and proved a king's daughter could hold a frontier as well as any crowned man.",
  },
  "custom-guthfrith-e16c7fa5": {
    rarity: "rare",
    archetype: "monarch",
    statProfile: "skirmisher",
    flavorText:
      "York's Danish king danced between Saxon hammer and Irish allies—crowned, deposed, and crowned again until the north's shifting loyalties wore him out.",
  },
  "custom-hywel-dda-1b6b5207": {
    rarity: "rare",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "They called him Hywel the Good—for he welded Wales with law when sword could not, and made justice a weapon stronger than raid or feud.",
  },
  "custom-eadgyth-31d4a911": {
    rarity: "rare",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "Sister to Æthelstan, queen in Germany and anchor of a Saxon alliance—her marriage tied Wessex to the continent while her brothers fought for England's crown.",
  },
  "custom-sihtric-c-ech-718f06ca": {
    rarity: "rare",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "The One-Eyed Viking took Dublin and York in turn, married into Saxon blood for peace, then broke the bargain—faithless, fierce, and impossible to ignore.",
  },
  "custom-owain-ap-dyfnwal-d98b6f07": {
    rarity: "uncommon",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "King of Strathclyde when Scottish, Norse, and Saxon crowns collided—he held the Clyde valley's passes and marched with the north against Æthelstan's claim.",
  },
  "custom-l-f-guthfrithson-a0edb5a6": {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "His father held York; he sought to hold all Northumbria—Northmen, Gaels, and Strathclyde Welsh rallied to his banner before Brunanburh broke the coalition.",
  },
  "custom-lfweard-664520af": {
    rarity: "rare",
    archetype: "monarch",
    statProfile: "defensive",
    flavorText:
      "Crowned at Winchester beside his father's tomb, he died sixteen days later—barely named, never anointed, a footnote in the making of England.",
  },

  // Events
  "custom-coalition-of-l-f-guthfrithson-constantine-ii-and-owain-ap-dyfnwal-4c356524": {
    rarity: "epic",
    flavorText:
      "Constantine, Óláf, and Owain joined their crowns against Æthelstan—the northern coalition that Brunanburh would shatter before England could stand whole.",
    eventAbility: {
      abilityName: "Counter-Influence",
      abilityEffect: "remove_influence",
      abilityValue: 1,
    },
  },
  "custom-eamont-bridge-e5ef2772": {
    rarity: "uncommon",
    flavorText:
      "On the Eamont stream, kings of Northumbria, Strathclyde, and the Welsh swore peace with Æthelstan—salt and soil traded for a generation forged in treaty, not war.",
    eventAbility: {
      abilityName: "Field Repair",
      abilityEffect: "heal_unit",
      abilityValue: 18,
    },
  },

  // Units
  "custom-west-saxons-f927c74f": {
    rarity: "common",
    archetype: "warrior",
    statProfile: "defensive",
    flavorText:
      "Alfred's shield-wall—fyrd and thegn standing in the burhs, holding the line while the kingdom learned to fight as one people under one crown.",
  },
  "custom-vikings-2feb30f6": {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "aggressive",
    flavorText:
      "Dragon-prowed ships and axe-men from across the sea—they raided, settled, and crowned kings in York until Saxon steel and Saxon law pushed them back.",
  },
  "custom-anglo-saxons-96b3ea21": {
    rarity: "uncommon",
    archetype: "warrior",
    statProfile: "balanced",
    flavorText:
      "Spear, shield, and thegn's oath—the war-band of a rising England, forged in Alfred's burhs and tempered in the battles that made one kingdom from many realms.",
  },

  // Locations
  "custom-brunanburh-bddd69df": {
    rarity: "legendary",
    locationBuffAdjust: 5,
    flavorText:
      "Five kings met on this field; one walked away master of Britain. Brunanburh fixed England's border in blood and gave Æthelstan a victory the bards still sing.",
  },
  "custom-england-6b4360fb": {
    rarity: "epic",
    flavorText:
      "Not merely Wessex grown large—a kingdom forged by treaty, marriage, and war until one crown claimed the island south of the Scots and east of the Welsh.",
  },
  "custom-alba-0857ca9d": {
    rarity: "rare",
    flavorText:
      "The Gaelic north beyond the Forth—Constantine's realm of crag and loch, where Scottish kings endured Saxon triumph and waited for their own hour.",
  },
  "custom-bamburgh-628b1c5e": {
    rarity: "rare",
    locationBuffAdjust: 3,
    flavorText:
      "The fortress on its basalt rock—Bernicia's ancient seat, where Northumbrian kings looked out to sea and defied every wave of raider or conqueror.",
  },
  "custom-cornwall-26ad25cf": {
    rarity: "uncommon",
    flavorText:
      "At the land's western edge, Celtic Cornwall kept its tongue and its princes—half in England's orbit, half in memory of a Britain before the Saxons came.",
  },
  "custom-exeter-673ab3ca": {
    rarity: "uncommon",
    flavorText:
      "Roman walls guarding the Exe—Alfred's burh on the frontier with Cornwall, where West Saxon law met the west country and held.",
  },
  "custom-wales-5936b6c6": {
    rarity: "uncommon",
    flavorText:
      "Mountains, valleys, and princes who answered to no English king—Hywel's laws and Eamont's oaths bound Wales to peace as often as war.",
  },
  "custom-strathclyde-cumbria-e8d9abf6": {
    rarity: "common",
    flavorText:
      "The Clyde kingdom and the Cumbrian hills—Owain's realm, a buffer between Alba, Northumbria, and the Saxon advance, always courted and always contested.",
  },
  "custom-kingston-upon-thames-bf26a0d9": {
    rarity: "common",
    flavorText:
      "Where the Thames runs broad—kings were proclaimed here long before Westminster, and the river carried Saxon power toward London and the sea.",
  },
  "custom-malmesbury-abbey-1af412dc": {
    rarity: "common",
    flavorText:
      "Benedictine stone on a hill in Wiltshire—Æthelstan's burial place and a shrine to the learning Alfred had rescued from the Danish fire.",
  },
  "custom-mercia-8c66dfe8": {
    rarity: "uncommon",
    flavorText:
      "The midland kingdom between Thames and Humber—Æthelflæd's fortress line and the heartland that linked Wessex's reconquest to the north.",
  },
  "custom-northumbria-a026364b": {
    rarity: "uncommon",
    flavorText:
      "From the Humber to the Cheviots—Bamburgh, York, and Lindisfarne's shadow. The prize every Viking and Saxon king fought to hold or break.",
  },
  "custom-wessex-56f523e7": {
    rarity: "uncommon",
    flavorText:
      "Alfred's cradle and Edward's launching ground—the southern realm that survived the Great Heathen Army and grew, piece by piece, into England.",
  },
  "custom-winchester-8f520ae7": {
    rarity: "uncommon",
    flavorText:
      "Capital of Wessex and tomb of kings—where Alfred translated wisdom into English and where Ælfweard's sixteen-day reign began and ended.",
  },
  "custom-york-dfcde10a": {
    rarity: "uncommon",
    flavorText:
      "Eboracum of the Romans, Jorvik of the Northmen—York crowned Danish kings and Saxon earls alike, the key to holding all Northumbria.",
  },
};
