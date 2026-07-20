"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { X } from "lucide-react";
import { CharacterCardPreview } from "@/components/character-card-preview";
import {
  ScaledCharacterCardShell,
} from "@/components/scaled-character-card";
import type {
  ImportCardPreview,
  ImportDuplicateDecision,
  ImportDuplicateCharacterPreview,
} from "@/lib/server/import-catalog-book-cards";
import { dexNumber } from "@/lib/rarity";

const THUMBNAIL_WIDTH_REM = 11;
const MODAL_COMPARE_WIDTH_REM = 18;

type ImportDuplicateCardReviewProps = {
  card: ImportCardPreview;
  decision: ImportDuplicateDecision;
  onDecisionChange: (decision: ImportDuplicateDecision) => void;
};

function previewFromCharacter(
  character: ImportDuplicateCharacterPreview,
  imageUrl: string | null,
) {
  return {
    name: character.name,
    rarity: character.rarity,
    cardType: character.cardType,
    cost: character.cost,
    attack: character.attack,
    defense: character.defense,
    archetype: character.archetype,
    era: character.era,
    abilityName: character.abilityName,
    abilityEffect: character.abilityEffect,
    abilityValue: character.abilityValue,
    abilityTrigger: character.abilityTrigger,
    flavorText: character.flavorText,
    seed: character.seed,
    imageUrl,
    holographic: character.holographic,
    dexLabel: dexNumber(character.id),
    ownership: { showStatus: true, owned: true },
  };
}

function decisionButtonClass(active: boolean, accent = false) {
  if (active) {
    return accent
      ? "bg-accent text-accent-foreground"
      : "bg-surface-raised text-foreground ring-1 ring-border-strong";
  }
  return "border border-border-strong text-foreground/80 hover:bg-surface";
}

function ImportCardPreviewTile({
  label,
  previewProps,
  dashed = false,
  onOpen,
}: {
  label: string;
  previewProps: ComponentProps<typeof CharacterCardPreview>;
  dashed?: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <button
        type="button"
        onClick={onOpen}
        className={`flex w-full cursor-zoom-in justify-center rounded-lg border p-3 transition hover:brightness-105 ${
          dashed ? "border-dashed border-accent/40 bg-accent/5" : "border-border bg-surface/30"
        }`}
        aria-label={`View ${label.toLowerCase()} for ${previewProps.name}`}
      >
        <ScaledCharacterCardShell
          displayWidthRem={THUMBNAIL_WIDTH_REM}
          className="rounded-2xl shadow-sm"
          innerClassName="pointer-events-none"
        >
          <CharacterCardPreview {...previewProps} density="full" />
        </ScaledCharacterCardShell>
      </button>
    </div>
  );
}

function ImportCompareModal({
  card,
  existingPreview,
  incomingPreview,
  onClose,
}: {
  card: ImportCardPreview;
  existingPreview: ComponentProps<typeof CharacterCardPreview> | null;
  incomingPreview: ComponentProps<typeof CharacterCardPreview> | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-6xl space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{card.name}</h3>
              <p className="text-sm capitalize text-muted">{card.cardType} · compare artwork</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border p-2 text-muted hover:bg-surface-raised hover:text-foreground"
              aria-label="Close comparison"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {existingPreview ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">On platform</p>
                <div className="flex justify-center">
                  <ScaledCharacterCardShell
                    displayWidthRem={MODAL_COMPARE_WIDTH_REM}
                    className="rounded-2xl shadow-2xl"
                  >
                    <CharacterCardPreview {...existingPreview} density="full" />
                  </ScaledCharacterCardShell>
                </div>
              </div>
            ) : null}

            {incomingPreview ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Incoming artwork
                </p>
                <div className="flex justify-center">
                  <ScaledCharacterCardShell
                    displayWidthRem={MODAL_COMPARE_WIDTH_REM}
                    className="rounded-2xl shadow-2xl"
                  >
                    <CharacterCardPreview {...incomingPreview} density="full" />
                  </ScaledCharacterCardShell>
                </div>
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-muted">
                Incoming preview unavailable for this import path.
              </p>
            )}
          </div>

          <p className="text-center text-xs text-muted">
            Cards shown as unlocked for comparison. Click outside or press Esc to close.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ImportDuplicateCardReview({
  card,
  decision,
  onDecisionChange,
}: ImportDuplicateCardReviewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const existing = card.existingCharacter;
  const incomingImageUrl = card.incomingPreviewUrl ?? null;
  const template = existing ?? {
    id: 0,
    name: card.name,
    seed: card.seed,
    cardType: card.cardType,
    rarity: "common" as const,
    cost: 20,
    attack: 0,
    defense: 0,
    archetype: null,
    abilityName: null,
    abilityEffect: null,
    abilityValue: null,
    abilityTrigger: null,
    flavorText: null,
    imageUrl: null,
    holographic: false,
    era: {
      name: card.eraSlug,
      colorPrimary: "#334155",
      colorSecondary: "#1e293b",
    },
  };

  const existingPreview = existing
    ? previewFromCharacter(existing, existing.imageUrl)
    : null;
  const incomingPreview = incomingImageUrl
    ? previewFromCharacter(template, incomingImageUrl)
    : null;

  return (
    <>
      <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-medium text-foreground">{card.name}</p>
            <p className="text-sm capitalize text-muted">
              {card.cardType}
              {card.matchedBy === "name" ? " · matched by name on platform" : " · matched by seed"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onDecisionChange("replace")}
              className={`rounded-md px-3 py-1.5 text-sm ${decisionButtonClass(decision === "replace", true)}`}
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onDecisionChange("add_variant")}
              className={`rounded-md px-3 py-1.5 text-sm ${decisionButtonClass(decision === "add_variant", true)}`}
            >
              Add variant
            </button>
            <button
              type="button"
              onClick={() => onDecisionChange("ignore")}
              className={`rounded-md px-3 py-1.5 text-sm ${decisionButtonClass(decision === "ignore")}`}
            >
              Ignore
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {existingPreview ? (
            <ImportCardPreviewTile
              label="On platform"
              previewProps={existingPreview}
              onOpen={() => setModalOpen(true)}
            />
          ) : (
            <p className="py-10 text-sm text-muted">Existing card details unavailable.</p>
          )}

          {incomingPreview ? (
            <ImportCardPreviewTile
              label="Incoming artwork"
              previewProps={incomingPreview}
              dashed
              onOpen={() => setModalOpen(true)}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Incoming artwork
              </p>
              <p className="rounded-lg border border-dashed border-border px-4 py-10 text-sm text-muted">
                Preview unavailable for server-side import paths. Replace and add-variant still work.
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-muted">
          Click a card to compare full size. Replace updates the platform card&apos;s artwork. Add
          variant keeps the existing card and creates a separate card for this book with the new
          artwork. Ignore links the existing card without changing art.
        </p>
      </div>

      {modalOpen ? (
        <ImportCompareModal
          card={card}
          existingPreview={existingPreview}
          incomingPreview={incomingPreview}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </>
  );
}
