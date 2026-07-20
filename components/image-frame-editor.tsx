"use client";

import { useRef } from "react";
import { RotateCcw } from "lucide-react";
import {
  DEFAULT_IMAGE_FRAME,
  type ImageFrame,
  clampImageFrame,
} from "@/lib/image-frame";

export function useImageFrameDrag(
  frame: ImageFrame,
  onChange: (frame: ImageFrame) => void,
  disabled = false,
) {
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startFocusX: number;
    startFocusY: number;
    width: number;
    height: number;
  } | null>(null);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startFocusX: frame.focusX,
      startFocusY: frame.focusY,
      width: rect.width,
      height: rect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    onChange(
      clampImageFrame({
        ...frame,
        focusX: drag.startFocusX - (deltaX / drag.width) * 100,
        focusY: drag.startFocusY - (deltaY / drag.height) * 100,
      }),
    );
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
}

type ImageFrameEditorProps = {
  frame: ImageFrame;
  onChange: (frame: ImageFrame) => void;
  disabled?: boolean;
};

export function ImageFrameEditor({ frame, onChange, disabled = false }: ImageFrameEditorProps) {
  return (
    <div className="mt-3 space-y-3 rounded-md border border-border bg-background/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground/80">Adjust image crop</p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(DEFAULT_IMAGE_FRAME)}
          className="flex items-center gap-1 text-[11px] text-muted hover:text-foreground disabled:opacity-50"
        >
          <RotateCcw size={11} />
          Reset
        </button>
      </div>

      <p className="text-[10px] leading-relaxed text-muted">
        Drag the image in the card preview to reposition it. Use zoom to tighten the crop.
      </p>

      <label className="flex flex-col gap-1.5 text-xs text-muted">
        Zoom · {frame.scale}%
        <input
          type="range"
          min={100}
          max={250}
          step={5}
          disabled={disabled}
          value={frame.scale}
          onChange={(event) =>
            onChange(clampImageFrame({ ...frame, scale: Number(event.target.value) }))
          }
          className="w-full accent-accent"
        />
      </label>

      <div className="grid grid-cols-2 gap-2 text-[10px] text-subtle">
        <span>Focus X · {Math.round(frame.focusX)}%</span>
        <span>Focus Y · {Math.round(frame.focusY)}%</span>
      </div>
    </div>
  );
}
