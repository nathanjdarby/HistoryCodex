export function ModalFlavorText({ text, scaled = false }: { text: string | null | undefined; scaled?: boolean }) {
  const trimmed = text?.trim();
  if (!trimmed) return null;

  return (
    <div
      data-card-modal-scroll
      className={
        scaled
          ? "card-flavor-scroll h-full overflow-y-auto"
          : "max-h-[12rem] overflow-y-auto px-2.5 py-1.5 sm:px-3 sm:py-2"
      }
    >
      <div className="w-full rounded-md px-1 py-0.5 text-left">
        <p
          className={
            scaled
              ? "card-text-flavor italic leading-snug text-foreground/80"
              : "text-xs italic leading-snug text-foreground/80 sm:text-sm sm:leading-relaxed"
          }
        >
          &ldquo;{trimmed}&rdquo;
        </p>
      </div>
    </div>
  );
}
