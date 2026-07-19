import type { CSSProperties } from "react";

export type ImageFrame = {
  focusX: number;
  focusY: number;
  scale: number;
};

export const DEFAULT_IMAGE_FRAME: ImageFrame = {
  focusX: 50,
  focusY: 50,
  scale: 100,
};

export function clampImageFrame(frame: Partial<ImageFrame>): ImageFrame {
  return {
    focusX: Math.round(clamp(frame.focusX ?? DEFAULT_IMAGE_FRAME.focusX, 0, 100)),
    focusY: Math.round(clamp(frame.focusY ?? DEFAULT_IMAGE_FRAME.focusY, 0, 100)),
    scale: Math.round(clamp(frame.scale ?? DEFAULT_IMAGE_FRAME.scale, 100, 250)),
  };
}

export function imageFrameFromCharacter(character: {
  imageFocusX?: number | null;
  imageFocusY?: number | null;
  imageScale?: number | null;
}): ImageFrame {
  return clampImageFrame({
    focusX: character.imageFocusX ?? undefined,
    focusY: character.imageFocusY ?? undefined,
    scale: character.imageScale ?? undefined,
  });
}

export function imageFrameStyle(frame: ImageFrame): CSSProperties {
  const zoom = frame.scale / 100;
  return {
    objectPosition: `${frame.focusX}% ${frame.focusY}%`,
    ...(zoom !== 1
      ? {
          transform: `scale(${zoom})`,
          transformOrigin: `${frame.focusX}% ${frame.focusY}%`,
        }
      : {}),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
