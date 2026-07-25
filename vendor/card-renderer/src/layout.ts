export const PACKAGE_VERSION = "0.1.0";

export const SUPPORTED_RENDER_KINDS = [
  "stat_badge",
  "chip",
  "text",
  "image",
  "stars",
  "rarity_pill",
  "computed",
] as const;

export type RenderKind = (typeof SUPPORTED_RENDER_KINDS)[number];

export type LayoutElementId =
  | "name"
  | "rarityPill"
  | "stars"
  | "artFrame"
  | "badgePwr"
  | "badgeArchetype"
  | "badgeAtk"
  | "badgeDef"
  | "chipType"
  | "chipAbility"
  | "abilityLabel"
  | "abilityBody"
  | "eraName"
  | "eraDex"
  | "flavorText"
  | "cornerDex";

export const LAYOUT_ELEMENT_IDS: LayoutElementId[] = [
  "name",
  "rarityPill",
  "stars",
  "artFrame",
  "badgePwr",
  "badgeArchetype",
  "badgeAtk",
  "badgeDef",
  "chipType",
  "chipAbility",
  "abilityLabel",
  "abilityBody",
  "eraName",
  "eraDex",
  "flavorText",
  "cornerDex",
];

export const LAYOUT_ELEMENT_LABELS: Record<LayoutElementId, string> = {
  name: "Name",
  rarityPill: "Rarity pill",
  stars: "Stars",
  artFrame: "Art frame",
  badgePwr: "PWR badge",
  badgeArchetype: "Archetype badge",
  badgeAtk: "Attack badge",
  badgeDef: "Defense badge",
  chipType: "Type chip",
  chipAbility: "Ability chip",
  abilityLabel: "Ability label",
  abilityBody: "Ability body",
  eraName: "Era name",
  eraDex: "Era footer dex",
  flavorText: "Flavor text",
  cornerDex: "Corner dex",
};

export interface LayoutBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutElementState extends LayoutBox {
  visible: boolean;
  z: number;
}

/** Legacy v1 layout — fixed keys (still supported via normalizer). */
export type CardLayoutV1 = Record<LayoutElementId, LayoutElementState>;

export interface LayoutElementInstance {
  instance_id: string;
  element_type_id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
  z: number;
  overrides?: Record<string, unknown>;
}

export interface LayoutDocumentV2 {
  schema_version: 2;
  elements: LayoutElementInstance[];
}

export type LayoutDocument = CardLayoutV1 | LayoutDocumentV2;

export const DEFAULT_LAYOUT_V1: CardLayoutV1 = {
  name: { x: 5, y: 3, w: 60, h: 7, visible: true, z: 0 },
  rarityPill: { x: 67, y: 3, w: 28, h: 4, visible: true, z: 1 },
  stars: { x: 67, y: 7.5, w: 22, h: 3, visible: true, z: 2 },
  artFrame: { x: 5, y: 11, w: 90, h: 50, visible: true, z: 3 },
  badgePwr: { x: 78, y: 13, w: 13, h: 9, visible: true, z: 4 },
  badgeArchetype: { x: 78, y: 23, w: 13, h: 9, visible: true, z: 5 },
  badgeAtk: { x: 78, y: 33, w: 13, h: 9, visible: true, z: 6 },
  badgeDef: { x: 78, y: 43, w: 13, h: 9, visible: true, z: 7 },
  chipType: { x: 5, y: 63, w: 22, h: 5, visible: true, z: 8 },
  chipAbility: { x: 29, y: 63, w: 35, h: 5, visible: true, z: 9 },
  abilityLabel: { x: 5, y: 70, w: 18, h: 7, visible: true, z: 10 },
  abilityBody: { x: 23, y: 70, w: 72, h: 7, visible: true, z: 11 },
  eraName: { x: 8, y: 79, w: 55, h: 4, visible: true, z: 12 },
  eraDex: { x: 80, y: 79, w: 15, h: 4, visible: true, z: 13 },
  flavorText: { x: 7, y: 84, w: 86, h: 12, visible: true, z: 14 },
  cornerDex: { x: 80, y: 94, w: 16, h: 4, visible: true, z: 15 },
};

/** @deprecated Use DEFAULT_LAYOUT_V2 — kept for backward compat. */
export const DEFAULT_LAYOUT = DEFAULT_LAYOUT_V1;

export function isLayoutV2(doc: unknown): doc is LayoutDocumentV2 {
  return (
    typeof doc === "object" &&
    doc !== null &&
    (doc as LayoutDocumentV2).schema_version === 2 &&
    Array.isArray((doc as LayoutDocumentV2).elements)
  );
}

export function elementStateV1(layout: CardLayoutV1, id: LayoutElementId): LayoutElementState {
  const raw = layout[id] as Partial<LayoutElementState> | undefined;
  const fallback = DEFAULT_LAYOUT_V1[id];
  return {
    x: raw?.x ?? fallback.x,
    y: raw?.y ?? fallback.y,
    w: raw?.w ?? fallback.w,
    h: raw?.h ?? fallback.h,
    visible: raw?.visible ?? true,
    z: raw?.z ?? LAYOUT_ELEMENT_IDS.indexOf(id),
  };
}

export function migrateV1ToV2(v1: CardLayoutV1): LayoutDocumentV2 {
  return {
    schema_version: 2,
    elements: LAYOUT_ELEMENT_IDS.map((id) => {
      const s = elementStateV1(v1, id);
      return {
        instance_id: id,
        element_type_id: id,
        x: s.x,
        y: s.y,
        w: s.w,
        h: s.h,
        visible: s.visible,
        z: s.z,
      };
    }),
  };
}

export function normalizeLayout(raw: unknown): LayoutDocumentV2 {
  if (isLayoutV2(raw)) {
    return cloneLayoutDocument(raw);
  }
  if (typeof raw === "object" && raw !== null && !isLayoutV2(raw)) {
    return migrateV1ToV2(raw as CardLayoutV1);
  }
  return migrateV1ToV2(DEFAULT_LAYOUT_V1);
}

export function layoutToStorage(doc: LayoutDocumentV2): LayoutDocumentV2 {
  return cloneLayoutDocument(doc);
}

export function cloneLayoutDocument(doc: LayoutDocumentV2): LayoutDocumentV2 {
  return {
    schema_version: 2,
    elements: doc.elements.map((el) => ({
      ...el,
      overrides: el.overrides ? { ...el.overrides } : undefined,
    })),
  };
}

export function cloneLayoutV1(layout: CardLayoutV1): CardLayoutV1 {
  const clone = {} as CardLayoutV1;
  for (const id of LAYOUT_ELEMENT_IDS) {
    clone[id] = { ...elementStateV1(layout, id) };
  }
  return clone;
}

/** @deprecated */
export function cloneLayout(layout: CardLayoutV1): CardLayoutV1 {
  return cloneLayoutV1(layout);
}

/** @deprecated */
export function elementState(layout: CardLayoutV1, id: LayoutElementId): LayoutElementState {
  return elementStateV1(layout, id);
}

export function getInstanceState(doc: LayoutDocumentV2, instanceId: string): LayoutElementInstance | undefined {
  return doc.elements.find((el) => el.instance_id === instanceId);
}

export function updateInstance(
  doc: LayoutDocumentV2,
  instanceId: string,
  patch: Partial<LayoutElementInstance>
): LayoutDocumentV2 {
  return {
    schema_version: 2,
    elements: doc.elements.map((el) => (el.instance_id === instanceId ? { ...el, ...patch } : el)),
  };
}

export function removeInstance(doc: LayoutDocumentV2, instanceId: string): LayoutDocumentV2 {
  return {
    schema_version: 2,
    elements: doc.elements.filter((el) => el.instance_id !== instanceId),
  };
}

export function addInstance(doc: LayoutDocumentV2, instance: LayoutElementInstance): LayoutDocumentV2 {
  return {
    schema_version: 2,
    elements: [...doc.elements, instance],
  };
}

export function defaultBoxForElementType(elementTypeId: string, renderKind: RenderKind, z: number): Omit<LayoutElementInstance, "instance_id" | "element_type_id"> {
  const fromDefault = DEFAULT_LAYOUT_V1[elementTypeId as LayoutElementId];
  if (fromDefault) {
    return { ...fromDefault, visible: true };
  }
  const kindDefaults: Record<RenderKind, Omit<LayoutElementInstance, "instance_id" | "element_type_id">> = {
    stat_badge: { x: 78, y: 13, w: 13, h: 9, visible: true, z },
    chip: { x: 5, y: 63, w: 22, h: 5, visible: true, z },
    text: { x: 5, y: 70, w: 30, h: 7, visible: true, z },
    image: { x: 5, y: 11, w: 90, h: 50, visible: true, z },
    stars: { x: 67, y: 7.5, w: 22, h: 3, visible: true, z },
    rarity_pill: { x: 67, y: 3, w: 28, h: 4, visible: true, z },
    computed: { x: 5, y: 5, w: 20, h: 5, visible: true, z },
  };
  return kindDefaults[renderKind] ?? { x: 5, y: 5, w: 20, h: 5, visible: true, z };
}

export const DEFAULT_LAYOUT_V2: LayoutDocumentV2 = migrateV1ToV2(DEFAULT_LAYOUT_V1);

export function newInstanceId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `el_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
