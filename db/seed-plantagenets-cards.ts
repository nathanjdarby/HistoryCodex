import { eq } from "drizzle-orm";
import { db } from "./index";
import { catalogBooks, characters } from "./schema";
import { listCatalogBookCards } from "../lib/server/catalog-book-cards";
import { computeDefaultBattleStats, computeDefaultLocationBuff } from "../lib/battle";
import type { Archetype, Rarity } from "../lib/sprite/generateSprite";

const BOOK_TITLE = "The Plantagenets";

const costByRarity: Record<Rarity, number> = {
  common: 20,
  uncommon: 40,
  rare: 75,
  epic: 150,
  legendary: 300,
  mythic: 450,
};

type CardDef = {
  seed: string;
  rarity: Rarity;
  archetype?: Archetype | null;
  flavorText: string;
};

const CARD_DEFS: CardDef[] = [
  // Characters
  {
    seed: "the-plantagenets-character-henry-ii",
    rarity: "legendary",
    archetype: "monarch",
    flavorText:
      "From Anjou he inherited ambition and from Eleanor a crown that spanned the Channel. His courts, his quarrels, and his sons would define kingship for a century.",
  },
  {
    seed: "the-plantagenets-character-eleanor-of-aquitaine",
    rarity: "legendary",
    archetype: "monarch",
    flavorText:
      "Queen of France, then Queen of England, mother of kings and rebel sons—she outlived husbands, crusades, and captivity, and never surrendered her will.",
  },
  {
    seed: "the-plantagenets-character-richard-i",
    rarity: "epic",
    archetype: "warrior",
    flavorText:
      "The Lionheart spent barely a year in England and a lifetime in the saddle—crusader, captive, legend—while his kingdom paid the ransom and bore the cost.",
  },
  {
    seed: "the-plantagenets-character-edward-iii",
    rarity: "epic",
    archetype: "monarch",
    flavorText:
      "He claimed the French throne and backed it with war, chivalry, and the longbow. Under his long reign England learned to fight like a nation, not a feudal patchwork.",
  },
  {
    seed: "the-plantagenets-character-william-marshal",
    rarity: "epic",
    archetype: "warrior",
    flavorText:
      "Tourney champion, regent, and faithful servant of five kings—when others broke their oaths, the Marshal kept his, and England held together.",
  },
  {
    seed: "the-plantagenets-character-thomas-becket",
    rarity: "rare",
    archetype: "scholar",
    flavorText:
      "The king's friend became the Church's martyr. Four knights in Canterbury proved that even a crown could not command a conscience without blood.",
  },
  {
    seed: "the-plantagenets-character-john",
    rarity: "rare",
    archetype: "monarch",
    flavorText:
      "Bad king, worse brother, unforgettable failure—yet at Runnymede his barons forced his seal onto a charter that outlived every Plantagenet grudge.",
  },
  {
    seed: "the-plantagenets-character-empress-matilda",
    rarity: "rare",
    archetype: "monarch",
    flavorText:
      "Daughter of Henry I, she fought a kingdom for her father's oath. The Anarchy tore England apart before her son finally wore the crown she had claimed.",
  },
  {
    seed: "the-plantagenets-character-edward-the-black-prince",
    rarity: "rare",
    archetype: "warrior",
    flavorText:
      "At Crécy and Poitiers he showed what English arms could do—chivalry sharpened into slaughter, and a prince who dazzled Europe before dying too young.",
  },
  {
    seed: "the-plantagenets-character-edward-i",
    rarity: "uncommon",
    archetype: "monarch",
    flavorText:
      "Hammer of the Scots, conqueror of Wales, lawgiver and iron king—he built the frame of Britain with parliament, statute, and relentless war.",
  },
  {
    seed: "the-plantagenets-character-simon-de-montfort",
    rarity: "uncommon",
    archetype: "leader",
    flavorText:
      "He turned on the king he had once served and summoned knights and towns to parliament. At Evesham his rebellion died, but the idea did not.",
  },
  {
    seed: "the-plantagenets-character-henry-bolingbroke",
    rarity: "uncommon",
    archetype: "monarch",
    flavorText:
      "Exiled duke, returned avenger—he deposed Richard II and took a crown stained with usurpation, opening the door to the Wars of the Roses.",
  },
  {
    seed: "the-plantagenets-character-edward-ii",
    rarity: "common",
    flavorText:
      "Defeat at Bannockburn, favourites at court, and a reign undone by favourites and barons alike—his crown ended in abdication and a red-hot poker.",
  },
  {
    seed: "the-plantagenets-character-henry-i",
    rarity: "common",
    flavorText:
      "The youngest son who outlasted his brothers and tried to bind England with one heir. When the White Ship sank, his peace sank with it.",
  },
  {
    seed: "the-plantagenets-character-henry-iii",
    rarity: "common",
    flavorText:
      "Pious, extravagant, and long-lived—he rebuilt Westminster in stone while barons and brother-in-law Simon de Montfort tested the limits of royal power.",
  },
  {
    seed: "the-plantagenets-character-richard-ii",
    rarity: "common",
    flavorText:
      "Poetic, proud, and brittle—he ruled by majesty and revenge until his cousins decided a king could be unmade as well as crowned.",
  },
  {
    seed: "the-plantagenets-character-geoffrey-plantagenet",
    rarity: "common",
    flavorText:
      "Count of Anjou and father of a dynasty—his surname became England's destiny, though he wore a crown of flowers more often than a crown of gold.",
  },
  {
    seed: "the-plantagenets-character-isabella-of-france",
    rarity: "common",
    flavorText:
      "The She-Wolf of France sailed home to topple her husband. With Roger Mortimer she ruled in her son's name—and taught England fear of a queen scorned.",
  },
  {
    seed: "the-plantagenets-character-piers-gaveston",
    rarity: "common",
    flavorText:
      "Edward II's favourite dazzled and enraged the barons in equal measure. Exile, return, and execution—friendship at court could be deadlier than war.",
  },
  {
    seed: "the-plantagenets-character-roger-mortimer",
    rarity: "common",
    flavorText:
      "Escaping the Tower, he returned with Isabella to rule through a boy king. Power gained by rebellion was lost the same way—on the gallows at Tyburn.",
  },

  // Units
  {
    seed: "the-plantagenets-unit-english-longbowmen",
    rarity: "uncommon",
    archetype: "warrior",
    flavorText:
      "Yew staves trained from childhood, unleashed in storms of cloth-yard shafts—at Crécy and Poitiers they broke chivalry's charge and remade European war.",
  },
  {
    seed: "the-plantagenets-unit-english-royal-army",
    rarity: "uncommon",
    archetype: "warrior",
    flavorText:
      "Knights, archers, and men-at-arms under the royal lion—paid, summoned, and marched across France until English kings learned war could bankrupt a realm.",
  },
  {
    seed: "the-plantagenets-unit-order-of-the-garter",
    rarity: "rare",
    archetype: "leader",
    flavorText:
      "Edward III bound his greatest companions with a blue garter and a vow of honour. Chivalry became ceremony, and ceremony became power.",
  },
  {
    seed: "the-plantagenets-unit-knights-templar",
    rarity: "common",
    archetype: "warrior",
    flavorText:
      "Crusaders, bankers, and legend—Their cross marched to Jerusalem and their wealth made kings uneasy, until Philip and the Pope dissolved them in fire.",
  },
  {
    seed: "the-plantagenets-unit-rebel-barons",
    rarity: "common",
    archetype: "warrior",
    flavorText:
      "When kings overreached, the magnates answered with swords and charters—Runnymede, Lewes, and Evesham all began with barons who refused to kneel.",
  },
  {
    seed: "the-plantagenets-unit-scottish-army",
    rarity: "common",
    archetype: "warrior",
    flavorText:
      "Wallace, Bruce, and Bannockburn—northern spears and stubborn hills broke Edward I's dream of one island ruled from Westminster.",
  },
  {
    seed: "the-plantagenets-unit-welsh-forces",
    rarity: "common",
    archetype: "warrior",
    flavorText:
      "Princes in the mountains held out long after lowland kings fell. Edward I ringed their land with castles, but their memory outlasted conquest.",
  },

  // Locations
  {
    seed: "the-plantagenets-location-runnymede",
    rarity: "rare",
    flavorText:
      "By the Thames in June 1215, barons forced a king to seal limits on his own power. Magna Carta began as rebellion and became England's conscience.",
  },
  {
    seed: "the-plantagenets-location-crecy",
    rarity: "rare",
    flavorText:
      "On a hillside in Picardy the longbow answered French chivalry. Edward III's archers turned a heraldic charge into a slaughter that shook Europe.",
  },
  {
    seed: "the-plantagenets-location-westminster",
    rarity: "uncommon",
    flavorText:
      "Coronations, parliaments, and tombs of kings—Westminster Abbey and the palace beside it became the stone heart of English government.",
  },
  {
    seed: "the-plantagenets-location-canterbury-cathedral",
    rarity: "uncommon",
    flavorText:
      "Pilgrims' road and martyrs' shrine—Becket's blood in the choir turned Canterbury into a warning that even kings must answer to God.",
  },
  {
    seed: "the-plantagenets-location-poitiers",
    rarity: "uncommon",
    flavorText:
      "Ten years after Crécy, the Black Prince captured a king on the field. Poitiers proved the longbow was not luck but a new way of war.",
  },
  {
    seed: "the-plantagenets-location-aquitaine",
    rarity: "uncommon",
    flavorText:
      "Eleanor's inheritance and England's foothold in France—vineyards, ports, and a duchy that tied the Plantagenets to continental glory and endless war.",
  },
  {
    seed: "the-plantagenets-location-anjou",
    rarity: "common",
    flavorText:
      "The ancestral county that gave the dynasty its name—Plantagenet stems from the broom flower Geoffrey wore, rooted in the Loire's restless soil.",
  },
  {
    seed: "the-plantagenets-location-bouvines",
    rarity: "common",
    flavorText:
      "In 1214 Philip Augustus shattered the Angevin alliance. Bouvines broke John in France and sent him home to face rebellion and Runnymede.",
  },
  {
    seed: "the-plantagenets-location-calais",
    rarity: "common",
    flavorText:
      "Edward III held the port for two hundred years—the pale of English France, won by siege and kept as a dagger pointed at the continent.",
  },
  {
    seed: "the-plantagenets-location-england",
    rarity: "common",
    flavorText:
      "From the Channel to the Cheviots, a kingdom forged by conquest, law, and war—the prize every Plantagenet king fought to hold and enlarge.",
  },
  {
    seed: "the-plantagenets-location-evesham",
    rarity: "common",
    flavorText:
      "In the Vale of Evesham Simon de Montfort's body was hacked apart and his cause cut down. Royal victory, but parliament's seed had already been sown.",
  },
  {
    seed: "the-plantagenets-location-jerusalem",
    rarity: "common",
    flavorText:
      "The holy city drew Richard's crusade and the Templars' vow. Jerusalem remained the dream that pulled English kings east while France waited in the west.",
  },
  {
    seed: "the-plantagenets-location-lewes",
    rarity: "common",
    flavorText:
      "On the downs above Lewes, Simon de Montfort routed Henry III and for a moment ruled England through a captive king and a summoned parliament.",
  },
  {
    seed: "the-plantagenets-location-london",
    rarity: "common",
    flavorText:
      "Wealth, riot, and politics in stone and timber—London's merchants and mobs could make or break a king as surely as any army in the field.",
  },
  {
    seed: "the-plantagenets-location-normandy",
    rarity: "common",
    flavorText:
      "William's duchy became the Plantagenets' first French anchor. To lose Normandy was to lose the root of their continental empire.",
  },
  {
    seed: "the-plantagenets-location-scotland",
    rarity: "common",
    flavorText:
      "Beyond Hadrian's shadow, Scottish kings and English conquerors collided for generations—Bannockburn answered Falkirk, and the border never truly rested.",
  },
  {
    seed: "the-plantagenets-location-wales",
    rarity: "common",
    flavorText:
      "Castles rose where princes had ruled—Caernarfon, Conwy, Harlech—Edward I's iron ring around a people who still sing of lost independence.",
  },
];

async function main() {
  const [book] = await db.select().from(catalogBooks).where(eq(catalogBooks.title, BOOK_TITLE));
  if (!book) throw new Error(`Catalog book not found: ${BOOK_TITLE}`);

  const linked = await listCatalogBookCards(book.id);
  const bySeed = new Map(linked.map((row) => [row.seed, row]));

  let updated = 0;
  for (const def of CARD_DEFS) {
    const row = bySeed.get(def.seed);
    if (!row) {
      console.warn(`Skipping missing card: ${def.seed}`);
      continue;
    }

    const cardType = row.cardType;
    const archetype = def.archetype ?? null;
    const cost = costByRarity[def.rarity];

    if (cardType === "location") {
      await db
        .update(characters)
        .set({
          rarity: def.rarity,
          cost,
          flavorText: def.flavorText,
          archetype: null,
          attack: 0,
          defense: 0,
          abilityName: null,
          abilityEffect: null,
          abilityValue: null,
          abilityTrigger: null,
          ...computeDefaultLocationBuff(def.rarity),
        })
        .where(eq(characters.id, row.characterId));
    } else if (cardType === "event") {
      await db
        .update(characters)
        .set({
          rarity: def.rarity,
          cost,
          flavorText: def.flavorText,
          archetype: null,
          attack: 0,
          defense: 0,
          abilityName: null,
          abilityEffect: null,
          abilityValue: null,
          abilityTrigger: null,
        })
        .where(eq(characters.id, row.characterId));
    } else {
      const stats = computeDefaultBattleStats(def.rarity, archetype);
      await db
        .update(characters)
        .set({
          rarity: def.rarity,
          cost,
          flavorText: def.flavorText,
          archetype,
          attack: stats.attack,
          defense: stats.defense,
          abilityName: stats.abilityName,
          abilityEffect: stats.abilityEffect,
          abilityValue: stats.abilityValue,
        })
        .where(eq(characters.id, row.characterId));
    }

    updated++;
    console.log(`Updated ${row.name} (${def.rarity})`);
  }

  const missingDefs = linked.filter((row) => !CARD_DEFS.some((def) => def.seed === row.seed));
  if (missingDefs.length > 0) {
    console.warn(
      `Cards linked to book without definitions: ${missingDefs.map((row) => row.name).join(", ")}`,
    );
  }

  console.log(`Updated ${updated} cards on "${BOOK_TITLE}" (catalog book #${book.id}).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
