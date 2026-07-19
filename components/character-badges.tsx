import type { CSSProperties } from "react";
import { Anchor, BookOpen, CheckCircle2, Coins, Crown, Flag, Lock, MapPin, Shield, Sparkles, Star, Sword, Swords, Zap } from "lucide-react";
import {
  cardAbilityPanelLabel,
  describeCardAbility,
  hasCardAbility,
  type CardAbilityInput,
} from "@/lib/battle";
import { ARCHETYPE_LABEL, RARITY_META, powerPercent, type RarityTier } from "@/lib/rarity";

export const ARCHETYPE_OPTIONS = ["warrior", "scholar", "monarch", "merchant", "sailor", "leader"] as const;

const ARCHETYPE_ICON: Record<(typeof ARCHETYPE_OPTIONS)[number], typeof Sword> = {
  warrior: Sword,
  scholar: BookOpen,
  monarch: Crown,
  merchant: Coins,
  sailor: Anchor,
  leader: Flag,
};

export function StarRating({ rarity, size = 10 }: { rarity: RarityTier; size?: number }) {
  const { stars, color } = RARITY_META[rarity];
  const slotCount = Math.max(5, stars);
  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {Array.from({ length: slotCount }, (_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < stars ? color : "transparent"}
          stroke={i < stars ? color : "#525252"}
        />
      ))}
    </span>
  );
}

const CARD_HEADER_CLASS = {
  compact: {
    dex: "text-[10px] text-neutral-500",
    name: "text-xs font-semibold text-neutral-100",
    star: 10,
    gap: "gap-1.5",
  },
  default: {
    dex: "text-xs text-neutral-400",
    name: "text-sm font-semibold text-neutral-100",
    star: 11,
    gap: "gap-2",
  },
  prominent: {
    dex: "text-sm text-neutral-300",
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
}: {
  quantity: number;
  className?: string;
}) {
  if (quantity <= 1) return null;

  return (
    <span
      className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full border border-white/15 bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-100 backdrop-blur-sm ${className}`}
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
          className="rounded-full border border-white/10 bg-black/50 p-1.5 backdrop-blur-sm"
          aria-label={owned ? "Unlocked" : "Locked"}
          title={owned ? "Unlocked" : "Locked"}
        >
          {owned ? (
            <CheckCircle2 size={variant === "prominent" ? 20 : 16} className="text-emerald-400" />
          ) : (
            <Lock size={variant === "prominent" ? 18 : 14} className="text-neutral-400" />
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
}: {
  label: string;
  color: string;
  size?: CardPillSize;
}) {
  return (
    <span
      className={`${CARD_PILL_CLASS[size]} border uppercase`}
      style={{
        color,
        backgroundColor: "rgba(10, 10, 10, 0.9)",
        borderColor: `${color}aa`,
        boxShadow: `inset 0 0 12px ${color}33`,
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
}: {
  cost: number;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={`flex h-11 w-11 flex-col items-center justify-center rounded-full border bg-black/80 font-mono leading-none backdrop-blur-sm ${className}`}
      style={{
        borderColor: `${color}aa`,
        boxShadow: `0 0 14px ${color}40`,
      }}
    >
      <span className="text-[8px] uppercase tracking-wide text-neutral-400">PWR</span>
      <span className="text-xs font-semibold text-neutral-100">{cost}</span>
    </div>
  );
}

export function CharacterCardArchetypeBadge({
  archetype,
  color,
  className = "",
}: {
  archetype: string | null;
  color: string;
  className?: string;
}) {
  if (!archetype) return null;
  const label = ARCHETYPE_LABEL[archetype];
  const Icon = ARCHETYPE_ICON[archetype as (typeof ARCHETYPE_OPTIONS)[number]];

  return (
    <div
      className={`group/archetype relative flex h-11 w-11 items-center justify-center rounded-full border bg-black/80 leading-none backdrop-blur-sm ${className}`}
      style={{
        borderColor: `${color}aa`,
        boxShadow: `0 0 14px ${color}40`,
      }}
      title={label}
      aria-label={label}
    >
      <Icon size={18} className="text-neutral-200" />
      <span
        role="tooltip"
        className="pointer-events-none absolute right-full top-1/2 z-20 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/90 px-2 py-1 text-[10px] font-medium text-neutral-100 opacity-0 shadow-lg transition-opacity duration-150 group-hover/archetype:opacity-100"
      >
        {label}
      </span>
    </div>
  );
}

export function CharacterCardCombatStatBadge({
  icon: Icon,
  value,
  label,
  color,
  className = "",
}: {
  icon: typeof Swords;
  value: number;
  label: string;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={`flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-full border bg-black/80 font-mono leading-none backdrop-blur-sm ${className}`}
      style={{
        borderColor: `${color}aa`,
        boxShadow: `0 0 14px ${color}40`,
      }}
      title={`${label} ${value}`}
      aria-label={`${label} ${value}`}
    >
      <Icon size={14} style={{ color }} />
      <span className="text-xs font-semibold text-neutral-100">{value}</span>
    </div>
  );
}

export function CharacterCardAttackBadge({
  attack,
  color,
  className = "",
}: {
  attack: number;
  color: string;
  className?: string;
}) {
  return (
    <CharacterCardCombatStatBadge
      icon={Swords}
      value={attack}
      label="Attack"
      color={color}
      className={className}
    />
  );
}

export function CharacterCardDefenseBadge({
  defense,
  color,
  className = "",
}: {
  defense: number;
  color: string;
  className?: string;
}) {
  return (
    <CharacterCardCombatStatBadge
      icon={Shield}
      value={defense}
      label="Defense"
      color={color}
      className={className}
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
      className={`flex shrink-0 flex-col justify-center rounded-md border border-white/10 bg-black/85 px-1.5 py-1 ${
        compact ? "w-16" : "w-24"
      } ${className}`}
    >
      <div
        className={`flex items-center justify-between font-mono uppercase ${
          compact ? "text-[9px]" : "text-[10px]"
        }`}
      >
        <span className="text-neutral-400">PWR</span>
        <span className="font-semibold text-neutral-100">{cost}</span>
      </div>
      <div
        className={`mt-0.5 w-full overflow-hidden rounded-full bg-neutral-950 ring-1 ring-white/10 ${
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
    <span className={`${CARD_PILL_CLASS[size]} bg-neutral-800/80 text-neutral-300 ${className}`}>
      <Icon size={CARD_PILL_ICON[size]} />
      {ARCHETYPE_LABEL[archetype]}
    </span>
  );
}

export function AbilityChip({
  name,
  size = "default",
}: {
  name: string | null;
  size?: CardPillSize;
}) {
  if (!name) return null;
  return (
    <span className={`${CARD_PILL_CLASS[size]} bg-amber-950/60 text-amber-300`}>
      <Zap size={CARD_PILL_ICON[size]} />
      {name}
    </span>
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
            className={`shrink-0 font-semibold uppercase tracking-wide text-neutral-200 ${
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
            className={`leading-snug text-neutral-300 ${
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
      ? "text-[10px] leading-snug text-amber-200/90"
      : "text-xs leading-snug text-neutral-300 sm:text-sm";

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
      ? "text-sm italic leading-relaxed text-neutral-300"
      : "text-[10px] italic leading-snug text-neutral-500";
  return (
    <p className={`px-1 text-left ${tone} ${lineClamp} ${className}`}>
      &ldquo;{text.trim()}&rdquo;
    </p>
  );
}

export function LocationBadge({ size = "default" }: { size?: CardPillSize }) {
  return (
    <span className={`${CARD_PILL_CLASS[size]} bg-emerald-950/60 text-emerald-300`}>
      <MapPin size={CARD_PILL_ICON[size]} />
      Location
    </span>
  );
}

export function UnitBadge({ size = "default" }: { size?: CardPillSize }) {
  return (
    <span className={`${CARD_PILL_CLASS[size]} bg-sky-950/60 text-sky-300`}>
      <Flag size={CARD_PILL_ICON[size]} />
      Unit
    </span>
  );
}

export function EventBadge({ size = "default" }: { size?: CardPillSize }) {
  return (
    <span className={`${CARD_PILL_CLASS[size]} bg-rose-950/60 text-rose-300`}>
      <Swords size={CARD_PILL_ICON[size]} />
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
        className={`flex items-center justify-center rounded-lg border border-white/10 bg-black/85 font-mono uppercase text-neutral-100 ${styles.gap} ${styles.text} ${styles.pad} ${
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
