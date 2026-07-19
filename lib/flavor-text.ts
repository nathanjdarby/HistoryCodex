export const FLAVOR_TEXT_MAX_LENGTH = 120;

export function normalizeFlavorText(text: string | null | undefined): string | null {
  if (text == null) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.length <= FLAVOR_TEXT_MAX_LENGTH) return trimmed;

  const budget = FLAVOR_TEXT_MAX_LENGTH - 1;
  const slice = trimmed.slice(0, budget);
  const lastSpace = slice.lastIndexOf(" ");
  const cutoff = lastSpace >= Math.floor(budget * 0.55) ? lastSpace : budget;

  return `${trimmed.slice(0, cutoff).trimEnd()}…`;
}
