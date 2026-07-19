import { ImageOff, Pencil, Trash2 } from "lucide-react";
import type { Character, Era } from "@/lib/types";
import { CharacterArt } from "@/components/character-art";
import { HoloBadge } from "@/components/character-badges";
import { imageFrameFromCharacter } from "@/lib/image-frame";
import { RARITY_META } from "@/lib/rarity";

type AdminGalleryCharacter = Character & { era: Era; owned: boolean };

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
            className="group relative overflow-hidden rounded-xl border-2 text-left"
            style={{
              borderColor: meta.color,
              boxShadow: meta.glow,
              background: `linear-gradient(160deg, ${character.era.colorPrimary}22, ${character.era.colorSecondary}22), #111110`,
            }}
          >
            <button
              type="button"
              onClick={() => onPreview(character)}
              className="block w-full text-left"
              aria-label={`View ${character.name}`}
            >
              <div className="relative aspect-[5/7] w-full overflow-hidden bg-black/30">
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
                  <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] text-neutral-400">
                    <ImageOff size={10} />
                    Sprite
                  </span>
                )}
              </div>
              <div className="space-y-1 p-2">
                <p className="truncate text-xs font-medium text-neutral-100">{character.name}</p>
                <div className="flex items-center justify-between gap-1">
                  <p className="min-w-0 truncate text-[10px] text-neutral-500">{character.era.name}</p>
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
              <div className="flex gap-0.5 rounded-md border border-white/10 bg-black/70 p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(character);
                  }}
                  className="rounded p-1 text-neutral-300 hover:bg-white/10 hover:text-amber-300"
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
                  className="rounded p-1 text-neutral-300 hover:bg-white/10 hover:text-red-400"
                  aria-label={`Delete ${character.name}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {character.owned && (
              <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
                Owned
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
