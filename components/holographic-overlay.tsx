// First child of a card root (`relative overflow-hidden`). Sits at z-0 so it
// shimmers the card background only; wrap foreground content in `relative z-[1]`.
export function HolographicOverlay() {
  return (
    <div
      className="animate-holo-shimmer pointer-events-none absolute inset-0 z-0"
      style={{
        backgroundImage:
          "linear-gradient(115deg, transparent 0%, #ff5fa2 15%, #ffe45f 30%, #5fffb0 45%, #5fc9ff 60%, #c95fff 75%, transparent 90%)",
        backgroundSize: "250% 250%",
        mixBlendMode: "screen",
        opacity: 0.45,
      }}
    />
  );
}
