export type BoosterPackEraSortable = {
  eraId: number | null;
  eraName?: string | null;
  name: string;
};

export type BoosterPacksEraGroup<T extends BoosterPackEraSortable> = {
  eraId: number | null;
  eraName: string;
  packs: T[];
};

export function groupBoosterPacksByEraAz<T extends BoosterPackEraSortable>(
  packs: T[],
  eraNameForPack: (pack: T) => string,
): BoosterPacksEraGroup<T>[] {
  const grouped = new Map<number | null, T[]>();

  for (const pack of packs) {
    const key = pack.eraId;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(pack);
  }

  const groups: BoosterPacksEraGroup<T>[] = [];

  for (const [eraId, eraPacks] of grouped) {
    eraPacks.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    groups.push({
      eraId,
      eraName: eraNameForPack(eraPacks[0]!),
      packs: eraPacks,
    });
  }

  groups.sort((a, b) => {
    if (a.eraId == null && b.eraId == null) {
      return a.eraName.localeCompare(b.eraName, undefined, { sensitivity: "base" });
    }
    if (a.eraId == null) return 1;
    if (b.eraId == null) return -1;
    return a.eraName.localeCompare(b.eraName, undefined, { sensitivity: "base" });
  });

  return groups;
}

export function sortBoosterPacksByEraAz<T extends BoosterPackEraSortable>(
  packs: T[],
  eraNameForPack: (pack: T) => string,
): T[] {
  return [...packs].sort((a, b) => {
    const eraCompare = eraNameForPack(a).localeCompare(eraNameForPack(b), undefined, {
      sensitivity: "base",
    });
    return eraCompare || a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
