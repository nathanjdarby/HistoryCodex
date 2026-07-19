"use client";

import { useMemo } from "react";
import { generateSprite, type Archetype, type Rarity } from "@/lib/sprite/generateSprite";

type PixelSpriteProps = {
  seed: string;
  era: { colorPrimary: string; colorSecondary: string };
  rarity: Rarity;
  archetype: Archetype | null;
  size?: number;
  className?: string;
};

const CELL = 16;
const GRID_SIZE = 16;

export function PixelSprite({
  seed,
  era,
  rarity,
  archetype,
  size = 96,
  className,
}: PixelSpriteProps) {
  // Depend on the era's primitive colors rather than the era object itself,
  // since a new era object reference shouldn't force sprite regeneration.
  const sprite = useMemo(
    () => generateSprite(seed, era, rarity, archetype),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed, era.colorPrimary, era.colorSecondary, rarity, archetype],
  );

  return (
    <svg
      viewBox={`0 0 ${GRID_SIZE * CELL} ${GRID_SIZE * CELL}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
    >
      {sprite.grid.map((row, r) =>
        row.map((value, c) => {
          if (value === 0) return null;
          return (
            <rect
              key={`${r}-${c}`}
              x={c * CELL}
              y={r * CELL}
              width={CELL}
              height={CELL}
              fill={sprite.palette[value]}
              stroke={sprite.outline}
              strokeWidth={0.75}
            />
          );
        }),
      )}
    </svg>
  );
}
