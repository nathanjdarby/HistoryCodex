import { ImageOff, Pencil, Trash2 } from "lucide-react";
import type { Character, Era } from "@/lib/types";
import { HoloBadge } from "@/components/character-badges";
import {
  CARD_PREVIEW_WIDTH_REM,
  LayoutCharacterCard,
  layoutCharacterCardFromCharacter,
} from "@/components/layout-character-card";

type AdminGalleryCharacter = Character & { era: Era; owned: boolean; unlockedAt?: string | null };

type AdminCardGalleryProps = {
  characters: AdminGalleryCharacter[];
  onPreview: (character: AdminGalleryCharacter) => void;
  onEdit: (character: AdminGalleryCharacter) => void;
  onDelete: (character: AdminGalleryCharacter) => void;
};

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
            <LayoutCharacterCard
              {...layoutCharacterCardFromCharacter(character, {
                displayWidthRem: CARD_PREVIEW_WIDTH_REM,
                innerClassName: "pointer-events-none transition-[filter] duration-200 group-hover:brightness-110",
                ownership: { showStatus: true, owned: character.owned },
              })}
            />
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
