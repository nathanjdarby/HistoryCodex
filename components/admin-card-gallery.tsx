import { ImageOff, Pencil, Trash2 } from "lucide-react";
import type { Character, Era } from "@/lib/types";
import { CharacterArt } from "@/components/character-art";
import { HoloBadge } from "@/components/character-badges";
import { imageFrameFromCharacter } from "@/lib/image-frame";
import { RARITY_META } from "@/lib/rarity";

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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {characters.map((character) => {
        const meta = RARITY_META[character.rarity];
        return (
          <div
            key={character.id}
            className="group relative overflow-hidden rounded-xl border-2 bg-surface text-left shadow-sm"
            style={{
              borderColor: meta.color,
              boxShadow: meta.glow,
              background: `linear-gradient(160deg, ${character.era.colorPrimary}18, ${character.era.colorSecondary}18), var(--surface)`,
            }}
          >
            <button
              type="button"
              onClick={() => onPreview(character)}
              className="block w-full text-left"
              aria-label={`View ${character.name}`}
            >
              <div className="relative aspect-[5/7] w-full overflow-hidden bg-surface-raised">
                <CharacterArt
                  seed={character.seed}
                  imageUrl={character.imageUrl}
                  imageFrame={imageFrameFromCharacter(character)}
                  era={character.era}
                  rarity={character.rarity}
                  archetype={character.archetype}
                  size={240}
                />
                {!character.imageUrl && (
                  <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded border border-border bg-surface/95 px-1.5 py-0.5 text-[9px] text-muted shadow-sm">
                    <ImageOff size={10} />
                    Sprite
                  </span>
                )}
              </div>
              <div className="space-y-1 border-t border-border/70 bg-surface/90 p-2">
                <p className="truncate text-xs font-medium text-foreground">{character.name}</p>
                <div className="flex items-center justify-between gap-1">
                  <p className="min-w-0 truncate text-[10px] text-muted">{character.era.name}</p>
                  <span
                    className="shrink-0 rounded px-1 py-0.5 text-[9px] font-medium uppercase"
                    style={{ color: meta.color, background: `${meta.color}22` }}
                  >
                    {meta.label}
                  </span>
                </div>
              </div>
            </button>

            <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
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

            {character.owned && (
              <span className="absolute left-1.5 top-1.5 rounded border border-emerald-600/25 bg-surface/95 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 shadow-sm dark:text-emerald-400">
                Owned
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
