import type { Rarity } from "./types";

export interface RarityToken {
  color: string;
  stars: number;
  glow: string;
  label: string;
}

export const RARITY_TOKENS: Record<Rarity, RarityToken> = {
  common: { color: "#9ca3af", stars: 1, glow: "none", label: "Common" },
  uncommon: { color: "#4ade80", stars: 2, glow: "0 0 14px -3px #4ade8066", label: "Uncommon" },
  rare: { color: "#38bdf8", stars: 3, glow: "0 0 18px -3px #38bdf880", label: "Rare" },
  epic: { color: "#c084fc", stars: 4, glow: "0 0 22px -2px #c084fc99", label: "Epic" },
  legendary: { color: "#facc15", stars: 5, glow: "0 0 28px -2px #facc15b3", label: "Legendary" },
  mythic: { color: "#f43f5e", stars: 6, glow: "0 0 32px -1px #f43f5ecc", label: "Mythic" },
};

export const RARITY_ORDER: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic"];

export function withAlpha(hex: string, alphaHex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  return `#${clean}${alphaHex}`;
}

function nameFontSize(name: string): string {
  const len = name.length;
  if (len <= 28) return "40cqmin";
  if (len <= 42) return "33.67cqmin";
  if (len <= 58) return "29.59cqmin";
  if (len <= 72) return "26.53cqmin";
  return "22.45cqmin";
}

export { nameFontSize };
