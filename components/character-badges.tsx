import type { CSSProperties } from "react";
import { Anchor, BookOpen, CheckCircle2, Coins, Crown, Flag, Lock, MapPin, Shield, Sparkles, Star, Sword, Swords, User, Zap } from "lucide-react";
import {
  cardAbilityPanelLabel,
  describeCardAbility,
  hasCardAbility,
  type CardAbilityInput,
} from "@/lib/battle";
import type { CardType } from "@/lib/battle/types";
import { ARCHETYPE_LABEL, RARITY_META, powerPercent, type RarityTier } from "@/lib/rarity";
import { adaptiveCardNameClass } from "@/lib/card-layout";

export const ARCHETYPE_OPTIONS = ["warrior", "scholar", "monarch", "merchant", "sailor", "leader"] as const;

const ARCHETYPE_ICON: Record<(typeof ARCHETYPE_OPTIONS)[number], typeof Sword> = {
  warrior: Sword,
  scholar: BookOpen,
  monarch: Crown,
  merchant: Coins,
  sailor: Anchor,
  leader: Flag,
};

export function StarRating({
  rarity,
  size = 10,
  scaled = false,
}: {
  rarity: RarityTier;
  size?: number;
  scaled?: boolean;
}) {
  const { stars, color } = RARITY_META[rarity];
  const slotCount = Math.max(5, stars);
  const iconClass = scaled ? "card-icon-star shrink-0" : undefined;
  return (
    <span className={`flex shrink-0 items-center ${scaled ? "card-stars-row" : "gap-0.5"}`}>
      {Array.from({ length: slotCount }, (_, i) => (
        <Star
          key={i}
          size={scaled ? undefined : size}
          className={iconClass}
          fill={i < stars ? color : "transparent"}
          stroke={i < stars ? color : "#525252"}
        />
      ))}
    </span>
  );
}

const CARD_HEADER_CLASS = {
  compact: {
    dex: "text-[10px] text-muted",
    name: "text-xs font-semibold text-foreground",
    star: 10,
    gap: "gap-1.5",
  },
  default: {
    dex: "text-xs text-muted",
    name: "text-sm font-semibold text-foreground",
    star: 11,
    gap: "gap-2",
  },
  prominent: {
    dex: "text-sm text-foreground/80",
    name: "text-lg font-semibold text-amber-100",
    star: 15,
    gap: "gap-2.5",
  },
} as const;

type CardHeaderVariant = keyof typeof CARD_HEADER_CLASS;

const ADAPTIVE_NAME_SIZES: Record<
  CardHeaderVariant,
  readonly { max: number; className: string }[]
> = {
  prominent: [
    { max: 28, className: "text-lg sm:text-xl" },
    { max: 42, className: "text-base sm:text-lg" },
    { max: 58, className: "text-sm sm:text-base" },
    { max: 72, className: "text-xs sm:text-sm" },
    { max: Infinity, className: "text-[10px] sm:text-xs" },
  ],
  default: [
    { max: 28, className: "text-sm" },
    { max: 42, className: "text-xs" },
    { max: 58, className: "text-[11px]" },
    { max: Infinity, className: "text-[10px]" },
  ],
  compact: [
    { max: 28, className: "text-xs sm:text-[11px]" },
    { max: 42, className: "text-[10px] sm:text-[11px]" },
    { max: 58, className: "text-[9px] sm:text-[10px]" },
    { max: Infinity, className: "text-[8px] sm:text-[9px]" },
  ],
};

const TEXT_SIZE_CLASS = /^(?:sm:|md:|lg:)?text-(?:\[[^\]]+\]|xs|sm|base|lg|xl|\d+xl)$/;

function withoutTextSizeClasses(className: string): string {
  return className
    .split(/\s+/)
    .filter((token) => token && !TEXT_SIZE_CLASS.test(token))
    .join(" ");
}

function adaptiveNameSize(name: string, variant: CardHeaderVariant): string {
  const length = name.trim().length;
  const tiers = ADAPTIVE_NAME_SIZES[variant];
  return tiers.find((tier) => length <= tier.max)?.className ?? tiers[tiers.length - 1].className;
}

export function CharacterCardHeader({
  name,
  rarity,
  variant = "compact",
  starSize,
  nameClassName,
  nameStyle,
  nameClampClass,
  rarityLabel,
  rarityColor,
}: {
  name: string;
  rarity: RarityTier;
  variant?: CardHeaderVariant;
  starSize?: number;
  nameClassName?: string;
  nameStyle?: CSSProperties;
  /** Overrides the variant's default line-clamp — e.g. force a single line on small scaled-down cards so a long name can't shrink the art area. */
  nameClampClass?: string;
  rarityLabel?: string;
  rarityColor?: string;
}) {
  const styles = CARD_HEADER_CLASS[variant];
  const baseNameClass = nameClassName ?? styles.name;
  const nameClasses = `${withoutTextSizeClasses(baseNameClass)} ${adaptiveNameSize(name, variant)}`;
  const clampClass = nameClampClass ?? (variant === "prominent" ? "" : "line-clamp-3");

  return (
    <div className={`flex shrink-0 items-center ${styles.gap} px-0.5`}>
      <p
        className={`min-w-0 flex-1 text-left leading-tight break-words ${clampClass} ${nameClasses}`}
        style={nameStyle}
      >
        {name}
      </p>
      <div className="ml-1 flex shrink-0 items-center gap-1.5 sm:gap-2">
        {rarityLabel && rarityColor ? (
          <RarityPill label={rarityLabel} color={rarityColor} size="compact" />
        ) : null}
        <StarRating rarity={rarity} size={starSize ?? styles.star} />
      </div>
    </div>
  );
}

export function CopyCountBadge({
  quantity,
  className = "",
  scaled = false,
}: {
  quantity: number;
  className?: string;
  scaled?: boolean;
}) {
  if (quantity <= 1) return null;

  return (
    <span
      className={
        scaled
          ? `card-copy-badge ${className}`
          : `inline-flex min-w-[1.5rem] items-center justify-center rounded-full border border-border bg-surface/95 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gold backdrop-blur-sm ${className}`
      }
      title={`${quantity} copies owned`}
    >
      ×{quantity}
    </span>
  );
}

export function CharacterCardCorner({
  dexLabel,
  variant = "compact",
  showOwnershipStatus = false,
  owned = false,
  className = "",
}: {
  dexLabel: string;
  variant?: CardHeaderVariant;
  showOwnershipStatus?: boolean;
  owned?: boolean;
  className?: string;
}) {
  const dexClass = CARD_HEADER_CLASS[variant].dex;
  return (
    <div className={`absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1.5 ${className}`}>
      {showOwnershipStatus && (
        <div
          className="rounded-full border border-border bg-surface/95 p-1.5 shadow-sm backdrop-blur-sm"
          aria-label={owned ? "Unlocked" : "Locked"}
          title={owned ? "Unlocked" : "Locked"}
        >
          {owned ? (
            <CheckCircle2 size={variant === "prominent" ? 20 : 16} className="text-emerald-700 dark:text-emerald-400" />
          ) : (
            <Lock size={variant === "prominent" ? 18 : 14} className="text-muted" />
          )}
        </div>
      )}
      <span className={`font-mono leading-none ${dexClass}`}>{dexLabel}</span>
    </div>
  );
}

const CARD_PILL_CLASS = {
  compact: "inline-flex min-h-[22px] items-center gap-1 rounded px-1.5 py-1 text-[9px] font-medium leading-none",
  default:
    "inline-flex min-h-[26px] items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold leading-none",
} as const;

const CARD_PILL_ICON = {
  compact: 10,
  default: 12,
} as const;

type CardPillSize = keyof typeof CARD_PILL_CLASS;

export function RarityPill({
  label,
  color,
  size = "default",
  scaled = false,
}: {
  label: string;
  color: string;
  size?: CardPillSize;
  scaled?: boolean;
}) {
  return (
    <span
      className={
        scaled
          ? "card-pill card-text-pill uppercase"
          : `${CARD_PILL_CLASS[size]} border uppercase`
      }
      style={{
        color,
        backgroundColor: `${color}22`,
        borderColor: `${color}aa`,
        boxShadow: `inset 0 0 12px ${color}18`,
      }}
    >
      {label}
    </span>
  );
}

export function CharacterCardPowerBadge({
  cost,
  color,
  className = "",
  scaled = false,
}: {
  cost: number;
  color: string;
  className?: string;
  scaled?: boolean;
}) {
  return (
    <div
      className={
        scaled
          ? `card-stat-badge ${className}`
          : `flex h-11 w-11 flex-col items-center justify-center rounded-full border bg-black/80 font-mono leading-none backdrop-blur-sm ${className}`
      }
      style={{
        borderColor: `${color}aa`,
        boxShadow: `0 0 14px ${color}40`,
      }}
    >
      <span className={scaled ? "card-text-badge-label uppercase tracking-wide text-muted" : "text-[8px] uppercase tracking-wide text-muted"}>
        PWR
      </span>
      <span className={scaled ? "card-text-badge-value font-semibold text-foreground" : "text-xs font-semibold text-foreground"}>
        {cost}
      </span>
    </div>
  );
}

export function CharacterCardArchetypeBadge({
  archetype,
  color,
  className = "",
  scaled = false,
}: {
  archetype: string | null;
  color: string;
  className?: string;
  scaled?: boolean;
}) {
  if (!archetype) return null;
  const label = ARCHETYPE_LABEL[archetype];
  const Icon = ARCHETYPE_ICON[archetype as (typeof ARCHETYPE_OPTIONS)[number]];

  return (
    <div
      className={
        scaled
          ? `group/archetype relative flex items-center justify-center card-stat-badge ${className}`
          : `group/archetype relative flex h-11 w-11 items-center justify-center rounded-full border bg-black/80 leading-none backdrop-blur-sm ${className}`
      }
      style={{
        borderColor: `${color}aa`,
        boxShadow: `0 0 14px ${color}40`,
      }}
      title={label}
      aria-label={label}
    >
      <Icon className={scaled ? "card-icon-archetype text-foreground" : undefined} size={scaled ? undefined : 18} />
      {!scaled ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute right-full top-1/2 z-20 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/90 px-2 py-1 text-[10px] font-medium text-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover/archetype:opacity-100"
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function CharacterCardCombatStatBadge({
  icon: Icon,
  value,
  label,
  color,
  className = "",
  scaled = false,
}: {
  icon: typeof Swords;
  value: number;
  label: string;
  color: string;
  className?: string;
  scaled?: boolean;
}) {
  return (
    <div
      className={
        scaled
          ? `card-stat-badge card-stat-badge-icon ${className}`
          : `flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-full border bg-black/80 font-mono leading-none backdrop-blur-sm ${className}`
      }
      style={{
        borderColor: `${color}aa`,
        boxShadow: `0 0 14px ${color}40`,
      }}
      title={`${label} ${value}`}
      aria-label={`${label} ${value}`}
    >
      <Icon
        className={scaled ? "card-icon-combat" : undefined}
        size={scaled ? undefined : 14}
        style={{ color }}
      />
      <span className={scaled ? "card-text-badge-value font-semibold text-foreground" : "text-xs font-semibold text-foreground"}>
        {value}
      </span>
    </div>
  );
}

export function CharacterCardAttackBadge({
  attack,
  color,
  className = "",
  scaled = false,
}: {
  attack: number;
  color: string;
  className?: string;
  scaled?: boolean;
}) {
  return (
    <CharacterCardCombatStatBadge
      icon={Swords}
      value={attack}
      label="Attack"
      color={color}
      className={className}
      scaled={scaled}
    />
  );
}

export function CharacterCardDefenseBadge({
  defense,
  color,
  className = "",
  scaled = false,
}: {
  defense: number;
  color: string;
  className?: string;
  scaled?: boolean;
}) {
  return (
    <CharacterCardCombatStatBadge
      icon={Shield}
      value={defense}
      label="Defense"
      color={color}
      className={className}
      scaled={scaled}
    />
  );
}

export function CharacterCardPowerGauge({
  cost,
  color,
  compact = false,
  className = "",
}: {
  cost: number;
  color: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 flex-col justify-center rounded-md border border-border bg-surface/95 px-1.5 py-1 ${
        compact ? "w-16" : "w-24"
      } ${className}`}
    >
      <div
        className={`flex items-center justify-between font-mono uppercase ${
          compact ? "text-[9px]" : "text-[10px]"
        }`}
      >
        <span className="text-muted">PWR</span>
        <span className="font-semibold text-foreground">{cost}</span>
      </div>
      <div
        className={`mt-0.5 w-full overflow-hidden rounded-full bg-surface-raised ring-1 ring-border/80 ${
          compact ? "h-2" : "h-2.5"
        }`}
      >
        <div
          className="h-full"
          style={{ width: `${powerPercent(cost)}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function ArchetypeBadge({
  archetype,
  size = "default",
  className = "",
}: {
  archetype: string | null;
  size?: CardPillSize;
  className?: string;
}) {
  if (!archetype) return null;
  const Icon = ARCHETYPE_ICON[archetype as (typeof ARCHETYPE_OPTIONS)[number]];
  return (
    <span className={`${CARD_PILL_CLASS[size]} bg-surface-raised/80 text-foreground/80 ${className}`}>
      <Icon size={CARD_PILL_ICON[size]} />
      {ARCHETYPE_LABEL[archetype]}
    </span>
  );
}

export function AbilityChip({
  name,
  size = "default",
  scaled = false,
}: {
  name: string | null;
  size?: CardPillSize;
  scaled?: boolean;
}) {
  if (!name) return null;
  return (
    <span
      className={
        scaled
          ? "card-pill-chip card-text-chip bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
          : `${CARD_PILL_CLASS[size]} bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300`
      }
    >
      <Zap className={scaled ? "card-icon-chip" : undefined} size={scaled ? undefined : CARD_PILL_ICON[size]} />
      {name}
    </span>
  );
}

export function CharacterCardName({
  name,
  variant = "prominent",
  nameClassName,
  nameStyle,
  nameClampClass,
  scaled = false,
}: {
  name: string;
  variant?: CardHeaderVariant;
  nameClassName?: string;
  nameStyle?: CSSProperties;
  nameClampClass?: string;
  scaled?: boolean;
}) {
  const styles = CARD_HEADER_CLASS[variant];
  const baseNameClass = nameClassName ?? styles.name;
  const nameClasses = scaled
    ? `${withoutTextSizeClasses(baseNameClass)} ${adaptiveCardNameClass(name)}`
    : `${withoutTextSizeClasses(baseNameClass)} ${adaptiveNameSize(name, variant)}`;
  const clampClass = nameClampClass ?? (variant === "prominent" ? "" : "line-clamp-3");

  return (
    <p
      className={`h-full min-w-0 text-left font-bold leading-tight tracking-tight break-words ${clampClass} ${nameClasses}`}
      style={nameStyle}
    >
      {name}
    </p>
  );
}

export function AbilityPanelLabel({
  cardType,
  className = "",
  scaled = false,
}: {
  cardType: CardType;
  className?: string;
  scaled?: boolean;
}) {
  return (
    <p
      className={
        scaled
          ? `card-panel card-panel-label card-text-panel-label text-foreground ${className}`
          : `flex h-full items-center justify-center border border-white/10 bg-black/30 px-1 py-1 text-center font-semibold uppercase tracking-wide text-foreground text-[10px] sm:text-[11px] ${className}`
      }
    >
      {cardAbilityPanelLabel(cardType)}
    </p>
  );
}

export function AbilityPanelBody({
  cardType,
  abilityName,
  abilityEffect,
  abilityValue,
  abilityTrigger,
  eraName = "",
  emptyText,
  className = "",
  scaled = false,
}: CardAbilityInput & {
  emptyText?: string;
  className?: string;
  scaled?: boolean;
}) {
  const description = describeCardAbility({
    cardType,
    abilityName,
    abilityEffect,
    abilityValue,
    abilityTrigger,
    eraName,
  });
  const showEmpty = emptyText && !hasCardAbility({ abilityName, abilityEffect, abilityTrigger });

  if (!description && !showEmpty) return null;

  const text = description ?? emptyText ?? "";

  return (
    <p
      className={
        scaled
          ? `card-panel card-panel-body card-text-panel-body ${className}`
          : `flex h-full items-center overflow-hidden border border-white/10 bg-black/30 px-2 py-1 text-left text-xs leading-snug text-foreground/80 sm:px-3 sm:text-sm ${className}`
      }
    >
      {text}
    </p>
  );
}

export function AbilityDescription({
  cardType,
  abilityName,
  abilityEffect,
  abilityValue,
  abilityTrigger,
  eraName = "",
  variant = "inline",
  lines = 2,
  emptyText,
  className = "",
}: CardAbilityInput & {
  variant?: "panel" | "panel-play" | "panel-compact" | "inline" | "compact";
  lines?: 1 | 2 | 3;
  emptyText?: string;
  className?: string;
}) {
  const description = describeCardAbility({
    cardType,
    abilityName,
    abilityEffect,
    abilityValue,
    abilityTrigger,
    eraName,
  });
  const showEmpty = emptyText && !hasCardAbility({ abilityName, abilityEffect, abilityTrigger });

  if (!description && !showEmpty) return null;

  const text = description ?? emptyText ?? "";
  const lineClamp =
    lines === 1 ? "line-clamp-1" : lines === 3 ? "line-clamp-3" : "line-clamp-2";

  if (variant === "panel" || variant === "panel-play" || variant === "panel-compact") {
    const compact = variant === "panel-compact";
    const play = variant === "panel-play";
    return (
      <div
        className={`shrink-0 overflow-hidden border border-white/10 bg-black/30 ${
          compact || play ? "rounded-lg" : "rounded-xl"
        } ${className}`}
      >
        <div
          className={`flex items-stretch ${
            compact || play ? "" : "flex-col sm:flex-row sm:items-stretch"
          }`}
        >
          <p
            className={`shrink-0 font-semibold uppercase tracking-wide text-foreground ${
              play
                ? "flex w-12 items-center justify-center border-r border-white/10 px-1 py-1 text-[7px] sm:text-[8px]"
                : compact
                  ? "flex w-11 items-center justify-center border-r border-white/10 px-0.5 py-1 text-[8px] sm:text-[9px]"
                  : "border-b border-white/10 px-2.5 py-1.5 text-[10px] sm:flex sm:w-16 sm:items-center sm:justify-center sm:border-b-0 sm:border-r sm:px-2 sm:py-1.5 sm:text-[11px]"
            }`}
          >
            {cardAbilityPanelLabel(cardType)}
          </p>
          <p
            className={`leading-snug text-foreground/80 ${
              play
                ? "line-clamp-2 flex flex-1 items-center px-1.5 py-1 text-[7px] sm:text-[8px]"
                : compact
                  ? "line-clamp-3 flex flex-1 items-center px-1.5 py-1 text-[8px] sm:text-[9px]"
                  : "px-2.5 py-2 text-center text-xs sm:flex sm:flex-1 sm:items-center sm:px-3 sm:py-1.5 sm:text-left sm:text-sm"
            }`}
          >
            {text}
          </p>
        </div>
      </div>
    );
  }

  const tone =
    variant === "compact"
      ? "text-[10px] leading-snug text-muted"
      : "text-xs leading-snug text-foreground/80 sm:text-sm";

  return (
    <p className={`text-left ${tone} ${lineClamp} ${className}`}>
      {text}
    </p>
  );
}

export function FlavorText({
  text,
  lines = 2,
  variant = "default",
  className = "",
}: {
  text: string | null | undefined;
  lines?: 1 | 2 | 3;
  variant?: "default" | "card";
  className?: string;
}) {
  if (!text?.trim()) return null;
  const lineClamp =
    lines === 1 ? "line-clamp-1" : lines === 3 ? "line-clamp-3" : "line-clamp-2";
  const tone =
    variant === "card"
      ? "text-sm italic leading-relaxed text-foreground/80"
      : "text-[10px] italic leading-snug text-muted";
  return (
    <p className={`px-1 text-left ${tone} ${lineClamp} ${className}`}>
      &ldquo;{text.trim()}&rdquo;
    </p>
  );
}

export function LocationBadge({ size = "default", scaled = false }: { size?: CardPillSize; scaled?: boolean }) {
  return (
    <span
      className={
        scaled
          ? "card-pill-chip card-text-chip bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
          : `${CARD_PILL_CLASS[size]} bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300`
      }
    >
      <MapPin className={scaled ? "card-icon-chip" : undefined} size={scaled ? undefined : CARD_PILL_ICON[size]} />
      Location
    </span>
  );
}

export function UnitBadge({ size = "default", scaled = false }: { size?: CardPillSize; scaled?: boolean }) {
  return (
    <span
      className={
        scaled
          ? "card-pill-chip card-text-chip bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
          : `${CARD_PILL_CLASS[size]} bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300`
      }
    >
      <Flag className={scaled ? "card-icon-chip" : undefined} size={scaled ? undefined : CARD_PILL_ICON[size]} />
      Unit
    </span>
  );
}

export function CharacterBadge({ size = "default", scaled = false }: { size?: CardPillSize; scaled?: boolean }) {
  return (
    <span
      className={
        scaled
          ? "card-pill-chip card-text-chip bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300"
          : `${CARD_PILL_CLASS[size]} bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300`
      }
    >
      <User className={scaled ? "card-icon-chip" : undefined} size={scaled ? undefined : CARD_PILL_ICON[size]} />
      Character
    </span>
  );
}

export function EventBadge({ size = "default", scaled = false }: { size?: CardPillSize; scaled?: boolean }) {
  return (
    <span
      className={
        scaled
          ? "card-pill-chip card-text-chip bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
          : `${CARD_PILL_CLASS[size]} bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300`
      }
    >
      <Swords className={scaled ? "card-icon-chip" : undefined} size={scaled ? undefined : CARD_PILL_ICON[size]} />
      Event
    </span>
  );
}

export function HoloBadge() {
  return (
    <span
      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
      style={{
        backgroundImage:
          "linear-gradient(115deg, #ff5fa2, #ffe45f, #5fffb0, #5fc9ff, #c95fff)",
      }}
    >
      <Sparkles size={11} />
      Holo
    </span>
  );
}

const ATK_DEF_CLASS = {
  compact: { text: "text-xs", icon: 12, gap: "gap-5", pad: "px-2 py-1" },
  default: { text: "text-sm", icon: 16, gap: "gap-8", pad: "px-3 py-1.5" },
  prominent: { text: "text-lg font-semibold", icon: 24, gap: "gap-12", pad: "px-4 py-2" },
} as const;

type AtkDefVariant = keyof typeof ATK_DEF_CLASS;

export function AttackDefenseRow({
  attack,
  defense,
  color,
  variant = "default",
  className = "",
  fill = false,
}: {
  attack: number;
  defense: number;
  color: string;
  variant?: AtkDefVariant;
  className?: string;
  fill?: boolean;
}) {
  const styles = ATK_DEF_CLASS[variant];
  return (
    <div className={`flex w-full justify-center ${className}`}>
      <div
        className={`flex items-center justify-center rounded-lg border border-white/10 bg-black/85 font-mono uppercase text-foreground ${styles.gap} ${styles.text} ${styles.pad} ${
          fill ? "h-full w-full" : "inline-flex"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <Swords size={styles.icon} style={{ color }} />
          {attack}
        </span>
        <span className="flex items-center gap-1.5">
          <Shield size={styles.icon} style={{ color }} />
          {defense}
        </span>
      </div>
    </div>
  );
}
