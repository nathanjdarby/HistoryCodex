import { useRef, useState } from "react";
import type { LayoutBox } from "./layout";

type Corner = "tl" | "tr" | "bl" | "br";

interface Props {
  box: LayoutBox;
  editable: boolean;
  selected: boolean;
  label: string;
  onChange: (box: LayoutBox) => void;
  onCommit: (box: LayoutBox) => void;
  onSelect: () => void;
  canvasRef: React.RefObject<HTMLElement | null>;
  minW?: number;
  minH?: number;
  zIndex?: number;
  dimmed?: boolean;
  children: React.ReactNode;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function DraggableBox({
  box,
  editable,
  selected,
  label,
  onChange,
  onCommit,
  onSelect,
  canvasRef,
  minW = 3,
  minH = 2,
  zIndex,
  dimmed,
  children,
}: Props) {
  const [interacting, setInteracting] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; box: LayoutBox; corner?: Corner } | null>(null);
  const lastBox = useRef<LayoutBox>(box);

  function canvasSize(): { width: number; height: number } | null {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width < 20 || rect.height < 20) return null;
    return { width: rect.width, height: rect.height };
  }

  function handleMovePointerDown(e: React.PointerEvent) {
    if (!editable) return;
    e.stopPropagation();
    onSelect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, box: { ...box } };
    lastBox.current = box;
    setInteracting(true);
  }

  function handleMovePointerMove(e: React.PointerEvent) {
    if (!dragState.current || dragState.current.corner) return;
    const size = canvasSize();
    if (!size) return;
    const { width, height } = size;
    const dxPct = ((e.clientX - dragState.current.startX) / width) * 100;
    const dyPct = ((e.clientY - dragState.current.startY) / height) * 100;
    const start = dragState.current.box;
    const x = clamp(start.x + dxPct, 0, 100 - start.w);
    const y = clamp(start.y + dyPct, 0, 100 - start.h);
    lastBox.current = { ...start, x, y };
    onChange(lastBox.current);
  }

  function handleMovePointerUp() {
    const start = dragState.current?.box;
    if (start && (start.x !== lastBox.current.x || start.y !== lastBox.current.y)) {
      onCommit(lastBox.current);
    }
    dragState.current = null;
    setInteracting(false);
  }

  function handleResizePointerDown(corner: Corner) {
    return (e: React.PointerEvent) => {
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragState.current = { startX: e.clientX, startY: e.clientY, box: { ...box }, corner };
      lastBox.current = box;
      setInteracting(true);
    };
  }

  function handleResizePointerMove(e: React.PointerEvent) {
    if (!dragState.current?.corner) return;
    const size = canvasSize();
    if (!size) return;
    const { width, height } = size;
    const dxPct = ((e.clientX - dragState.current.startX) / width) * 100;
    const dyPct = ((e.clientY - dragState.current.startY) / height) * 100;
    const start = dragState.current.box;
    const corner = dragState.current.corner;

    let { x, y, w, h } = start;

    if (corner === "br") {
      w = clamp(start.w + dxPct, minW, 100 - start.x);
      h = clamp(start.h + dyPct, minH, 100 - start.y);
    } else if (corner === "bl") {
      w = clamp(start.w - dxPct, minW, start.x + start.w);
      x = start.x + start.w - w;
      h = clamp(start.h + dyPct, minH, 100 - start.y);
    } else if (corner === "tr") {
      w = clamp(start.w + dxPct, minW, 100 - start.x);
      h = clamp(start.h - dyPct, minH, start.y + start.h);
      y = start.y + start.h - h;
    } else {
      w = clamp(start.w - dxPct, minW, start.x + start.w);
      x = start.x + start.w - w;
      h = clamp(start.h - dyPct, minH, start.y + start.h);
      y = start.y + start.h - h;
    }

    lastBox.current = { x, y, w, h };
    onChange(lastBox.current);
  }

  function handleResizePointerUp() {
    const start = dragState.current?.box;
    if (start) {
      const b = lastBox.current;
      if (start.x !== b.x || start.y !== b.y || start.w !== b.w || start.h !== b.h) {
        onCommit(b);
      }
    }
    dragState.current = null;
    setInteracting(false);
  }

  const style: React.CSSProperties = {
    left: `${box.x}%`,
    top: `${box.y}%`,
    width: `${box.w}%`,
    height: `${box.h}%`,
    zIndex,
  };

  let className = "cd-layout-box-content";
  if (editable) className += " cd-layout-box";
  if (editable && selected) className += " selected";
  if (interacting) className += " interacting";
  if (dimmed) className += " dimmed";

  return (
    <div
      className={className}
      style={style}
      onPointerDown={handleMovePointerDown}
      onPointerMove={handleMovePointerMove}
      onPointerUp={handleMovePointerUp}
    >
      <div className="cd-layout-box-inner">{children}</div>
      {editable && selected && (
        <>
          <span className="cd-layout-box-label">{label}</span>
          {(["tl", "tr", "bl", "br"] as Corner[]).map((corner) => (
            <span
              key={corner}
              className={`cd-resize-handle cd-resize-${corner}`}
              onPointerDown={handleResizePointerDown(corner)}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
            />
          ))}
        </>
      )}
    </div>
  );
}
