import type { Era } from "@/lib/types";

export type CatalogBookEraSortable = {
  eraId: number | null;
  eraName: string | null;
  title: string;
};

export type CatalogBooksEraGroup<T extends CatalogBookEraSortable> = {
  eraId: number | null;
  eraName: string;
  startYear: number | null;
  endYear: number | null;
  books: T[];
};

export function groupCatalogBooksByEra<T extends CatalogBookEraSortable>(
  books: T[],
  eras: Era[],
): CatalogBooksEraGroup<T>[] {
  const eraById = new Map(eras.map((era) => [era.id, era]));
  const grouped = new Map<number | null, T[]>();

  for (const book of books) {
    const key = book.eraId;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(book);
  }

  const groups: CatalogBooksEraGroup<T>[] = [];

  for (const [eraId, eraBooks] of grouped) {
    eraBooks.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));

    const era = eraId != null ? eraById.get(eraId) : null;
    groups.push({
      eraId,
      eraName: era?.name ?? eraBooks[0]?.eraName ?? "Multi-era / uncategorized",
      startYear: era?.startYear ?? null,
      endYear: era?.endYear ?? null,
      books: eraBooks,
    });
  }

  groups.sort((a, b) => {
    if (a.startYear == null && b.startYear == null) {
      return a.eraName.localeCompare(b.eraName, undefined, { sensitivity: "base" });
    }
    if (a.startYear == null) return 1;
    if (b.startYear == null) return -1;
    return (
      a.startYear - b.startYear ||
      a.eraName.localeCompare(b.eraName, undefined, { sensitivity: "base" })
    );
  });

  return groups;
}
