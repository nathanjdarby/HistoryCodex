import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  CARD_TYPE_ENUM,
  cardDataFields,
  cardElementTypes,
  cardLayoutAssignments,
  cardLayoutSettings,
  cardLayouts,
  cardRendererReleases,
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
import {
  PACKAGE_VERSION,
  SUPPORTED_RENDER_KINDS,
  buildRegistryFromRows,
  layoutDocumentToLegacyV1,
  normalizeLayout,
  type LayoutAssignmentsByType,
  type LayoutPresetRef,
  type SerializableRegistry,
} from "@/lib/card-platform-bridge";
import type { CardType } from "@/lib/battle/types";

const CACHE_TTL_MS = 30_000;

export type CardPlatformBundle = CardLayoutBundle & {
  presets: LayoutPresetRef[];
  assignments: LayoutAssignmentsByType;
  registry: SerializableRegistry;
  supportedRenderKinds: string[];
  packageVersion: string;
};

let cachedBundle: CardPlatformBundle | null = null;
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

async function fetchPresetsFromDb(): Promise<LayoutPresetRef[]> {
  const rows = await db
    .select({
      id: cardLayouts.id,
      name: cardLayouts.name,
      layout: cardLayouts.layout,
    })
    .from(cardLayouts)
    .orderBy(cardLayouts.name);

  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    layout: row.layout,
  }));
}

async function fetchAssignmentsFromDb(): Promise<LayoutAssignmentsByType> {
  const rows = await db
    .select({
      cardType: cardLayoutAssignments.cardType,
      layoutId: cardLayoutAssignments.layoutId,
    })
    .from(cardLayoutAssignments);

  const assignments: LayoutAssignmentsByType = {
    character: null,
    unit: null,
    location: null,
    event: null,
  };

  for (const row of rows) {
    const cardType = row.cardType as CardType;
    if (!CARD_TYPE_ENUM.includes(cardType)) continue;
    assignments[cardType] = String(row.layoutId);
  }

  return assignments;
}

async function fetchRegistryFromDb(): Promise<SerializableRegistry> {
  try {
    const [fieldRows, elementRows] = await Promise.all([
      db.select().from(cardDataFields).orderBy(cardDataFields.sortOrder),
      db.select().from(cardElementTypes).orderBy(cardElementTypes.label),
    ]);

    return {
      fields: fieldRows.map((row) => ({
        id: row.id,
        label: row.label,
        column_name: row.columnName,
        data_type: row.dataType,
        enum_options: row.enumOptions,
        applies_to_card_types: row.appliesToCardTypes,
        sort_order: row.sortOrder,
      })),
      elements: elementRows.map((row) => ({
        id: row.id,
        label: row.label,
        render_kind: row.renderKind,
        data_field_id: row.dataFieldId,
        config: row.config,
        visibility_rule: row.visibilityRule,
        applies_to_card_types: row.appliesToCardTypes,
        introduced_in_version: row.introducedInVersion,
        deprecated: row.deprecated,
      })),
    };
  } catch {
    return { fields: [], elements: [] };
  }
}

async function fetchRendererReleaseFromDb(): Promise<string[]> {
  try {
    const [row] = await db
      .select({ kinds: cardRendererReleases.supportedRenderKinds })
      .from(cardRendererReleases)
      .where(eq(cardRendererReleases.app, "main"))
      .limit(1);
    return row?.kinds?.length ? row.kinds : [...SUPPORTED_RENDER_KINDS];
  } catch {
    return [...SUPPORTED_RENDER_KINDS];
  }
}

function legacyLayoutFromPreset(preset: LayoutPresetRef): CardLayout | null {
  const normalized = normalizeLayout(preset.layout);
  if (normalized.schema_version === 2) {
    return layoutDocumentToLegacyV1(normalized);
  }
  return parseCardLayout(preset.layout);
}

async function fetchLayoutsFromDb(
  presets: LayoutPresetRef[],
  assignments: LayoutAssignmentsByType,
): Promise<CardLayoutsByType> {
  const layouts = defaultCardLayoutsByType();
  const presetById = new Map(presets.map((p) => [p.id, p]));

  for (const cardType of CARD_TYPE_ENUM) {
    const assignedId = assignments[cardType];
    const preset = assignedId ? presetById.get(assignedId) : presets.find((p) => p.name === "Default");
    if (!preset) continue;
    const parsed = legacyLayoutFromPreset(preset);
    if (parsed) layouts[cardType] = parsed;
  }

  // Fallback: join path for rows created before presets list was populated
  if (Object.values(layouts).every((l) => l === DEFAULT_CARD_LAYOUT)) {
    const rows = await db
      .select({
        cardType: cardLayoutAssignments.cardType,
        layout: cardLayouts.layout,
      })
      .from(cardLayoutAssignments)
      .innerJoin(cardLayouts, eq(cardLayoutAssignments.layoutId, cardLayouts.id));

    for (const row of rows) {
      const cardType = row.cardType as CardType;
      if (!CARD_TYPE_ENUM.includes(cardType)) continue;
      const parsed = parseCardLayout(row.layout) ?? layoutDocumentToLegacyV1(normalizeLayout(row.layout));
      if (parsed) layouts[cardType] = parsed;
    }
  }

  return layouts;
}

async function fetchBundleFromDb(): Promise<CardPlatformBundle> {
  const [presets, assignments, settings, registry, supportedRenderKinds] = await Promise.all([
    fetchPresetsFromDb(),
    fetchAssignmentsFromDb(),
    fetchSettingsFromDb(),
    fetchRegistryFromDb(),
    fetchRendererReleaseFromDb(),
  ]);

  const layouts = await fetchLayoutsFromDb(presets, assignments);

  return {
    layouts,
    settings,
    presets,
    assignments,
    registry,
    supportedRenderKinds,
    packageVersion: PACKAGE_VERSION,
  };
}

export async function getCardLayoutBundle(): Promise<CardPlatformBundle> {
  const now = Date.now();
  if (cachedBundle && now < cacheExpiresAt) {
    return cachedBundle;
  }

  try {
    cachedBundle = await fetchBundleFromDb();
  } catch {
    cachedBundle = {
      ...defaultCardLayoutBundle(),
      presets: [],
      assignments: { character: null, unit: null, location: null, event: null },
      registry: { fields: [], elements: [] },
      supportedRenderKinds: [...SUPPORTED_RENDER_KINDS],
      packageVersion: PACKAGE_VERSION,
    };
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

export async function getCardPlatformRegistry() {
  const bundle = await getCardLayoutBundle();
  return buildRegistryFromRows(bundle.registry.fields, bundle.registry.elements);
}

export function invalidateCardLayoutCache() {
  cachedBundle = null;
  cacheExpiresAt = 0;
}
