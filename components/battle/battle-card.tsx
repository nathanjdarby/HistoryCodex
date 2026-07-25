"use client";

import { Moon } from "lucide-react";
import { CharacterCardPreview } from "@/components/character-card-preview";
import {
  battleCardFaceToPreviewProps,
  type BattleCardFace,
} from "@/components/battle/battle-card-face";

export type BattleCardSize = "xs" | "sm" | "board" | "hand" | "md" | "lg";

/** CSS class for fixed-size play cards (see globals.css `.battle-play-card`). */
export const BATTLE_PLAY_CARD_CLASS = "battle-play-card";

export type BattleCardState =
  | "default"
  | "selected"
  | "playable"
  | "disabled"
  | "attacker"
  | "target"
  | "deploy-zone";

const SIZE_CLASS: Record<BattleCardSize, string> = {
  xs: "w-[3.4rem] min-w-[3.4rem] sm:w-[3.9rem] sm:min-w-[3.9rem]",
  sm: "w-[4.25rem] min-w-[4.25rem] sm:w-[5rem] sm:min-w-[5rem]",
  board: BATTLE_PLAY_CARD_CLASS,
  hand: BATTLE_PLAY_CARD_CLASS,
  md: BATTLE_PLAY_CARD_CLASS,
  lg: "w-[min(90vw,18rem)]",
};

const STATE_RING: Record<BattleCardState, string> = {
  default: "",
  selected: "ring-2 ring-amber-400 ring-offset-2 ring-offset-[#120f0c]",
  playable: "ring-2 ring-emerald-500/70 ring-offset-2 ring-offset-[#120f0c]",
  disabled: "opacity-45 grayscale",
  attacker: "ring-2 ring-sky-400 ring-offset-2 ring-offset-[#120f0c]",
  target: "ring-2 ring-red-400 ring-offset-2 ring-offset-[#120f0c] animate-pulse",
  "deploy-zone": "ring-2 ring-dashed ring-amber-500/80 ring-offset-2 ring-offset-[#120f0c]",
};

const PLAY_SIZES = new Set<BattleCardSize>(["board", "hand", "md"]);

type Props = {
  card: BattleCardFace;
  size?: BattleCardSize;
  state?: BattleCardState;
  showCost?: boolean;
  showCombat?: boolean;
  resting?: boolean;
  onClick?: () => void;
  onInspect?: () => void;
  /** Board/hand cards use a portal preview — disable in-place lift to avoid clip/flicker. */
  liftOnHover?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function BattleCard({
  card,
  size = "sm",
  state = "default",
  showCost = true,
  showCombat = true,
  resting = false,
  onClick,
  onInspect,
  liftOnHover = true,
  className = "",
  style,
}: Props) {
  const isHidden = card.characterId < 0;
  const isDisabled = state === "disabled";
  const interactive = Boolean(onClick) && !isDisabled;
  const Wrapper = interactive ? "button" : "div";
  const isPlaySize = PLAY_SIZES.has(size);
  const hoverMotion =
    interactive && liftOnHover ? "cursor-pointer hover:-translate-y-1 hover:shadow-xl" : interactive ? "cursor-pointer" : "";

  if (isHidden) {
    return null;
  }

  const previewProps = battleCardFaceToPreviewProps(card, { showCost, showCombat });

  if (isPlaySize) {
    return (
      <Wrapper
        type={interactive ? "button" : undefined}
        onClick={onClick}
        onDoubleClick={
          onInspect
            ? (event) => {
                event.preventDefault();
                onInspect();
              }
            : undefined
        }
        disabled={interactive ? isDisabled : undefined}
        className={`${BATTLE_PLAY_CARD_CLASS} relative block text-left transition-transform ${STATE_RING[state]} ${hoverMotion} ${className}`}
        style={style}
      >
        <div className="battle-play-card-inner">
          <CharacterCardPreview
            {...previewProps}
            density="full"
            embedded
            showFlavor={false}
            reserveHeaderActionsSpace={false}
            className="h-full w-full"
          />
        </div>

        {resting ? (
          <div className="absolute right-0.5 top-0.5 z-20 rounded-md bg-sky-950/90 px-1 py-0.5 ring-1 ring-sky-400/50">
            <span className="flex items-center gap-0.5 text-[8px] font-medium text-sky-100">
              <Moon size={9} />
              Rest
            </span>
          </div>
        ) : null}
      </Wrapper>
    );
  }

  return (
    <Wrapper
      type={interactive ? "button" : undefined}
      onClick={onClick}
      onDoubleClick={
        onInspect
          ? (event) => {
              event.preventDefault();
              onInspect();
            }
          : undefined
      }
      disabled={interactive ? isDisabled : undefined}
      className={`relative shrink-0 text-left transition-transform ${SIZE_CLASS[size]} ${STATE_RING[state]} ${hoverMotion} ${className}`}
      style={style}
    >
      <CharacterCardPreview {...previewProps} density="full" className="w-full" />

      {resting ? (
        <div className="absolute right-0.5 top-0.5 z-20 rounded-md bg-sky-950/90 px-1 py-0.5 ring-1 ring-sky-400/50">
          <span className="flex items-center gap-0.5 text-[8px] font-medium text-sky-100">
            <Moon size={9} />
            Rest
          </span>
        </div>
      ) : null}
    </Wrapper>
  );
}
