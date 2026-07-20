import type { ReactNode } from "react";
import type { BoosterPackEraSortable, BoosterPacksEraGroup } from "@/lib/client/booster-packs-by-era";

type BoosterPacksEraSectionsProps<T extends BoosterPackEraSortable> = {
  groups: BoosterPacksEraGroup<T>[];
  getPackKey: (pack: T) => string | number;
  renderPack: (pack: T) => ReactNode;
  gridClassName?: string;
  emptyMessage?: ReactNode;
};

export function BoosterPacksEraSections<T extends BoosterPackEraSortable>({
  groups,
  getPackKey,
  renderPack,
  gridClassName = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  emptyMessage,
}: BoosterPacksEraSectionsProps<T>) {
  if (groups.length === 0) {
    return emptyMessage ? <>{emptyMessage}</> : null;
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.eraId ?? "any-era"} className="space-y-3">
          <div className="border-b border-border pb-2">
            <h2 className="text-base font-semibold text-foreground">{group.eraName}</h2>
          </div>
          <div className={gridClassName}>
            {group.packs.map((pack) => (
              <div key={getPackKey(pack)}>{renderPack(pack)}</div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
