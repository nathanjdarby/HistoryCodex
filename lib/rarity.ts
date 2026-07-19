export const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "mythic"] as const;
export type RarityTier = (typeof RARITY_ORDER)[number];

export const RARITY_META: Record<
  RarityTier,
  { color: string; stars: number; glow: string; label: string }
> = {
  common: { color: "#9ca3af", stars: 1, glow: "none", label: "Common" },
  uncommon: { color: "#4ade80", stars: 2, glow: "0 0 14px -3px #4ade8066", label: "Uncommon" },
  rare: { color: "#38bdf8", stars: 3, glow: "0 0 18px -3px #38bdf880", label: "Rare" },
  epic: { color: "#c084fc", stars: 4, glow: "0 0 22px -2px #c084fc99", label: "Epic" },
  legendary: { color: "#facc15", stars: 5, glow: "0 0 28px -2px #facc15b3", label: "Legendary" },
  mythic: { color: "#f43f5e", stars: 6, glow: "0 0 32px -1px #f43f5ecc", label: "Mythic" },
};

export const ARCHETYPE_LABEL: Record<string, string> = {
  warrior: "Warrior",
  scholar: "Scholar",
  monarch: "Monarch",
  merchant: "Merchant",
  sailor: "Sailor",
  leader: "Leader",
};

const POWER_SCALE_MAX = 450;

export function powerPercent(cost: number): number {
  return Math.min(100, Math.round((cost / POWER_SCALE_MAX) * 100));
}

export function dexNumber(id: number): string {
  return `#${String(id).padStart(3, "0")}`;
}
