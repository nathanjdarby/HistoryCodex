import { eq } from "drizzle-orm";
import { db } from "./index";
import { eras, characters } from "./schema";
import { computeDefaultBattleStats, computeDefaultLocationBuff } from "../lib/battle";

type EraSeed = {
  name: string;
  slug: string;
  startYear: number;
  endYear: number;
  colorPrimary: string;
  colorSecondary: string;
  region: string;
  description: string;
};

const currentYear = new Date().getFullYear();

const britishEras: EraSeed[] = [
  {
    name: "Roman Britain",
    slug: "roman-britain",
    startYear: 43,
    endYear: 410,
    colorPrimary: "#7f1d1d",
    colorSecondary: "#d4af37",
    region: "Britain",
    description: "From the Claudian invasion to the withdrawal of Roman legions.",
  },
  {
    name: "Anglo-Saxon England",
    slug: "anglo-saxon-england",
    startYear: 410,
    endYear: 1066,
    colorPrimary: "#14532d",
    colorSecondary: "#a16207",
    region: "Britain",
    description: "The age of the Heptarchy, Christianisation, and Viking incursions.",
  },
  {
    name: "Medieval England",
    slug: "medieval-england",
    startYear: 1066,
    endYear: 1485,
    colorPrimary: "#1e3a8a",
    colorSecondary: "#b91c1c",
    region: "Britain",
    description: "From the Norman Conquest through the Wars of the Roses.",
  },
  {
    name: "Tudor England",
    slug: "tudor-england",
    startYear: 1485,
    endYear: 1603,
    colorPrimary: "#7c2d12",
    colorSecondary: "#ca8a04",
    region: "Britain",
    description: "The Tudor dynasty, the Reformation, and the Elizabethan age.",
  },
  {
    name: "Stuart England",
    slug: "stuart-england",
    startYear: 1603,
    endYear: 1714,
    colorPrimary: "#4c1d95",
    colorSecondary: "#b45309",
    region: "Britain",
    description: "Civil war, republic, restoration, and the Glorious Revolution.",
  },
  {
    name: "Georgian Britain",
    slug: "georgian-britain",
    startYear: 1714,
    endYear: 1837,
    colorPrimary: "#075985",
    colorSecondary: "#be185d",
    region: "Britain",
    description: "Enlightenment, empire-building, and the early Industrial Revolution.",
  },
  {
    name: "Victorian Britain",
    slug: "victorian-britain",
    startYear: 1837,
    endYear: 1901,
    colorPrimary: "#1c1917",
    colorSecondary: "#854d0e",
    region: "Britain",
    description: "Industrial expansion and the height of the British Empire.",
  },
  {
    name: "Modern Britain",
    slug: "modern-britain",
    startYear: 1901,
    endYear: currentYear,
    colorPrimary: "#1d4ed8",
    colorSecondary: "#dc2626",
    region: "Britain",
    description: "From the Edwardian era through two world wars to the present.",
  },
];

const worldEras: EraSeed[] = [
  {
    name: "Ancient Egypt – Old Kingdom",
    slug: "ancient-egypt-old-kingdom",
    startYear: -2686,
    endYear: -2181,
    colorPrimary: "#b45309",
    colorSecondary: "#0e7490",
    region: "Egypt",
    description: "The age of pyramid-building pharaohs, from Djoser to Pepi II.",
  },
  {
    name: "Ancient Greece – Classical",
    slug: "ancient-greece-classical",
    startYear: -500,
    endYear: -323,
    colorPrimary: "#1d4ed8",
    colorSecondary: "#e7e5e4",
    region: "Greece",
    description: "Athenian democracy, Persian Wars, and the age of philosophy.",
  },
  {
    name: "Roman Empire",
    slug: "roman-empire",
    startYear: -27,
    endYear: 476,
    colorPrimary: "#991b1b",
    colorSecondary: "#ca8a04",
    region: "Mediterranean",
    description: "From Augustus to the fall of the Western Roman Empire.",
  },
  {
    name: "Tang Dynasty China",
    slug: "tang-dynasty-china",
    startYear: 618,
    endYear: 907,
    colorPrimary: "#b91c1c",
    colorSecondary: "#ca8a04",
    region: "China",
    description: "A golden age of Chinese culture, trade, and poetry.",
  },
  {
    name: "Mughal India",
    slug: "mughal-india",
    startYear: 1526,
    endYear: 1857,
    colorPrimary: "#166534",
    colorSecondary: "#ca8a04",
    region: "India",
    description: "From Babur's conquest to the twilight of Mughal rule.",
  },
];

const archetypes = ["warrior", "scholar", "monarch", "merchant", "sailor", "leader"] as const;
const flavorByArchetype: Record<(typeof archetypes)[number], string> = {
  warrior: "Steel remembers every oath sworn upon it.",
  scholar: "History does not sleep; it waits in ink and margin.",
  monarch: "A crown is heavy long before it reaches the brow.",
  merchant: "Every road leads somewhere worth selling.",
};
const locationFlavorText =
  "Those who hold this ground find the past harder to dislodge than any army.";
const epithets: Record<(typeof archetypes)[number], [string, string]> = {
  warrior: ["Swordsman", "Shield-Bearer"],
  scholar: ["Chronicler", "Sage"],
  monarch: ["Regent", "Claimant"],
  merchant: ["Trader", "Guildmaster"],
};
const rarityOrder = [
  "common",
  "common",
  "common",
  "uncommon",
  "uncommon",
  "rare",
  "epic",
  "legendary",
] as const;
const costByRarity: Record<(typeof rarityOrder)[number] | "mythic", number> = {
  common: 20,
  uncommon: 40,
  rare: 75,
  epic: 150,
  legendary: 300,
  mythic: 450,
};

async function seedEra(eraSeed: EraSeed) {
  const [existing] = await db.select().from(eras).where(eq(eras.slug, eraSeed.slug));
  const era = existing ?? (await db.insert(eras).values(eraSeed).returning())[0];

  const existingCharacters = await db
    .select()
    .from(characters)
    .where(eq(characters.eraId, era.id));
  if (existingCharacters.length > 0) return era;

  const rows = rarityOrder.map((rarity, i) => {
    const archetype = archetypes[i % archetypes.length];
    const epithet = epithets[archetype][Math.floor(i / archetypes.length)];
    return {
      eraId: era.id,
      name: `${era.name} ${epithet}`,
      seed: `${era.slug}-${i + 1}`,
      cardType: "unit" as const,
      rarity,
      cost: costByRarity[rarity],
      archetype,
      flavorText: flavorByArchetype[archetype],
      ...computeDefaultBattleStats(rarity, archetype),
    };
  });
  await db.insert(characters).values(rows);
  return era;
}

const LOCATION_NAME_BY_SLUG: Record<string, string> = {
  "roman-britain": "Londinium",
  "anglo-saxon-england": "Kingdom of Wessex",
  "medieval-england": "Tower of London",
  "tudor-england": "Hampton Court Palace",
  "stuart-england": "Palace of Whitehall",
  "georgian-britain": "Bath",
  "victorian-britain": "Crystal Palace",
  "modern-britain": "Bletchley Park",
  "ancient-egypt-old-kingdom": "Great Pyramid of Giza",
  "ancient-greece-classical": "The Parthenon",
  "roman-empire": "The Colosseum",
  "tang-dynasty-china": "Chang'an",
  "mughal-india": "Red Fort",
};

async function seedLocationForEra(era: { id: number; slug: string; name: string }) {
  const seed = `${era.slug}-location-1`;
  const [existing] = await db.select().from(characters).where(eq(characters.seed, seed));
  if (existing) return;

  const rarity = "rare" as const;
  await db.insert(characters).values({
    eraId: era.id,
    name: LOCATION_NAME_BY_SLUG[era.slug] ?? `${era.name} Stronghold`,
    seed,
    cardType: "location",
    rarity,
    cost: costByRarity[rarity],
    archetype: null,
    attack: 0,
    defense: 0,
    flavorText: locationFlavorText,
    ...computeDefaultLocationBuff(rarity),
  });
}

async function main() {
  for (const eraSeed of [...britishEras, ...worldEras]) {
    await seedEra(eraSeed);
  }
  for (const eraSeed of [...britishEras, ...worldEras]) {
    const [era] = await db.select().from(eras).where(eq(eras.slug, eraSeed.slug));
    await seedLocationForEra(era);
  }
  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
