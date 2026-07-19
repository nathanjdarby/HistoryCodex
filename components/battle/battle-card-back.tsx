type Props = {
  count?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
  style?: React.CSSProperties;
};

const SIZE_CLASS = {
  xs: "h-[4.75rem] w-[3.4rem] sm:h-[5.5rem] sm:w-[3.9rem]",
  sm: "h-[5.75rem] w-[4.1rem] sm:h-[6.75rem] sm:w-[4.8rem]",
  md: "h-[7rem] w-[5rem] sm:h-[8.25rem] sm:w-[5.85rem]",
} as const;

export function BattleCardBack({ count, size = "sm", className = "", style }: Props) {
  return (
    <div className={`relative ${SIZE_CLASS[size]} ${className}`} style={style}>
      <div
        className="absolute inset-0 rounded-lg border-2 border-amber-900/70 shadow-lg"
        style={{
          background:
            "repeating-linear-gradient(135deg, #1a1208 0px, #1a1208 8px, #241a0c 8px, #241a0c 16px)",
        }}
      >
        <div className="flex h-full items-center justify-center">
          <div className="rounded-full border border-amber-700/40 bg-amber-950/50 p-2">
            <span className="block text-lg font-serif text-amber-600/80">HC</span>
          </div>
        </div>
      </div>
      {count != null && count > 0 ? (
        <span className="absolute -right-1 -top-1 z-10 rounded-full border border-amber-700/60 bg-amber-950 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
          {count}
        </span>
      ) : null}
    </div>
  );
}
