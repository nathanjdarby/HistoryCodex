import Image from "next/image";
import type { PointerEvent } from "react";
import { PixelSprite } from "@/components/pixel-sprite";
import type { Archetype, Rarity } from "@/lib/sprite/generateSprite";
import { DEFAULT_IMAGE_FRAME, imageFrameStyle, type ImageFrame } from "@/lib/image-frame";

type CharacterArtProps = {
  seed: string;
  imageUrl?: string | null;
  imageFrame?: Partial<ImageFrame> | null;
  era: { colorPrimary: string; colorSecondary: string };
  rarity: Rarity;
  archetype: Archetype | null;
  size?: number;
  className?: string;
  onImagePointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onImagePointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
  onImagePointerUp?: (event: PointerEvent<HTMLDivElement>) => void;
  imageContainerClassName?: string;
};

export function CharacterArt({
  seed,
  imageUrl,
  imageFrame,
  era,
  rarity,
  archetype,
  size = 96,
  className,
  onImagePointerDown,
  onImagePointerMove,
  onImagePointerUp,
  imageContainerClassName,
}: CharacterArtProps) {
  if (imageUrl) {
    const frame = {
      focusX: imageFrame?.focusX ?? DEFAULT_IMAGE_FRAME.focusX,
      focusY: imageFrame?.focusY ?? DEFAULT_IMAGE_FRAME.focusY,
      scale: imageFrame?.scale ?? DEFAULT_IMAGE_FRAME.scale,
    };
    const frameCss = imageFrameStyle(frame);
    const interactive = Boolean(onImagePointerDown);
    // Admin import previews require the browser session cookie; the image optimizer cannot auth.
    const useDirectImageLoad = imageUrl.startsWith("/api/admin/");

    return (
      <div
        className={`relative h-full w-full overflow-hidden rounded ${className ?? ""} ${
          interactive ? "cursor-grab touch-none active:cursor-grabbing" : ""
        } ${imageContainerClassName ?? ""}`}
        onPointerDown={onImagePointerDown}
        onPointerMove={onImagePointerMove}
        onPointerUp={onImagePointerUp}
        onPointerCancel={onImagePointerUp}
      >
        {useDirectImageLoad ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            style={frameCss}
          />
        ) : (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes={`${Math.max(size, 120)}px`}
            draggable={false}
            className="object-cover"
            style={frameCss}
          />
        )}
      </div>
    );
  }

  return (
    <PixelSprite
      seed={seed}
      era={era}
      rarity={rarity}
      archetype={archetype}
      size={size}
      className={className}
    />
  );
}
