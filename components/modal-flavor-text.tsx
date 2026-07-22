"use client";

import { useEffect, useRef, useState } from "react";

export function ModalFlavorText({ text, scaled = false }: { text: string | null | undefined; scaled?: boolean }) {
  const trimmed = text?.trim();
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const paragraphRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setExpanded(false);
  }, [trimmed]);

  useEffect(() => {
    if (expanded || !paragraphRef.current) return;

    const element = paragraphRef.current;
    const checkClamp = () => {
      setIsClamped(element.scrollHeight > element.clientHeight + 1);
    };

    checkClamp();
    const observer = new ResizeObserver(checkClamp);
    observer.observe(element);
    return () => observer.disconnect();
  }, [trimmed, expanded]);

  if (!trimmed) return null;

  const canToggle = isClamped || expanded;

  return (
    <div
      data-card-modal-scroll={expanded ? true : undefined}
      className={
        scaled
          ? `card-flavor-scroll ${expanded ? "card-flavor-scroll-expanded" : "card-flavor-scroll-collapsed"}`
          : expanded
            ? "max-h-[11rem] overflow-y-auto px-2.5 py-1.5 sm:max-h-[12rem] sm:px-3 sm:py-2"
            : "max-h-[4.5rem] overflow-y-auto px-2.5 py-1.5 sm:max-h-[5rem] sm:px-3 sm:py-2"
      }
    >
      {/*
        A real <button> here can end up nested inside the card's own outer
        <button> (BattleCard renders play-size cards as one big button), which
        is invalid HTML and triggers a hydration error. Use a div with button
        semantics instead so this works regardless of the ancestor.
      */}
      <div
        role={canToggle ? "button" : undefined}
        tabIndex={canToggle ? 0 : undefined}
        onClick={(event) => {
          event.stopPropagation();
          if (canToggle) setExpanded((value) => !value);
        }}
        onKeyDown={(event) => {
          if (!canToggle) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            setExpanded((value) => !value);
          }
        }}
        aria-expanded={canToggle ? expanded : undefined}
        className={`w-full rounded-md px-1 py-0.5 text-left transition-colors ${
          canToggle ? "cursor-pointer hover:bg-white/5" : "cursor-default"
        }`}
      >
        <p
          ref={paragraphRef}
          className={
            scaled
              ? `card-text-flavor italic leading-snug text-foreground/80 ${expanded ? "" : "line-clamp-2"}`
              : `text-xs italic leading-snug text-foreground/80 sm:text-sm sm:leading-relaxed ${
                  expanded ? "" : "line-clamp-2"
                }`
          }
        >
          &ldquo;{trimmed}&rdquo;
        </p>
        {canToggle && (
          <span
            className={`block not-italic text-muted ${scaled ? "card-text-flavor-toggle" : "mt-1 text-[10px]"}`}
          >
            {expanded ? "Show less" : "Show full quote"}
          </span>
        )}
      </div>
    </div>
  );
}
