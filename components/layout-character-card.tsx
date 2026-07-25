"use client";

import type { ComponentProps, ReactNode } from "react";
import { CharacterCardPreview } from "@/components/character-card-preview";
import { ScaledCharacterCardShell } from "@/components/scaled-character-card";
import { characterToCardPreviewProps } from "@/lib/character-card-preview-props";
import type { Character, Era } from "@/lib/types";

export type LayoutCharacterCardProps = ComponentProps<typeof CharacterCardPreview> & {
  /** Scale the full layout card to this width. Omit for native full size. */
  displayWidthRem?: number;
  shellClassName?: string;
  innerClassName?: string;
};

type CharacterPreviewSource = Pick<
  Character,
  | "id"
  | "name"
  | "rarity"
  | "cardType"
  | "cost"
  | "attack"
  | "defense"
  | "archetype"
  | "abilityName"
  | "abilityEffect"
  | "abilityValue"
  | "abilityTrigger"
  | "flavorText"
  | "seed"
  | "imageUrl"
  | "imageFocusX"
  | "imageFocusY"
  | "imageScale"
  | "holographic"
  | "layoutId"
> & {
  era: Pick<Era, "name" | "colorPrimary" | "colorSecondary">;
};

export function LayoutCharacterCard({
  displayWidthRem,
  shellClassName = "rounded-2xl shadow-sm",
  innerClassName = "",
  density = "full",
  embedded,
  ...previewProps
}: LayoutCharacterCardProps) {
  const isScaled = displayWidthRem != null;
  const preview = (
    <CharacterCardPreview
      {...previewProps}
      density={density}
      embedded={embedded ?? isScaled}
      className={[isScaled ? "h-full w-full" : "", previewProps.className].filter(Boolean).join(" ")}
    />
  );

  if (displayWidthRem == null) {
    return preview;
  }

  return (
    <ScaledCharacterCardShell
      displayWidthRem={displayWidthRem}
      className={shellClassName}
      innerClassName={innerClassName}
    >
      {preview}
    </ScaledCharacterCardShell>
  );
}

export function layoutCharacterCardFromCharacter(
  character: CharacterPreviewSource,
  options: Partial<LayoutCharacterCardProps> = {},
): LayoutCharacterCardProps {
  const { displayWidthRem, shellClassName, innerClassName, ...previewOptions } = options;
  return {
    displayWidthRem,
    shellClassName,
    innerClassName,
    ...characterToCardPreviewProps(character, previewOptions),
  };
}

export function LayoutCharacterCardFromCharacter({
  character,
  options = {},
  className,
  children,
}: {
  character: CharacterPreviewSource;
  options?: Partial<LayoutCharacterCardProps>;
  className?: string;
  children?: ReactNode;
}) {
  const props = layoutCharacterCardFromCharacter(character, options);
  return (
    <div className={className}>
      <LayoutCharacterCard {...props} />
      {children}
    </div>
  );
}

/** Standard thumbnail width used across collection, admin gallery, packs, etc. */
export const CARD_PREVIEW_WIDTH_REM = 12.5;

/** Tiny preview for admin data-table rows. */
export const CARD_TABLE_THUMB_WIDTH_REM = 2.25;
