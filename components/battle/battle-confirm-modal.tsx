"use client";

type Props = {
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
};

export function BattleConfirmModal({
  title,
  body,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  pending = false,
}: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-amber-900/50 bg-[#14100c] p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="battle-confirm-title"
      >
        <h2 id="battle-confirm-title" className="text-base font-semibold text-amber-100">
          {title}
        </h2>
        <div className="mt-3 text-sm leading-relaxed text-neutral-300">{body}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-amber-50 hover:bg-amber-600 disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
