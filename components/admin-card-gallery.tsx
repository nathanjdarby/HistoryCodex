import { ImageOff, Pencil, Trash2 } from "lucide-react";
import type { Character, Era } from "@/lib/types";
import { CharacterCardPreview } from "@/components/character-card-preview";
import { HoloBadge } from "@/components/character-badges";
import { ScaledCharacterCardShell } from "@/components/scaled-character-card";
import { imageFrameFromCharacter } from "@/lib/image-frame";
import { dexNumber } from "@/lib/rarity";

type AdminGalleryCharacter = Character & { era: Era; owned: boolean; unlockedAt?: string | null };

type AdminCardGalleryProps = {
  characters: AdminGalleryCharacter[];
  onPreview: (character: AdminGalleryCharacter) => void;
  onEdit: (character: AdminGalleryCharacter) => void;
  onDelete: (character: AdminGalleryCharacter) => void;
};

/** Wide enough that the full-density layout (badges, ability panel, quote) stays readable at thumbnail size. */
const DISPLAY_WIDTH_REM = 12.5;

export function AdminCardGallery({
  characters,
  onPreview,
  onEdit,
  onDelete,
}: AdminCardGalleryProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
      {characters.map((character) => (
        <div key={character.id} className="group relative shrink-0">
          <button
            type="button"
            onClick={() => onPreview(character)}
            className="block cursor-pointer border-0 bg-transparent p-0 text-left"
            aria-label={`View ${character.name}`}
          >
            <ScaledCharacterCardShell
              displayWidthRem={DISPLAY_WIDTH_REM}
              className="rounded-2xl shadow-sm"
              innerClassName="pointer-events-none transition-[filter] duration-200 group-hover:brightness-110"
            >
              <CharacterCardPreview
                name={character.name}
                rarity={character.rarity}
                cardType={character.cardType}
                cost={character.cost}
                attack={character.attack}
                defense={character.defense}
                archetype={character.archetype}
                era={character.era}
                abilityName={character.abilityName}
                abilityEffect={character.abilityEffect}
                abilityValue={character.abilityValue}
                abilityTrigger={character.abilityTrigger}
                flavorText={character.flavorText}
                seed={character.seed}
                imageUrl={character.imageUrl}
                imageFrame={imageFrameFromCharacter(character)}
                holographic={character.holographic}
                dexLabel={dexNumber(character.id)}
                density="full"
                ownership={{ showStatus: true, owned: character.owned }}
              />
            </ScaledCharacterCardShell>
          </button>

          {!character.imageUrl && (
            <span className="pointer-events-none absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded border border-border bg-surface/95 px-1.5 py-0.5 text-[9px] text-muted shadow-sm">
              <ImageOff size={10} />
              Sprite
            </span>
          )}

          <div className="absolute right-2 top-2 z-20 flex items-center gap-1">
            {character.holographic && <HoloBadge />}
            <div className="flex gap-0.5 rounded-md border border-border bg-surface/95 p-0.5 opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(character);
                }}
                className="rounded p-1 text-muted hover:bg-surface-hover hover:text-gold-bright"
                aria-label={`Edit ${character.name}`}
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(character);
                }}
                className="rounded p-1 text-muted hover:bg-surface-hover hover:text-red-600 dark:hover:text-red-400"
                aria-label={`Delete ${character.name}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
