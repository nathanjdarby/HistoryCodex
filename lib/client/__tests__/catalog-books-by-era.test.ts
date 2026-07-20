import { describe, expect, it } from "vitest";
import { groupCatalogBooksByEra } from "@/lib/client/catalog-books-by-era";
import type { Era } from "@/lib/types";

const eras = [
  {
    id: 1,
    name: "Tudor England",
    slug: "tudor-england",
    startYear: 1485,
    endYear: 1603,
    colorPrimary: "#000",
    colorSecondary: "#fff",
    region: null,
    description: null,
    createdAt: new Date(),
  },
  {
    id: 2,
    name: "Revolutionary England",
    slug: "revolutionary-england",
    startYear: 1603,
    endYear: 1689,
    colorPrimary: "#000",
    colorSecondary: "#fff",
    region: null,
    description: null,
    createdAt: new Date(),
  },
] satisfies Era[];

describe("groupCatalogBooksByEra", () => {
  it("sorts era groups chronologically and books alphabetically within each era", () => {
    const books = [
      { id: 1, title: "Zulu Book", eraId: 1, eraName: "Tudor England" },
      { id: 2, title: "Alpha Book", eraId: 1, eraName: "Tudor England" },
      { id: 3, title: "Middle Book", eraId: 2, eraName: "Revolutionary England" },
    ];

    const groups = groupCatalogBooksByEra(books, eras);

    expect(groups.map((group) => group.eraName)).toEqual([
      "Tudor England",
      "Revolutionary England",
    ]);
    expect(groups[0].books.map((book) => book.title)).toEqual(["Alpha Book", "Zulu Book"]);
    expect(groups[1].books.map((book) => book.title)).toEqual(["Middle Book"]);
  });

  it("places uncategorized books last", () => {
    const books = [
      { id: 1, title: "Any Era Anthology", eraId: null, eraName: null },
      { id: 2, title: "Alpha Book", eraId: 1, eraName: "Tudor England" },
    ];

    const groups = groupCatalogBooksByEra(books, eras);

    expect(groups.map((group) => group.eraName)).toEqual([
      "Tudor England",
      "Multi-era / uncategorized",
    ]);
  });
});
