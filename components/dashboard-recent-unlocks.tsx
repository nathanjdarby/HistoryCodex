"use client";

import { useState } from "react";
import Link from "next/link";
import { CharacterCardModal, type CharacterCardView } from "@/components/character-card-modal";
import { useCardModalNavigation } from "@/lib/client/use-card-modal-navigation";
import {
  CARD_PREVIEW_WIDTH_REM,
  LayoutCharacterCard,
  layoutCharacterCardFromCharacter,
} from "@/components/layout-character-card";
import type { Character, Era } from "@/lib/types";

type CharacterWithEra = Character & {
  era: Era;
  owned: boolean;
  quantity?: number;
  unlockedAt: string | null;
};

function UnlockCard({
  character,
  onSelect,
}: {
  character: CharacterWithEra;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Preview ${character.name}`}
      className="group shrink-0 cursor-pointer border-0 bg-transparent p-0 text-left transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      <LayoutCharacterCard
        {...layoutCharacterCardFromCharacter(character, {
          displayWidthRem: CARD_PREVIEW_WIDTH_REM,
          innerClassName: "pointer-events-none transition-[filter] duration-300 group-hover:brightness-110",
          locked: false,
          ownership: {
            showStatus: true,
            owned: true,
            quantity: character.quantity ?? 1,
          },
        })}
      />
    </button>
  );
}

export function DashboardRecentUnlocks({ characters }: { characters: CharacterWithEra[] }) {
  const [viewingId, setViewingId] = useState<number | null>(null);
  const recent = characters.slice(0, 5);

  const { viewing, onPrevious, onNext, positionLabel } = useCardModalNavigation(
    recent,
    viewingId,
    setViewingId,
  );

  if (recent.length === 0) {
    return (
      <p className="text-sm text-muted">
        No characters unlocked yet — earn points by reading, then open{" "}
        <Link href="/packs" className="app-link">
          booster packs
        </Link>
        .
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-center gap-5 sm:justify-start sm:gap-6">
        {recent.map((character) => (
          <UnlockCard key={character.id} character={character} onSelect={() => setViewingId(character.id)} />
        ))}
      </div>

      {viewing && (
        <CharacterCardModal
          character={viewing as CharacterCardView}
          onClose={() => setViewingId(null)}
          onPrevious={onPrevious}
          onNext={onNext}
          positionLabel={positionLabel}
          showOwnershipStatus
          locked={false}
        />
      )}
    </>
  );
}
