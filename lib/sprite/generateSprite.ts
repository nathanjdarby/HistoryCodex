export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type Archetype = "warrior" | "scholar" | "monarch" | "merchant" | "sailor" | "leader";

const LAYER = {
  EMPTY: 0,
  HAIR: 1,
  SKIN: 2,
  CLOTH_PRIMARY: 3,
  CLOTH_SECONDARY: 4,
  ACCESSORY: 5,
} as const;

// Each mask is 16 rows x 8 cols (the left half of a 16x16 sprite).
// It gets mirrored horizontally to produce the full symmetric character.
const SILHOUETTES: Record<"standing" | "robed" | "armored", number[][]> = {
  standing: [
    [0, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 2, 2, 2],
    [0, 0, 0, 1, 2, 2, 2, 2],
    [0, 0, 0, 0, 2, 2, 2, 2],
    [0, 0, 0, 0, 0, 2, 2, 2],
    [0, 0, 3, 3, 3, 3, 3, 3],
    [0, 3, 3, 3, 3, 3, 3, 4],
    [0, 3, 3, 3, 3, 3, 3, 4],
    [0, 0, 3, 3, 3, 3, 3, 4],
    [0, 3, 3, 3, 3, 3, 3, 4],
    [0, 0, 3, 3, 3, 3, 4, 4],
    [0, 0, 0, 0, 4, 4, 4, 0],
    [0, 0, 0, 0, 4, 4, 4, 0],
    [0, 0, 0, 0, 4, 4, 0, 0],
    [0, 0, 0, 0, 4, 4, 0, 0],
  ],
  robed: [
    [0, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 2, 2, 2],
    [0, 0, 0, 1, 2, 2, 2, 2],
    [0, 0, 0, 0, 2, 2, 2, 2],
    [0, 0, 0, 0, 0, 2, 2, 2],
    [0, 0, 3, 3, 3, 3, 3, 3],
    [0, 3, 3, 3, 3, 3, 3, 4],
    [0, 3, 3, 3, 3, 3, 3, 4],
    [0, 0, 3, 3, 3, 3, 3, 4],
    [0, 4, 4, 4, 4, 4, 4, 4],
    [0, 4, 4, 4, 4, 4, 4, 4],
    [0, 4, 4, 4, 4, 4, 4, 4],
    [4, 4, 4, 4, 4, 4, 4, 4],
    [4, 4, 4, 4, 4, 4, 4, 4],
    [4, 4, 4, 4, 4, 4, 4, 4],
  ],
  armored: [
    [0, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 2, 2, 2],
    [0, 0, 0, 1, 2, 2, 2, 2],
    [0, 0, 4, 4, 2, 2, 2, 2],
    [0, 4, 4, 4, 4, 2, 2, 2],
    [4, 4, 3, 3, 3, 3, 3, 4],
    [0, 4, 3, 3, 3, 3, 3, 4],
    [0, 3, 3, 3, 3, 3, 3, 4],
    [0, 0, 3, 3, 3, 3, 3, 4],
    [0, 3, 3, 3, 3, 3, 3, 4],
    [0, 0, 4, 3, 3, 3, 4, 4],
    [0, 0, 0, 4, 4, 4, 4, 0],
    [0, 0, 0, 4, 4, 4, 4, 0],
    [0, 0, 0, 0, 4, 4, 0, 0],
    [0, 0, 0, 0, 4, 4, 0, 0],
  ],
};

const SILHOUETTE_KEYS = Object.keys(SILHOUETTES) as (keyof typeof SILHOUETTES)[];
const ARCHETYPES: Archetype[] = ["warrior", "scholar", "monarch", "merchant", "sailor", "leader"];

// Extra accessory cells layered on top of the base silhouette, per archetype.
const ARCHETYPE_ACCENTS: Record<Archetype, [number, number][]> = {
  warrior: [
    [8, 0],
    [9, 0],
  ],
  scholar: [
    [9, 1],
    [10, 1],
  ],
  monarch: [[0, 6]],
  merchant: [[11, 1]],
  sailor: [
    [7, 0],
    [8, 1],
  ],
  leader: [
    [0, 5],
    [1, 5],
  ],
};

const SKIN_TONES = ["#f2c9a1", "#d9a066", "#a9702f", "#7a4a2b", "#4a2f21"];
const HAIR_COLORS = ["#2b2118", "#5c3a21", "#8a5a2b", "#c9a13b", "#1a1a1a", "#7a7a7a"];
const RARITY_ACCENT: Record<Rarity, string> = {
  common: "#8b8f98",
  uncommon: "#4b8b3b",
  rare: "#3b82c4",
  epic: "#a855f7",
  legendary: "#eab308",
  mythic: "#e11d48",
};

function hashSeed(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 33) ^ seed.charCodeAt(i);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  let state = a;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => Math.round(v * (1 - amount));
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(f(r))}${toHex(f(g))}${toHex(f(b))}`;
}

export type SpritePalette = Record<number, string>;

export type Sprite = {
  grid: number[][];
  palette: SpritePalette;
  outline: string;
};

export function generateSprite(
  seed: string,
  era: { colorPrimary: string; colorSecondary: string },
  rarity: Rarity,
  archetype: Archetype | null,
): Sprite {
  const rand = mulberry32(hashSeed(seed));

  const silhouetteKey = SILHOUETTE_KEYS[Math.floor(rand() * SILHOUETTE_KEYS.length)];
  const halfMask = SILHOUETTES[silhouetteKey].map((row) => [...row]);

  const chosenArchetype = archetype ?? ARCHETYPES[Math.floor(rand() * ARCHETYPES.length)];
  for (const [r, c] of ARCHETYPE_ACCENTS[chosenArchetype]) {
    if (halfMask[r]) halfMask[r][c] = LAYER.ACCESSORY;
  }

  const skin = SKIN_TONES[Math.floor(rand() * SKIN_TONES.length)];
  const hair = HAIR_COLORS[Math.floor(rand() * HAIR_COLORS.length)];

  const palette: SpritePalette = {
    [LAYER.HAIR]: hair,
    [LAYER.SKIN]: skin,
    [LAYER.CLOTH_PRIMARY]: era.colorPrimary,
    [LAYER.CLOTH_SECONDARY]: era.colorSecondary,
    [LAYER.ACCESSORY]: RARITY_ACCENT[rarity],
  };

  const grid = halfMask.map((row) => [...row, ...[...row].reverse()]);
  const outline = darken(era.colorPrimary, 0.55);

  return { grid, palette, outline };
}
