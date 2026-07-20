import type { Character, Era } from "@/lib/types";

export type AdminCardSearchable = Character & { era: Era };

/** Match admin catalog cards against a free-text query (name, seed, era, stats, abilities, etc.). */
export function matchesAdminCardSearch(card: AdminCardSearchable, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;

  const haystack = [
    card.name,
    card.seed,
    card.era.name,
    card.era.slug,
    card.rarity,
    card.archetype,
    card.cardType,
    card.abilityName,
    card.abilityEffect,
    card.abilityTrigger,
    card.flavorText,
    String(card.id),
    String(card.cost),
    String(card.attack),
    String(card.defense),
    card.abilityValue != null ? String(card.abilityValue) : null,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return trimmed.split(/\s+/).every((token) => haystack.includes(token));
}

export function adminCardResultLabel(filtered: number, total: number): string {
  if (total === 0) return "0 total";
  if (filtered === total) return `${total} total`;
  return `${filtered} of ${total}`;
}
