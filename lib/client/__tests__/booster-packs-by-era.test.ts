import { describe, expect, it } from "vitest";
import {
  groupBoosterPacksByEraAz,
  sortBoosterPacksByEraAz,
} from "@/lib/client/booster-packs-by-era";

describe("booster-packs-by-era", () => {
  const packs = [
    { id: 1, name: "Victorian Britain", eraId: 7, eraName: "Victorian Britain" },
    { id: 2, name: "Anglo Saxon", eraId: 2, eraName: "Anglo-Saxon" },
    { id: 3, name: "Roman Britain", eraId: 1, eraName: "Roman Britain" },
  ];

  it("sorts packs by era name A-Z then pack name A-Z", () => {
    const sorted = sortBoosterPacksByEraAz(packs, (pack) => pack.eraName ?? "Any era");
    expect(sorted.map((pack) => pack.eraName)).toEqual([
      "Anglo-Saxon",
      "Roman Britain",
      "Victorian Britain",
    ]);
  });

  it("groups packs under era headings sorted A-Z", () => {
    const groups = groupBoosterPacksByEraAz(packs, (pack) => pack.eraName ?? "Any era");
    expect(groups.map((group) => group.eraName)).toEqual([
      "Anglo-Saxon",
      "Roman Britain",
      "Victorian Britain",
    ]);
  });
});
