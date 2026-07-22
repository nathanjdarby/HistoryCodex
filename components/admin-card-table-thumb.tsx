"use client";

import { LayoutCharacterCard, layoutCharacterCardFromCharacter } from "@/components/layout-character-card";
import type { Character, Era } from "@/lib/types";

type CharacterWithEra = Character & { era: Era };

type AdminCardTableThumbProps = {
  character: CharacterWithEra;
  owned?: boolean;
  className?: string;
};

/** Small layout-system card used in admin list/table rows. */
export function AdminCardTableThumb({ character, owned = false, className = "" }: AdminCardTableThumbProps) {
  return (
    <div className={`relative h-9 w-9 overflow-hidden rounded border border-border bg-surface-raised ${className}`}>
      <LayoutCharacterCard
        {...layoutCharacterCardFromCharacter(character, {
          displayWidthRem: 2.25,
          shellClassName: "rounded-none shadow-none",
          innerClassName: "pointer-events-none",
          locked: !owned,
          showFlavor: false,
          ownership: owned ? { showStatus: false, owned: true } : undefined,
        })}
      />
    </div>
  );
}
