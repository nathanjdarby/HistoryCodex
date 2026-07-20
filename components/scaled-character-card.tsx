import type { ReactNode } from "react";

/** CharacterCardModal / full-density preview layout width — keep scale math in sync. */
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
  const scale = displayWidthRem / MODAL_CARD_WIDTH_REM;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: `${displayWidthRem}rem`, aspectRatio: "5 / 7" }}
    >
      <div
        className={`absolute left-0 top-0 origin-top-left ${innerClassName}`}
        style={{
          width: `${MODAL_CARD_WIDTH_REM}rem`,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
