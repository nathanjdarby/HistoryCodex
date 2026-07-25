import type { Era } from "@/lib/types";

/** Normalized region key used in filters (empty string = all / unset). */
export type EraRegionKey = string;

export function normalizeEraRegion(region: string | null | undefined): EraRegionKey {
  return region ?? "";
}

export function formatEraRegionLabel(region: EraRegionKey): string {
  if (!region) return "Unassigned";
  if (region === "all") return "Global";
  return region;
}

export function getEraRegions(eras: Era[]): EraRegionKey[] {
  const keys = new Set<EraRegionKey>();
  for (const era of eras) {
    keys.add(normalizeEraRegion(era.region));
  }
  return [...keys].sort((a, b) =>
    formatEraRegionLabel(a).localeCompare(formatEraRegionLabel(b), undefined, {
      sensitivity: "base",
    }),
  );
}

export function filterErasByRegion(eras: Era[], region: EraRegionKey): Era[] {
  if (!region) return eras;
  return eras.filter((era) => normalizeEraRegion(era.region) === region);
}

export function sortErasChronologically(eras: Era[]): Era[] {
  return [...eras].sort(
    (a, b) => a.startYear - b.startYear || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

export function getEraOptionValue(era: Era, valueKey: "id" | "slug"): string {
  return valueKey === "slug" ? era.slug : String(era.id);
}

export function findEraByValue(
  eras: Era[],
  value: string,
  valueKey: "id" | "slug",
): Era | undefined {
  if (!value) return undefined;
  return eras.find((era) => getEraOptionValue(era, valueKey) === value);
}

export function regionForEraValue(
  eras: Era[],
  value: string,
  valueKey: "id" | "slug",
): EraRegionKey {
  const era = findEraByValue(eras, value, valueKey);
  return era ? normalizeEraRegion(era.region) : "";
}
