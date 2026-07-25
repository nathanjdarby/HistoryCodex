import { useRef, useState, cloneElement, isValidElement, type CSSProperties, type ReactNode, type RefObject } from "react";
import {
  Star,
  Sword,
  Swords,
  Shield,
  MapPin,
  Flag,
  Zap,
  BookOpen,
  Crown,
  Coins,
  Anchor,
  Lock,
  User,
} from "lucide-react";
import type { Archetype, CardDesignData, CardType } from "./types";
import { formatAbilityBody } from "./abilityFormat";
import { RARITY_TOKENS, nameFontSize, withAlpha } from "./rarity";
import { DraggableBox } from "./DraggableBox";
import {
  DEFAULT_LAYOUT_V2,
  normalizeLayout,
  type LayoutBox,
  type LayoutDocumentV2,
  type LayoutElementInstance,
} from "./layout";
import { BUILTIN_REGISTRY } from "./builtinRegistry";
import { configInlineStyle, mergeInlineStyles } from "./inlineStyles";
import {
  buildRegistry,
  evaluateVisibilityRule,
  elementAppliesToCard,
  getCardFieldValue,
  isRenderKindSupported,
  type ElementRegistry,
  type ElementType,
  type ElementTypeConfig,
  type RegistryRow,
} from "./registry";
import "./card.css";

const ARCHETYPE_ICONS: Record<NonNullable<Archetype>, typeof Sword> = {
  warrior: Sword,
  scholar: BookOpen,
  monarch: Crown,
  merchant: Coins,
  sailor: Anchor,
  leader: Flag,
};

const CHIP_CONFIG: Record<CardType, { icon: typeof MapPin; label: string; className: string }> = {
  location: { icon: MapPin, label: "Location", className: "cd-chip-location" },
  unit: { icon: Flag, label: "Unit", className: "cd-chip-unit" },
  character: { icon: User, label: "Character", className: "cd-chip-character" },
  event: { icon: Swords, label: "Event", className: "cd-chip-event" },
};

const ICON_MAP: Record<string, typeof Swords> = {
  swords: Swords,
  shield: Shield,
  sword: Sword,
};

export interface ArtFrameRenderContext {
  card: CardDesignData;
  imageUrl: string | null;
  dragging: boolean;
  frameRef: RefObject<HTMLDivElement | null>;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

interface Props {
  card: CardDesignData;
  interactive?: boolean;
  onFrameChange?: (frame: CardDesignData["imageFrame"]) => void;
  cardRef?: React.Ref<HTMLDivElement>;
  layout?: unknown;
  aspectRatio?: { w: number; h: number };
  layoutMode?: boolean;
  productionPreview?: boolean;
  /** When true, skip outer shell chrome — parent supplies border/glow/aspect ratio. */
  layoutOnly?: boolean;
  className?: string;
  shellStyle?: CSSProperties;
  selectedInstanceId?: string | null;
  registry?: ElementRegistry;
  supportedRenderKinds?: readonly string[] | null;
  onUnsupportedRenderKind?: (renderKind: string, elementTypeId: string) => void;
  resolveImageUrl?: (path: string | null | undefined) => string | null;
  renderArtFrame?: (context: ArtFrameRenderContext) => ReactNode;
  renderSlot?: (elementTypeId: string, content: ReactNode) => ReactNode;
  shouldShowElement?: (elementTypeId: string, defaultVisible: boolean) => boolean;
  footer?: ReactNode;
  onLayoutChange?: (instanceId: string, box: LayoutBox) => void;
  onLayoutCommit?: (instanceId: string, box: LayoutBox) => void;
  onSelectInstance?: (instanceId: string | null) => void;
  /** @deprecated Use selectedInstanceId */
  selectedElement?: string | null;
  /** @deprecated Use onSelectInstance */
  onSelectElement?: (id: string | null) => void;
}

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

function defaultResolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return path;
}

function applyContentStyle(node: ReactNode, style?: CSSProperties): ReactNode {
  if (!style) return node;
  if (isValidElement(node)) {
    const prev = (node.props as { style?: CSSProperties }).style;
    return cloneElement(node, { style: mergeInlineStyles(prev, style) } as never);
  }
  return <span style={style}>{node}</span>;
}

export function CardRenderer({
  card,
  interactive,
  onFrameChange,
  cardRef,
  layout,
  aspectRatio = { w: 5, h: 7 },
  layoutMode = false,
  productionPreview = false,
  layoutOnly = false,
  className = "",
  shellStyle: shellStyleOverride,
  selectedInstanceId = null,
  registry = BUILTIN_REGISTRY,
  supportedRenderKinds = null,
  onUnsupportedRenderKind,
  resolveImageUrl = defaultResolveImageUrl,
  renderArtFrame,
  renderSlot,
  shouldShowElement,
  footer,
  onLayoutChange,
  onLayoutCommit,
  onSelectInstance,
  selectedElement,
  onSelectElement,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const effectiveLayoutMode = layoutMode && !productionPreview;
  const selectedId = selectedInstanceId ?? selectedElement ?? null;
  const selectInstance = onSelectInstance ?? onSelectElement;
  const layoutDoc: LayoutDocumentV2 = layout ? normalizeLayout(layout) : DEFAULT_LAYOUT_V2;

  const token = RARITY_TOKENS[card.rarity];
  const imageUrl = resolveImageUrl(card.imageUrl);
  const ArchetypeIcon = card.archetype ? ARCHETYPE_ICONS[card.archetype] : Crown;
  const chip = CHIP_CONFIG[card.cardType];
  const ChipIcon = chip.icon;

  function updateFrameFromPointer(e: React.PointerEvent) {
    if (!frameRef.current || !onFrameChange) return;
    const rect = frameRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    onFrameChange({ ...card.imageFrame, focusX: Math.round(x), focusY: Math.round(y) });
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (!interactive || !imageUrl || effectiveLayoutMode || renderArtFrame) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    updateFrameFromPointer(e);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    updateFrameFromPointer(e);
  }

  function handlePointerUp() {
    setDragging(false);
  }

  const shellStyle: React.CSSProperties = layoutOnly
    ? { ...(shellStyleOverride ?? {}) }
    : {
        border: `2px solid ${token.color}`,
        boxShadow: token.glow === "none" ? undefined : token.glow,
        backgroundImage: `linear-gradient(160deg, ${withAlpha(card.era.colorPrimary || "#3f3f46", "2a")}, ${withAlpha(
          card.era.colorSecondary || "#3f3f46",
          "2a"
        )})`,
        aspectRatio: `${aspectRatio.w} / ${aspectRatio.h}`,
        ...(shellStyleOverride ?? {}),
      };

  function renderElementContent(elementType: ElementType, config: ElementTypeConfig): React.ReactNode {
    switch (elementType.renderKind) {
      case "stat_badge":
        return renderStatBadge(elementType, config);
      case "chip":
        return renderChip(elementType, config);
      case "text":
        return renderText(elementType, config);
      case "image":
        return renderImage();
      case "stars":
        return renderStars();
      case "rarity_pill":
        return renderRarityPill();
      default:
        return null;
    }
  }

  function renderStatBadge(elementType: ElementType, config: ElementTypeConfig): React.ReactNode {
    const raw = getCardFieldValue(card, elementType.dataFieldId, registry);
    const border = withAlpha(token.color, "aa");
    const slotStyle = configInlineStyle(config.slotStyle);
    const badgeStyle = mergeInlineStyles({ borderColor: border }, configInlineStyle(config.badgeStyle));

    if (config.icon === "archetype") {
      return (
        <div className="cd-badge-slot" style={slotStyle}>
          <div className="cd-stat-badge" style={badgeStyle} title={card.archetype ?? undefined}>
            <ArchetypeIcon className="cd-badge-icon-lg" color={token.color} />
          </div>
        </div>
      );
    }

    const Icon = config.icon ? ICON_MAP[String(config.icon)] : null;
    const label = String(config.label || elementType.label);
    const value = raw ?? (effectiveLayoutMode ? 0 : "");

    if (config.iconWithValue && Icon) {
      return (
        <div className="cd-badge-slot" style={slotStyle}>
          <div className="cd-stat-badge" style={badgeStyle}>
            <div className="cd-stat-badge-icon">
              <Icon className="cd-badge-icon" color={token.color} />
              <span className="cd-stat-badge-value">{String(value)}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="cd-badge-slot" style={slotStyle}>
        <div className="cd-stat-badge" style={badgeStyle}>
          <span className="cd-stat-badge-label">{label}</span>
          <span className="cd-stat-badge-value">{String(value)}</span>
        </div>
      </div>
    );
  }

  function renderChip(_elementType: ElementType, config: ElementTypeConfig): React.ReactNode {
    const slotStyle = configInlineStyle(config.slotStyle);
    const chipStyle = configInlineStyle(config.chipStyle);

    if (config.variant === "ability") {
      return (
        <div className="cd-chip-slot" style={slotStyle}>
          <div className="cd-chip cd-chip-ability" style={chipStyle}>
            <Zap className="cd-chip-icon" />
            {card.abilityName || (effectiveLayoutMode ? "Ability name" : "")}
          </div>
        </div>
      );
    }
    return (
      <div className="cd-chip-slot" style={slotStyle}>
        <div className={`cd-chip ${chip.className}`} style={chipStyle}>
          <ChipIcon className="cd-chip-icon" />
          {chip.label}
        </div>
      </div>
    );
  }

  function renderText(elementType: ElementType, config: ElementTypeConfig): React.ReactNode {
    const formatter = config.formatter;
    let content: React.ReactNode = "";

    switch (formatter) {
      case "name":
        content = (
          <p className={String(config.textClass || "cd-el-name")} style={{ color: token.color, fontSize: nameFontSize(card.name || "") }}>
            {card.name || "Untitled"}
          </p>
        );
        break;
      case "ability_label":
        content = <p className={String(config.textClass || "cd-ability-label")}>{card.cardType === "location" ? "Buff" : "Ability"}</p>;
        break;
      case "ability_body": {
        const body =
          formatAbilityBody(card.abilityEffect, card.abilityValue, card.abilityTrigger) ||
          (effectiveLayoutMode ? "Ability text" : "");
        content = <p className={String(config.textClass || "cd-ability-body")}>{body}</p>;
        break;
      }
      case "era_name":
        content = <span className={String(config.textClass || "cd-era-name-text")}>{card.era.name || "Unassigned Era"}</span>;
        break;
      case "dex":
        content = <span className={String(config.textClass || "cd-era-dex-text")}>{card.dexLabel}</span>;
        break;
      case "flavor": {
        const text = card.flavorText || (effectiveLayoutMode ? "Flavor text" : "");
        content = (
          <div className={String(config.textClass || "cd-flavor-text")}>
            {config.quote ? `\u201C${text}\u201D` : text}
          </div>
        );
        break;
      }
      default: {
        const raw = getCardFieldValue(card, elementType.dataFieldId, registry);
        content = <span className={String(config.textClass || "")}>{String(raw ?? "")}</span>;
      }
    }

    const textStyle = configInlineStyle(config.textStyle);
    content = applyContentStyle(content, textStyle);

    const slotClass = String(config.slotClass || "");
    const wrapClass = config.wrapClass ? String(config.wrapClass) : null;
    const slotStyle = configInlineStyle(config.slotStyle);
    const wrapStyle = configInlineStyle(config.wrapStyle);

    if (wrapClass) {
      return (
        <div className={slotClass} style={slotStyle}>
          <div className={wrapClass} style={wrapStyle}>
            {content}
          </div>
        </div>
      );
    }
    return (
      <div className={slotClass} style={slotStyle}>
        {content}
      </div>
    );
  }

  function renderImage(): React.ReactNode {
    if (renderArtFrame) {
      return renderArtFrame({
        card,
        imageUrl,
        dragging,
        frameRef,
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
      });
    }

    return (
      <div
        className={dragging ? "cd-art-frame dragging" : "cd-art-frame"}
        ref={frameRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {imageUrl ? (
          <img
            className="cd-art-image"
            src={imageUrl}
            alt=""
            style={{
              objectPosition: `${card.imageFrame.focusX}% ${card.imageFrame.focusY}%`,
              transform: `scale(${card.imageFrame.scale / 100})`,
              opacity: card.locked ? 0.4 : 1,
              filter: card.locked ? "grayscale(100%)" : undefined,
            }}
          />
        ) : (
          <div className="cd-art-empty">No image</div>
        )}
        {card.locked && (
          <div className="cd-locked-overlay">
            <Lock className="cd-lock-icon" color="#e7e5e4" />
          </div>
        )}
        {card.holographic && <div className="cd-holo-overlay" />}
      </div>
    );
  }

  function renderStars(): React.ReactNode {
    return (
      <div className="cd-stars-slot">
        <span className="cd-stars">
          {Array.from({ length: Math.max(5, token.stars) }).map((_, i) => (
            <Star
              key={i}
              className="cd-star-icon"
              fill={i < token.stars ? token.color : "none"}
              stroke={i < token.stars ? token.color : "#525252"}
            />
          ))}
        </span>
      </div>
    );
  }

  function renderRarityPill(): React.ReactNode {
    return (
      <div className="cd-rarity-pill-slot">
        <span
          className="cd-rarity-pill"
          style={{ color: token.color, borderColor: withAlpha(token.color, "aa"), background: withAlpha(token.color, "22") }}
        >
          {token.label}
        </span>
      </div>
    );
  }

  function renderInstance(instance: LayoutElementInstance) {
    const elementType = registry.elementsById.get(instance.element_type_id);
    if (!elementType || elementType.deprecated) return null;
    if (!elementAppliesToCard(elementType, card.cardType)) return null;

    if (!isRenderKindSupported(elementType.renderKind, supportedRenderKinds)) {
      onUnsupportedRenderKind?.(elementType.renderKind, elementType.id);
      return null;
    }

    const selected = selectedId === instance.instance_id;
    const dataVisible = evaluateVisibilityRule(elementType.visibilityRule, card, effectiveLayoutMode);
    let effectiveVisible = instance.visible && dataVisible;
    if (shouldShowElement) {
      effectiveVisible = shouldShowElement(elementType.id, effectiveVisible);
    }
    const forceShowForSelection = effectiveLayoutMode && selected && !effectiveVisible;
    if (!effectiveVisible && !forceShowForSelection) return null;

    const mergedConfig = { ...elementType.config, ...(instance.overrides || {}) };
    const box: LayoutBox = { x: instance.x, y: instance.y, w: instance.w, h: instance.h };

    return (
      <DraggableBox
        key={instance.instance_id}
        box={box}
        editable={effectiveLayoutMode}
        selected={selected}
        label={elementType.label}
        onChange={(next) => onLayoutChange?.(instance.instance_id, next)}
        onCommit={(next) => onLayoutCommit?.(instance.instance_id, next)}
        onSelect={() => selectInstance?.(instance.instance_id)}
        canvasRef={shellRef}
        zIndex={selected ? 1000 : instance.z}
        dimmed={forceShowForSelection}
      >
        {renderSlot
          ? renderSlot(elementType.id, renderElementContent(elementType, mergedConfig))
          : renderElementContent(elementType, mergedConfig)}
      </DraggableBox>
    );
  }

  const sorted = [...layoutDoc.elements].sort((a, b) => a.z - b.z);
  const shellClassName = layoutOnly
    ? `relative h-full w-full ${className}`.trim()
    : `cd-card-shell ${className}`.trim();

  return (
    <div
      className={shellClassName}
      style={shellStyle}
      ref={mergeRefs(shellRef, cardRef)}
      onPointerDown={() => effectiveLayoutMode && selectInstance?.(null)}
    >
      {sorted.map((instance) => renderInstance(instance))}
      {footer ? (
        <div className="absolute inset-x-0 bottom-0 z-20 rounded-xl border border-white/10 bg-black/40 p-[2cqw]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/** Backward-compatible alias. */
export const CardPreview = CardRenderer;

export function registryFromRows(fieldRows: RegistryRow[], elementRows: RegistryRow[]): ElementRegistry {
  return buildRegistry(fieldRows, elementRows);
}

export type { ElementRegistry, RegistryRow };
