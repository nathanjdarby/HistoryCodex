import { eq } from "drizzle-orm";
import { db } from "./index";
import { characters, eras } from "./schema";
import { resolveCardBalance } from "./data/card-balance";
import { applyCardBalance } from "../lib/server/apply-card-balance";
import type { EraInput } from "../lib/server/eras";

const STAGING_ERA_SLUG = "to-organise";

const NEW_ERAS: (EraInput & { slug: string })[] = [
  {
    slug: "medieval-norway",
    name: "Medieval Norway",
    startYear: 1030,
    endYear: 1387,
    colorPrimary: "#1e3a5f",
    colorSecondary: "#c0c0c0",
    region: "Norway",
    description: "From St Olav's legacy through civil wars to the Kalmar Union.",
  },
  {
    slug: "kalmar-union",
    name: "Kalmar Union",
    startYear: 1397,
    endYear: 1523,
    colorPrimary: "#ffd700",
    colorSecondary: "#005293",
    region: "Scandinavia",
    description: "Margrete's union of Denmark, Norway, and Sweden.",
  },
  {
    slug: "denmark-norway",
    name: "Denmark–Norway",
    startYear: 1537,
    endYear: 1814,
    colorPrimary: "#c8102e",
    colorSecondary: "#005293",
    region: "Norway",
    description: "Personal union under Copenhagen after the Reformation.",
  },
  {
    slug: "norway-1814",
    name: "Norway 1814",
    startYear: 1813,
    endYear: 1815,
    colorPrimary: "#ba0c2f",
    colorSecondary: "#00205b",
    region: "Norway",
    description: "Constitution, Christian Frederik, and the scramble after Napoleon.",
  },
  {
    slug: "modern-norway",
    name: "Modern Norway",
    startYear: 1814,
    endYear: 1940,
    colorPrimary: "#005293",
    colorSecondary: "#ffffff",
    region: "Norway",
    description: "Independence, union with Sweden, and nation-building to 1940.",
  },
  {
    slug: "occupied-norway",
    name: "Occupied Norway",
    startYear: 1940,
    endYear: 1945,
    colorPrimary: "#374151",
    colorSecondary: "#005293",
    region: "Norway",
    description: "German occupation, Quisling, and the Home Front resistance.",
  },
  {
    slug: "classical-japan",
    name: "Classical Japan",
    startYear: 538,
    endYear: 794,
    colorPrimary: "#bc002d",
    colorSecondary: "#f5f0e6",
    region: "Japan",
    description: "Yamato kingship, Buddhism, and the ritsuryō reforms from Asuka through Nara.",
  },
  {
    slug: "heian-japan",
    name: "Heian Japan",
    startYear: 794,
    endYear: 1185,
    colorPrimary: "#6b21a8",
    colorSecondary: "#fcd34d",
    region: "Japan",
    description: "Fujiwara regency, insei, and court culture until the Genpei War.",
  },
  {
    slug: "kamakura-japan",
    name: "Kamakura Japan",
    startYear: 1185,
    endYear: 1333,
    colorPrimary: "#1e3a5f",
    colorSecondary: "#bc002d",
    region: "Japan",
    description: "Warrior government, Hōjō regents, Mongol invasions, and Go-Daigo's revolt.",
  },
];

/** Cards in .to-organise → target era slug. */
const SEED_ERA_SLUG: Record<string, string> = {
  // Viking Age Norway
  "history-of-norway-character-harald-fairhair": "the-viking-age",
  "history-of-norway-character-hakon-the-good": "the-viking-age",
  "history-of-norway-character-olav-tryggvason": "the-viking-age",
  "history-of-norway-character-harald-hardrade": "the-viking-age",
  "history-of-norway-character-st-olav": "the-viking-age",
  "history-of-norway-unit-vikings": "the-viking-age",
  "history-of-norway-location-iceland": "the-viking-age",
  "history-of-norway-location-greenland": "the-viking-age",
  "history-of-norway-location-north-america": "the-viking-age",
  "history-of-norway-location-stamford-bridge": "the-viking-age",

  // High medieval Norway
  "history-of-norway-character-sverre-sigurdsson": "medieval-norway",
  "history-of-norway-unit-birkebeiner": "medieval-norway",

  // Kalmar Union
  "history-of-norway-character-queen-margrete": "kalmar-union",
  "history-of-norway-character-pietro-querini": "kalmar-union",

  // Denmark–Norway
  "history-of-norway-location-norway": "denmark-norway",
  "history-of-norway-location-roros": "denmark-norway",

  // Norway 1814
  "history-of-norway-character-christian-frederik": "norway-1814",
  "history-of-norway-location-eidsvoll": "norway-1814",
  "history-of-norway-location-kiel": "norway-1814",
  "history-of-norway-location-leipzig": "norway-1814",

  // Modern Norway
  "history-of-norway-character-edvard-grieg": "modern-norway",
  "history-of-norway-location-oslo": "modern-norway",

  // Occupied Norway
  "history-of-norway-unit-german-occupation-forces-in-norway": "occupied-norway",
  "history-of-norway-unit-norwegian-military-resistance": "occupied-norway",
  "history-of-norway-location-telavag": "occupied-norway",

  // Shared location (also on France book)
  "history-of-norway-location-normandy": "the-norman-era",

  // History of Britain Volume 2 — Stuart England
  "a-history-of-britain-volume-2-character-charles-i": "stuart-england",
  "a-history-of-britain-volume-2-character-oliver-cromwell": "stuart-england",
  "a-history-of-britain-volume-2-character-charles-ii": "stuart-england",
  "a-history-of-britain-volume-2-character-james-ii": "stuart-england",
  "a-history-of-britain-volume-2-character-william-iii": "stuart-england",
  "a-history-of-britain-volume-2-character-mary-ii": "stuart-england",
  "a-history-of-britain-volume-2-character-anne": "stuart-england",
  "a-history-of-britain-volume-2-character-james-vi-and-i": "stuart-england",
  "a-history-of-britain-volume-2-character-john-churchill-1st-duke-of-marlborough": "stuart-england",
  "a-history-of-britain-volume-2-event-wars-of-the-three-kingdoms": "stuart-england",
  "a-history-of-britain-volume-2-event-execution-of-charles-i": "stuart-england",
  "a-history-of-britain-volume-2-event-restoration-of-the-monarchy": "stuart-england",
  "a-history-of-britain-volume-2-event-glorious-revolution": "stuart-england",
  "a-history-of-britain-volume-2-event-battle-of-blenheim": "stuart-england",
  "a-history-of-britain-volume-2-event-acts-of-union": "stuart-england",
  "a-history-of-britain-volume-2-location-naseby": "stuart-england",
  "a-history-of-britain-volume-2-location-oxford": "stuart-england",
  "a-history-of-britain-volume-2-location-edinburgh": "stuart-england",
  "a-history-of-britain-volume-2-location-ireland": "stuart-england",
  "a-history-of-britain-volume-2-location-blenheim": "stuart-england",
  "a-history-of-britain-volume-2-unit-new-model-army": "stuart-england",
  "a-history-of-britain-volume-2-unit-parliamentarian-forces": "stuart-england",
  "a-history-of-britain-volume-2-unit-royalist-forces": "stuart-england",

  // History of Britain Volume 2 — Georgian Britain
  "a-history-of-britain-volume-2-character-robert-walpole": "georgian-britain",
  "a-history-of-britain-volume-2-character-george-iii": "georgian-britain",
  "a-history-of-britain-volume-2-event-seven-years-war": "georgian-britain",
  "a-history-of-britain-volume-2-event-american-revolution-begins": "georgian-britain",
  "a-history-of-britain-volume-2-location-london": "georgian-britain",
  "a-history-of-britain-volume-2-location-boston": "georgian-britain",
  "a-history-of-britain-volume-2-unit-royal-navy": "georgian-britain",
  "a-history-of-britain-volume-2-unit-british-army": "georgian-britain",
  "a-history-of-britain-volume-2-unit-continental-army": "georgian-britain",

  // History of Britain Volume 2 — Bourbon France (British book, French cards)
  "a-history-of-britain-volume-2-character-louis-xiv": "bourbon-france",
  "a-history-of-britain-volume-2-location-versailles": "bourbon-france",

  // History of Britain Volume 3 — Georgian Britain
  "a-history-of-britain-volume-3-character-edmund-burke": "georgian-britain",
  "a-history-of-britain-volume-3-character-thomas-paine": "georgian-britain",
  "a-history-of-britain-volume-3-character-horatio-nelson": "georgian-britain",
  "a-history-of-britain-volume-3-character-arthur-wellesley-1st-duke-of-wellington": "georgian-britain",
  "a-history-of-britain-volume-3-event-battle-of-trafalgar": "georgian-britain",
  "a-history-of-britain-volume-3-event-battle-of-waterloo": "georgian-britain",
  "a-history-of-britain-volume-3-event-great-reform-act": "georgian-britain",
  "a-history-of-britain-volume-3-location-trafalgar": "georgian-britain",
  "a-history-of-britain-volume-3-location-waterloo": "georgian-britain",
  "a-history-of-britain-volume-3-unit-royal-navy": "georgian-britain",

  // History of Britain Volume 3 — Victorian Britain
  "a-history-of-britain-volume-3-character-queen-victoria": "victorian-britain",
  "a-history-of-britain-volume-3-character-prince-albert": "victorian-britain",
  "a-history-of-britain-volume-3-character-florence-nightingale": "victorian-britain",
  "a-history-of-britain-volume-3-character-william-ewart-gladstone": "victorian-britain",
  "a-history-of-britain-volume-3-character-benjamin-disraeli": "victorian-britain",
  "a-history-of-britain-volume-3-character-charles-george-gordon": "victorian-britain",
  "a-history-of-britain-volume-3-event-great-exhibition": "victorian-britain",
  "a-history-of-britain-volume-3-event-great-famine-in-ireland": "victorian-britain",
  "a-history-of-britain-volume-3-event-indian-rebellion-of-1857": "victorian-britain",
  "a-history-of-britain-volume-3-location-crystal-palace": "victorian-britain",
  "a-history-of-britain-volume-3-location-india": "victorian-britain",
  "a-history-of-britain-volume-3-location-delhi": "victorian-britain",
  "a-history-of-britain-volume-3-location-ireland": "victorian-britain",
  "a-history-of-britain-volume-3-location-london": "victorian-britain",
  "a-history-of-britain-volume-3-location-westminster": "victorian-britain",
  "a-history-of-britain-volume-3-unit-british-army": "victorian-britain",
  "a-history-of-britain-volume-3-unit-east-india-company-armies": "victorian-britain",
  "a-history-of-britain-volume-3-unit-indian-rebels-of-1857": "victorian-britain",

  // History of Britain Volume 3 — Modern Britain
  "a-history-of-britain-volume-3-character-winston-churchill": "modern-britain",
  "a-history-of-britain-volume-3-event-first-world-war": "modern-britain",
  "a-history-of-britain-volume-3-event-second-world-war": "modern-britain",
  "a-history-of-britain-volume-3-event-representation-of-the-people-act-1918": "modern-britain",
  "a-history-of-britain-volume-3-event-indian-independence-and-partition": "modern-britain",
  "a-history-of-britain-volume-3-location-gallipoli": "modern-britain",
  "a-history-of-britain-volume-3-location-britain": "modern-britain",
  "a-history-of-britain-volume-3-unit-british-expeditionary-force": "modern-britain",

  // A History of Japan to 1334 — Classical Japan
  "a-history-of-japan-to-1334-character-prince-shotoku": "classical-japan",
  "a-history-of-japan-to-1334-character-fujiwara-no-kamatari": "classical-japan",
  "a-history-of-japan-to-1334-unit-yamato-court-warriors": "classical-japan",
  "a-history-of-japan-to-1334-unit-ritsuryo-conscript-armies": "classical-japan",
  "a-history-of-japan-to-1334-unit-emishi-forces": "classical-japan",
  "a-history-of-japan-to-1334-unit-sakimori-frontier-guards": "classical-japan",
  "a-history-of-japan-to-1334-location-asuka": "classical-japan",
  "a-history-of-japan-to-1334-location-nara-heijo-kyo": "classical-japan",
  "a-history-of-japan-to-1334-location-dazaifu": "classical-japan",
  "a-history-of-japan-to-1334-event-introduction-of-buddhism-to-the-yamato-court": "classical-japan",
  "a-history-of-japan-to-1334-event-taika-reform": "classical-japan",
  "a-history-of-japan-to-1334-event-jinshin-war": "classical-japan",
  "a-history-of-japan-to-1334-event-promulgation-of-the-taiho-code": "classical-japan",

  // A History of Japan to 1334 — Heian Japan
  "a-history-of-japan-to-1334-character-emperor-kanmu": "heian-japan",
  "a-history-of-japan-to-1334-character-fujiwara-no-michinaga": "heian-japan",
  "a-history-of-japan-to-1334-character-emperor-shirakawa": "heian-japan",
  "a-history-of-japan-to-1334-character-emperor-go-sanjo": "heian-japan",
  "a-history-of-japan-to-1334-character-emperor-go-shirakawa": "heian-japan",
  "a-history-of-japan-to-1334-character-taira-no-kiyomori": "heian-japan",
  "a-history-of-japan-to-1334-character-minamoto-no-yoshitsune": "heian-japan",
  "a-history-of-japan-to-1334-unit-sohei-warrior-monks": "heian-japan",
  "a-history-of-japan-to-1334-unit-taira-clan-forces": "heian-japan",
  "a-history-of-japan-to-1334-unit-minamoto-clan-forces": "heian-japan",
  "a-history-of-japan-to-1334-location-kyoto-heian-kyo": "heian-japan",
  "a-history-of-japan-to-1334-location-mount-hiei-and-enryaku-ji": "heian-japan",
  "a-history-of-japan-to-1334-location-uji": "heian-japan",
  "a-history-of-japan-to-1334-location-ichi-no-tani": "heian-japan",
  "a-history-of-japan-to-1334-location-yashima": "heian-japan",
  "a-history-of-japan-to-1334-location-dan-no-ura": "heian-japan",
  "a-history-of-japan-to-1334-location-hiraizumi": "heian-japan",
  "a-history-of-japan-to-1334-event-transfer-of-the-capital-to-heian-kyo": "heian-japan",
  "a-history-of-japan-to-1334-event-hogen-rebellion": "heian-japan",
  "a-history-of-japan-to-1334-event-heiji-rebellion": "heian-japan",
  "a-history-of-japan-to-1334-event-genpei-war": "heian-japan",

  // A History of Japan to 1334 — Kamakura Japan
  "a-history-of-japan-to-1334-character-minamoto-no-yoritomo": "kamakura-japan",
  "a-history-of-japan-to-1334-character-hojo-masako": "kamakura-japan",
  "a-history-of-japan-to-1334-character-hojo-yasutoki": "kamakura-japan",
  "a-history-of-japan-to-1334-character-hojo-tokimune": "kamakura-japan",
  "a-history-of-japan-to-1334-character-emperor-go-daigo": "kamakura-japan",
  "a-history-of-japan-to-1334-character-ashikaga-takauji": "kamakura-japan",
  "a-history-of-japan-to-1334-unit-kamakura-gokenin": "kamakura-japan",
  "a-history-of-japan-to-1334-unit-hakata-bay-defenders": "kamakura-japan",
  "a-history-of-japan-to-1334-unit-yuan-goryeo-invasion-forces": "kamakura-japan",
  "a-history-of-japan-to-1334-unit-go-daigo-loyalist-forces": "kamakura-japan",
  "a-history-of-japan-to-1334-location-kamakura": "kamakura-japan",
  "a-history-of-japan-to-1334-location-hakata-bay": "kamakura-japan",
  "a-history-of-japan-to-1334-event-establishment-of-the-kamakura-military-government": "kamakura-japan",
  "a-history-of-japan-to-1334-event-jokyu-war": "kamakura-japan",
  "a-history-of-japan-to-1334-event-first-mongol-invasion-of-japan": "kamakura-japan",
  "a-history-of-japan-to-1334-event-second-mongol-invasion-of-japan": "kamakura-japan",
  "a-history-of-japan-to-1334-event-fall-of-the-kamakura-shogunate": "kamakura-japan",
};

async function ensureEras() {
  const existing = await db.select().from(eras);
  const bySlug = new Map(existing.map((era) => [era.slug, era.id]));

  for (const era of NEW_ERAS) {
    if (bySlug.has(era.slug)) continue;
    const [created] = await db
      .insert(eras)
      .values({
        name: era.name,
        slug: era.slug,
        startYear: era.startYear,
        endYear: era.endYear,
        colorPrimary: era.colorPrimary,
        colorSecondary: era.colorSecondary,
        region: era.region ?? null,
        description: era.description ?? null,
      })
      .returning();
    bySlug.set(created.slug, created.id);
    console.log(`Created era: ${created.name} (${created.slug})`);
  }

  return bySlug;
}

async function main() {
  const [stagingEra] = await db.select().from(eras).where(eq(eras.slug, STAGING_ERA_SLUG));
  if (!stagingEra) {
    console.log("No .to-organise era found — nothing to move.");
    return;
  }

  const eraIdBySlug = await ensureEras();
  const refreshedEras = await db.select().from(eras);
  for (const era of refreshedEras) eraIdBySlug.set(era.slug, era.id);

  const stagingCards = await db
    .select({
      id: characters.id,
      seed: characters.seed,
      name: characters.name,
      cardType: characters.cardType,
    })
    .from(characters)
    .where(eq(characters.eraId, stagingEra.id));

  if (stagingCards.length === 0) {
    console.log("No cards in .to-organise.");
    return;
  }

  let moved = 0;
  let balanced = 0;
  const skipped: string[] = [];

  for (const card of stagingCards) {
    const targetSlug = SEED_ERA_SLUG[card.seed];
    if (!targetSlug) {
      skipped.push(`${card.name} (${card.seed}) — no era mapping`);
      continue;
    }

    const targetEraId = eraIdBySlug.get(targetSlug);
    if (targetEraId == null) {
      skipped.push(`${card.name} — missing era "${targetSlug}"`);
      continue;
    }

    await db.update(characters).set({ eraId: targetEraId }).where(eq(characters.id, card.id));
    moved++;

    const eraName = refreshedEras.find((era) => era.id === targetEraId)?.name ?? targetSlug;
    const def = resolveCardBalance({ seed: card.seed, name: card.name, eraName });
    if (def) {
      await applyCardBalance(card.id, card.cardType, def);
      balanced++;
    } else {
      skipped.push(`${card.name} — no balance definition`);
    }

    console.log(`  ${card.name} → ${targetSlug}`);
  }

  const remaining = await db
    .select({ id: characters.id })
    .from(characters)
    .where(eq(characters.eraId, stagingEra.id));

  console.log(`\nMoved ${moved} card(s) out of .to-organise. Applied balance to ${balanced}.`);
  console.log(`${remaining.length} card(s) remain in .to-organise.`);

  if (skipped.length > 0) {
    console.warn("\nIssues:");
    for (const entry of skipped) console.warn(`  - ${entry}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
