import type { ReactNode } from "react";

/** CharacterCardModal / full-density preview layout width — reference for admin tooling. */
export const MODAL_CARD_WIDTH_REM = 34;

export function ScaledCharacterCardShell({
  displayWidthRem,
  children,
  className = "",
  innerClassName = "",
}: {
  displayWidthRem: number;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: `${displayWidthRem}rem`,
        aspectRatio: "var(--card-aspect-ratio-w, 5) / var(--card-aspect-ratio-h, 7)",
      }}
    >
      <div className={`h-full w-full ${innerClassName}`}>{children}</div>
    </div>
  );
}
