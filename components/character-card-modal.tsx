"use client";

import { useEffect, useRef, type ReactNode, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Character, Era } from "@/lib/types";
import { CharacterCardPreview } from "@/components/character-card-preview";
import { CopyCountBadge } from "@/components/character-badges";
import { characterToCardPreviewProps } from "@/lib/character-card-preview-props";

export type CharacterCardView = Character & {
  era: Era;
  owned?: boolean;
  quantity?: number;
  unlockedAt?: string | null;
};

type CharacterCardModalProps = {
  character: CharacterCardView;
  onClose: () => void;
  footer?: ReactNode;
  /** Grey out art and show a lock icon (collection locked cards). */
  locked?: boolean;
  /** Bottom-right owned/locked indicator (collection view). */
  showOwnershipStatus?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  positionLabel?: string;
};

export function CharacterCardModal({
  character,
  onClose,
  footer,
  locked = false,
  showOwnershipStatus = false,
  onPrevious,
  onNext,
  positionLabel,
}: CharacterCardModalProps) {
  const owned = character.owned ?? false;
  const quantity = character.quantity ?? (owned ? 1 : 0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const wheelLock = useRef(false);
  const canNavigate = Boolean(onPrevious || onNext);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && onPrevious) {
        event.preventDefault();
        onPrevious();
      }
      if (event.key === "ArrowRight" && onNext) {
        event.preventDefault();
        onNext();
      }
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onNext, onPrevious]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !canNavigate) return;

    function onWheel(event: WheelEvent) {
      if (wheelLock.current) return;

      const scrollable = (event.target as HTMLElement | null)?.closest("[data-card-modal-scroll]");
      if (scrollable instanceof HTMLElement && scrollable.scrollHeight > scrollable.clientHeight) {
        const atTop = scrollable.scrollTop <= 0;
        const atBottom =
          scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;
        const scrollingUp = event.deltaY < 0;
        const scrollingDown = event.deltaY > 0;
        if ((scrollingUp && !atTop) || (scrollingDown && !atBottom)) return;
      }

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(delta) < 8) return;

      event.preventDefault();
      wheelLock.current = true;
      if (delta > 0) onNext?.();
      else onPrevious?.();
      window.setTimeout(() => {
        wheelLock.current = false;
      }, 250);
    }

    overlay.addEventListener("wheel", onWheel, { passive: false });
    return () => overlay.removeEventListener("wheel", onWheel);
  }, [canNavigate, onNext, onPrevious]);

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStart.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    if (deltaX > 0) onPrevious?.();
    else onNext?.();
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-1.5 sm:p-3">
      {onPrevious && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPrevious();
          }}
          className="fixed left-2 top-1/2 z-[60] hidden -translate-y-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2.5 py-2 text-foreground hover:bg-black/80 hover:text-foreground sm:flex md:px-3"
          aria-label="Previous card"
        >
          <ChevronLeft size={20} />
          <span className="hidden text-sm md:inline">Prev</span>
        </button>
      )}

      {onNext && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onNext();
          }}
          className="fixed right-2 top-1/2 z-[60] hidden -translate-y-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2.5 py-2 text-foreground hover:bg-black/80 hover:text-foreground sm:flex md:px-3"
          aria-label="Next card"
        >
          <span className="hidden text-sm md:inline">Next</span>
          <ChevronRight size={20} />
        </button>
      )}

      {onPrevious && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPrevious();
          }}
          className="fixed left-1.5 top-1/2 z-[60] -translate-y-1/2 rounded-full border border-white/10 bg-black/50 p-2 text-foreground/80 hover:text-foreground sm:hidden"
          aria-label="Previous card"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {onNext && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onNext();
          }}
          className="fixed right-1.5 top-1/2 z-[60] -translate-y-1/2 rounded-full border border-white/10 bg-black/50 p-2 text-foreground/80 hover:text-foreground sm:hidden"
          aria-label="Next card"
        >
          <ChevronRight size={22} />
        </button>
      )}

      <div
        className={`my-auto flex w-full flex-col items-center ${positionLabel ? "pb-10 sm:pb-11" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="card-modal-container relative"
        >
          <CharacterCardPreview
            {...characterToCardPreviewProps(character, {
              locked,
              footer,
              ownership: {
                showStatus: showOwnershipStatus,
                owned,
                quantity,
              },
              flavorFooter:
                owned && quantity > 1 ? (
                  <p className="border-t border-white/10 px-2.5 py-2 text-xs text-amber-200/90 sm:px-3">
                    You own {quantity} copies of this card.
                  </p>
                ) : null,
            })}
          />

          <button
            onClick={onClose}
            className="absolute right-2.5 top-2.5 z-20 rounded-full border border-white/10 bg-black/50 p-1.5 text-muted hover:text-foreground"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {owned && quantity > 1 ? (
            <div className="pointer-events-none absolute right-3 top-3 z-20 hidden sm:block">
              <CopyCountBadge quantity={quantity} className="px-2 py-1 text-xs" />
            </div>
          ) : null}
        </div>
      </div>

      {positionLabel && (
        <div className="pointer-events-none fixed inset-x-0 bottom-3 z-[60] flex flex-col items-center gap-1 sm:bottom-4">
          <p className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] font-medium text-foreground/80">
            {positionLabel}
          </p>
          {canNavigate && (
            <p className="hidden text-[10px] text-muted sm:block">
              Arrow keys or scroll to browse
            </p>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
