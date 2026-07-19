"use client";

import Image from "next/image";
import { Gift, Sparkles } from "lucide-react";
import type { Character, Era } from "@/lib/types";
import { CharacterArt } from "@/components/character-art";
import { HolographicOverlay } from "@/components/holographic-overlay";
import { FlavorText } from "@/components/character-badges";
import { imageFrameFromCharacter } from "@/lib/image-frame";
import { RARITY_META } from "@/lib/rarity";

export type PulledPackCharacter = Character & { era: Era; quantity: number };

export type PackRevealPhase = "opening" | "revealing" | "complete";

export const PACK_REVEAL_CARDS_PER_ROW = 5;

function chunkCards<T>(items: T[], perRow: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += perRow) {
    rows.push(items.slice(i, i + perRow));
  }
  return rows;
}

type PackOpeningOverlayProps = {
  packName: string;
  packImageUrl: string | null;
  characters: PulledPackCharacter[];
  phase: PackRevealPhase;
  revealedCount: number;
  onClose: () => void;
};

function PackRevealArtwork({
  name,
  imageUrl,
  animate,
}: {
  name: string;
  imageUrl: string | null;
  animate: boolean;
}) {
  const baseClass = `relative aspect-[4/7] w-[8.5rem] overflow-hidden rounded-xl border-2 shadow-2xl sm:w-[10rem] ${
    animate
      ? "animate-pack-shake border-amber-400 shadow-[0_0_48px_-4px_rgba(245,158,11,0.85)]"
      : "border-amber-700/50"
  }`;

  if (imageUrl) {
    return (
      <div className={`${baseClass} bg-neutral-950`}>
        <Image src={imageUrl} alt={name} fill sizes="160px" className="object-cover" />
        {animate && <div className="absolute inset-0 animate-pack-flash bg-amber-300/20" />}
      </div>
    );
  }

  return (
    <div
      className={`${baseClass} flex items-center justify-center bg-gradient-to-br from-amber-900/60 via-amber-950/40 to-neutral-950`}
    >
      <Gift size={36} className={animate ? "animate-pulse text-amber-200" : "text-amber-400"} />
      {animate && <div className="absolute inset-0 animate-pack-flash bg-amber-300/20" />}
    </div>
  );
}

function CardBack() {
  return (
    <div className="relative flex aspect-[5/7] w-full flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-amber-800/50 bg-gradient-to-br from-amber-950 via-neutral-950 to-neutral-900 shadow-inner sm:rounded-xl">
      <div className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(245,158,11,0.08)_8px,rgba(245,158,11,0.08)_16px)]" />
      <Sparkles size={22} className="relative text-amber-500/40 sm:h-7 sm:w-7" />
    </div>
  );
}

function RevealedCard({ character }: { character: PulledPackCharacter }) {
  const meta = RARITY_META[character.rarity];
  const isDuplicate = character.quantity > 1;

  return (
    <div
      className="pack-card-reveal relative flex w-full flex-col overflow-hidden rounded-lg border-2 p-1.5 text-left sm:rounded-xl sm:p-2"
      style={{
        borderColor: meta.color,
        boxShadow: meta.glow,
        background: `linear-gradient(160deg, ${character.era.colorPrimary}22, ${character.era.colorSecondary}22), #111110`,
      }}
    >
      {isDuplicate && (
        <span className="absolute right-1 top-1 z-[2] rounded-full border border-amber-500/40 bg-amber-950/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-200 sm:right-1.5 sm:top-1.5 sm:text-[10px]">
          ×{character.quantity}
        </span>
      )}
      {character.holographic && <HolographicOverlay />}
      <div className="relative z-[1] flex flex-col">
        <div className="relative flex aspect-[5/7] w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
          <CharacterArt
            seed={character.seed}
            imageUrl={character.imageUrl}
            imageFrame={imageFrameFromCharacter(character)}
            era={character.era}
            rarity={character.rarity}
            archetype={character.archetype}
            size={72}
          />
        </div>
        <p className="mt-1 line-clamp-2 text-[10px] font-semibold text-neutral-100 sm:mt-1.5 sm:text-xs">
          {character.name}
        </p>
        <span
          className="mt-0.5 w-fit rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase sm:text-[9px]"
          style={{ color: meta.color, background: `${meta.color}22` }}
        >
          {character.rarity}
        </span>
        <FlavorText text={character.flavorText} lines={2} className="mt-0.5 hidden lg:block" />
      </div>
    </div>
  );
}

export function PackOpeningOverlay({
  packName,
  packImageUrl,
  characters,
  phase,
  revealedCount,
  onClose,
}: PackOpeningOverlayProps) {
  const isOpening = phase === "opening";
  const isComplete = phase === "complete";
  const cardRows = chunkCards(characters, PACK_REVEAL_CARDS_PER_ROW);

  return (
    <div className="fixed inset-0 z-[130] flex flex-col bg-neutral-950/95 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_50%_30%,rgba(245,158,11,0.12),transparent_55%)]" />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-8">
        {isOpening ? (
          <div className="flex flex-col items-center gap-5 text-center">
            <PackRevealArtwork name={packName} imageUrl={packImageUrl} animate />
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-400/90">
                Opening
              </p>
              <p className="text-lg font-semibold text-amber-100">{packName}</p>
            </div>
          </div>
        ) : (
          <div className="flex w-full max-w-5xl flex-col items-center gap-4 sm:gap-5">
            <p className="text-center text-sm font-medium text-neutral-300">
              {isComplete ? (
                <>
                  You pulled {characters.length} card{characters.length === 1 ? "" : "s"}!
                </>
              ) : (
                <>Revealing your cards…</>
              )}
            </p>

            <div className="flex w-full flex-col items-center gap-2 sm:gap-3">
              {cardRows.map((row, rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className="grid w-full max-w-4xl grid-cols-5 gap-1.5 sm:gap-2.5"
                >
                  {row.map((character, colIndex) => {
                    const index = rowIndex * PACK_REVEAL_CARDS_PER_ROW + colIndex;
                    return index < revealedCount ? (
                      <RevealedCard key={`${character.id}-${index}`} character={character} />
                    ) : (
                      <CardBack key={`back-${index}`} />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isComplete && (
        <div className="relative border-t border-neutral-800 bg-neutral-950/80 px-4 py-4">
          <div className="mx-auto flex max-w-6xl justify-center">
            <button
              type="button"
              onClick={onClose}
              className="min-w-[8rem] rounded-md bg-amber-700 px-6 py-2.5 text-sm font-medium text-amber-50 transition-colors hover:bg-amber-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
