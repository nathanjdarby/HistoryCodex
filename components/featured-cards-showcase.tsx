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
import type { FeaturedCharacter } from "@/lib/server/characters";

const DISPLAY_WIDTH_REM = CARD_PREVIEW_WIDTH_REM - 2.3;

const previewFooter = (
  <p className="text-center text-sm leading-relaxed text-muted">
    <Link href="/login" className="font-medium text-gold hover:underline">
      Sign in
    </Link>{" "}
    to read, earn points, and collect cards like these.
  </p>
);

function toCardView(card: FeaturedCharacter): CharacterCardView {
  return {
    id: card.id,
    eraId: card.era.id,
    name: card.name,
    flavorText: card.flavorText,
    seed: card.seed,
    rarity: card.rarity,
    cardType: card.cardType,
    cost: card.cost,
    archetype: card.archetype,
    imageUrl: card.imageUrl,
    imageFocusX: card.imageFocusX,
    imageFocusY: card.imageFocusY,
    imageScale: card.imageScale,
    holographic: card.holographic,
    attack: card.attack,
    defense: card.defense,
    abilityName: card.abilityName,
    abilityEffect: card.abilityEffect,
    abilityValue: card.abilityValue,
    abilityTrigger: card.abilityTrigger,
    createdAt: new Date(0),
    era: {
      id: card.era.id,
      name: card.era.name,
      slug: "",
      startYear: 0,
      endYear: 0,
      colorPrimary: card.era.colorPrimary,
      colorSecondary: card.era.colorSecondary,
      region: null,
      description: null,
      createdAt: new Date(0),
    },
    owned: true,
    quantity: 1,
    unlockedAt: null,
  };
}

function FeaturedCard({
  card,
  index,
  onSelect,
}: {
  card: FeaturedCharacter;
  index: number;
  onSelect: () => void;
}) {
  const tilt = index % 2 === 0 ? "-rotate-[2deg]" : "rotate-[2deg]";
  const rowOffset = index >= 3 ? "translate-y-1" : "";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Preview ${card.name}`}
      className={`group relative mx-auto cursor-pointer border-0 bg-transparent p-0 pb-5 text-left transition-all duration-300 hover:z-10 hover:-translate-y-2 hover:scale-[1.05] hover:rotate-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${tilt} ${rowOffset}`}
    >
      <LayoutCharacterCard
        {...layoutCharacterCardFromCharacter(card, {
          displayWidthRem: DISPLAY_WIDTH_REM,
          innerClassName: "pointer-events-none transition-[filter] duration-300 group-hover:brightness-110",
        })}
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 text-center text-[10px] font-medium text-subtle opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        Click to preview
      </span>
    </button>
  );
}

export function FeaturedCardsShowcase({ cards }: { cards: FeaturedCharacter[] }) {
  const [viewingId, setViewingId] = useState<number | null>(null);
  const { viewing, onPrevious, onNext, positionLabel } = useCardModalNavigation(
    cards,
    viewingId,
    setViewingId,
  );

  if (cards.length === 0) return null;

  return (
    <>
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-x-3 gap-y-6 px-1 pt-2 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8">
        {cards.map((card, index) => (
          <FeaturedCard
            key={card.id}
            card={card}
            index={index}
            onSelect={() => setViewingId(card.id)}
          />
        ))}
      </div>

      {viewing && (
        <CharacterCardModal
          character={toCardView(viewing)}
          onClose={() => setViewingId(null)}
          onPrevious={onPrevious}
          onNext={onNext}
          positionLabel={positionLabel}
          footer={previewFooter}
        />
      )}
    </>
  );
}
