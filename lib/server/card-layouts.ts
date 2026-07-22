import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  CARD_TYPE_ENUM,
  cardLayoutAssignments,
  cardLayoutSettings,
  cardLayouts,
} from "@/db/schema";
import {
  DEFAULT_CARD_LAYOUT,
  DEFAULT_CARD_LAYOUT_SETTINGS,
  type CardLayout,
  type CardLayoutBundle,
  type CardLayoutSettings,
  type CardLayoutsByType,
  defaultCardLayoutBundle,
  defaultCardLayoutsByType,
  parseCardLayout,
} from "@/lib/card-layout";
import type { CardType } from "@/lib/battle/types";

const CACHE_TTL_MS = 30_000;

let cachedBundle: CardLayoutBundle | null = null;
let cacheExpiresAt = 0;

async function fetchSettingsFromDb(): Promise<CardLayoutSettings> {
  const [row] = await db
    .select({
      aspectRatioW: cardLayoutSettings.aspectRatioW,
      aspectRatioH: cardLayoutSettings.aspectRatioH,
    })
    .from(cardLayoutSettings)
    .limit(1);

  if (!row || row.aspectRatioW <= 0 || row.aspectRatioH <= 0) {
    return DEFAULT_CARD_LAYOUT_SETTINGS;
  }

  return {
    aspectRatioW: row.aspectRatioW,
    aspectRatioH: row.aspectRatioH,
  };
}

async function fetchLayoutsFromDb(): Promise<CardLayoutsByType> {
  const rows = await db
    .select({
      cardType: cardLayoutAssignments.cardType,
      layout: cardLayouts.layout,
    })
    .from(cardLayoutAssignments)
    .innerJoin(cardLayouts, eq(cardLayoutAssignments.layoutId, cardLayouts.id));

  const layouts = defaultCardLayoutsByType();

  for (const row of rows) {
    const cardType = row.cardType as CardType;
    if (!CARD_TYPE_ENUM.includes(cardType)) continue;
    const parsed = parseCardLayout(row.layout);
    if (parsed) layouts[cardType] = parsed;
  }

  return layouts;
}

async function fetchBundleFromDb(): Promise<CardLayoutBundle> {
  const [layouts, settings] = await Promise.all([fetchLayoutsFromDb(), fetchSettingsFromDb()]);
  return { layouts, settings };
}

export async function getCardLayoutBundle(): Promise<CardLayoutBundle> {
  const now = Date.now();
  if (cachedBundle && now < cacheExpiresAt) {
    return cachedBundle;
  }

  try {
    cachedBundle = await fetchBundleFromDb();
  } catch {
    cachedBundle = defaultCardLayoutBundle();
  }

  cacheExpiresAt = now + CACHE_TTL_MS;
  return cachedBundle;
}

export async function getAllCardLayouts(): Promise<CardLayoutsByType> {
  return (await getCardLayoutBundle()).layouts;
}

export async function getCardLayoutSettings(): Promise<CardLayoutSettings> {
  return (await getCardLayoutBundle()).settings;
}

export async function getCardLayout(cardType: CardType): Promise<CardLayout> {
  const layouts = await getAllCardLayouts();
  return layouts[cardType] ?? DEFAULT_CARD_LAYOUT;
}

export function invalidateCardLayoutCache() {
  cachedBundle = null;
  cacheExpiresAt = 0;
}
