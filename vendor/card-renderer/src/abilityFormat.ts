/** Human-readable ability body text — matches the main History Codex app. */
export function formatAbilityBody(
  effect: string | null,
  value: number | null,
  trigger: string | null
): string | null {
  if (effect === "flat_attack" && value !== null) return `+${value} ATK`;
  if (effect === "flat_defense" && value !== null) return `+${value} DEF`;
  if (effect === "remove_influence" && value !== null) return `-${value} enemy influence`;
  if (effect === "add_influence" && value !== null) return `+${value} influence`;
  if (effect === "heal_unit" && value !== null) return `Heal ${value}`;
  if (effect === "draw_card" && value !== null) return `Draw ${value}`;
  if (effect === "cost_reduction" && value !== null) return `-${value} cost`;

  const parts = [
    effect ? effect.replace(/_/g, " ") : null,
    value !== null ? (value >= 0 ? `+${value}` : String(value)) : null,
    trigger,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : null;
}
