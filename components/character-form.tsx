"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Upload, X } from "lucide-react";
import type { Character } from "@/lib/types";
import { CARD_TYPE_ENUM } from "@/db/schema";
import { CharacterCardPreview } from "@/components/character-card-preview";
import { ImageFrameEditor, useImageFrameDrag } from "@/components/image-frame-editor";
import {
  computeDefaultBattleStats,
  computeDefaultLocationBuff,
  type AbilityEffect,
  type AbilityTrigger,
} from "@/lib/battle";
import { isEffectValidForCardType } from "@/lib/battle/suggest-ability";
import { ARCHETYPE_LABEL, RARITY_META, RARITY_ORDER, dexNumber } from "@/lib/rarity";
import {
  DEFAULT_IMAGE_FRAME,
  clampImageFrame,
  type ImageFrame,
} from "@/lib/image-frame";
import { fetchEras } from "@/lib/client/eras";
import { AbilityBuilder } from "@/components/ability-builder";
import {
  ARCHETYPE_OPTIONS,
} from "@/components/character-badges";

type CatalogBookOption = {
  id: number;
  title: string;
  author: string | null;
  eraId: number | null;
  eraName: string | null;
};

async function fetchCatalogBooks(): Promise<CatalogBookOption[]> {
  const res = await fetch("/api/admin/catalog-books");
  if (!res.ok) throw new Error("Failed to load catalog books");
  return res.json();
}

type CharacterFormState = {
  name: string;
  flavorText: string;
  eraId: string;
  rarity: (typeof RARITY_ORDER)[number];
  cardType: (typeof CARD_TYPE_ENUM)[number];
  holographic: boolean;
  cost: string;
  archetype: "" | (typeof ARCHETYPE_OPTIONS)[number];
  imageUrl: string | null;
  imageFocusX: number;
  imageFocusY: number;
  imageScale: number;
  attack: string;
  defense: string;
  abilityName: string;
  abilityEffect: "" | AbilityEffect;
  abilityValue: string;
  abilityTrigger: "" | AbilityTrigger;
};

const defaultBattleDefaults = computeDefaultBattleStats("common", null);

const emptyForm: CharacterFormState = {
  name: "",
  flavorText: "",
  eraId: "",
  rarity: "common",
  cardType: "character",
  holographic: false,
  cost: "20",
  archetype: "",
  imageUrl: null,
  imageFocusX: DEFAULT_IMAGE_FRAME.focusX,
  imageFocusY: DEFAULT_IMAGE_FRAME.focusY,
  imageScale: DEFAULT_IMAGE_FRAME.scale,
  attack: String(defaultBattleDefaults.attack),
  defense: String(defaultBattleDefaults.defense),
  abilityName: defaultBattleDefaults.abilityName ?? "",
  abilityEffect: defaultBattleDefaults.abilityEffect ?? "",
  abilityValue:
    defaultBattleDefaults.abilityValue !== null ? String(defaultBattleDefaults.abilityValue) : "",
  abilityTrigger: "",
};

function suggestedFormStats(
  rarity: CharacterFormState["rarity"],
  archetype: CharacterFormState["archetype"],
): Pick<CharacterFormState, "attack" | "defense" | "abilityName" | "abilityEffect" | "abilityValue"> {
  const stats = computeDefaultBattleStats(rarity, archetype || null);
  return {
    attack: String(stats.attack),
    defense: String(stats.defense),
    abilityName: stats.abilityName ?? "",
    abilityEffect: stats.abilityEffect ?? "",
    abilityValue: stats.abilityValue !== null ? String(stats.abilityValue) : "",
  };
}

function suggestedFormBuff(
  rarity: CharacterFormState["rarity"],
): Pick<CharacterFormState, "abilityName" | "abilityEffect" | "abilityValue"> {
  const buff = computeDefaultLocationBuff(rarity);
  return {
    abilityName: buff.abilityName,
    abilityEffect: buff.abilityEffect,
    abilityValue: String(buff.abilityValue),
  };
}

function buildInitialForm(
  character: Character | null | undefined,
  defaultEraId: number | null | undefined,
  defaultCardType: CharacterFormState["cardType"] | undefined,
): CharacterFormState {
  if (!character) {
    return {
      ...emptyForm,
      eraId: defaultEraId != null ? String(defaultEraId) : "",
      cardType: defaultCardType ?? emptyForm.cardType,
    };
  }
  return {
    name: character.name,
    flavorText: character.flavorText ?? "",
    eraId: String(character.eraId),
    rarity: character.rarity,
    cardType: character.cardType,
    holographic: character.holographic,
    cost: String(character.cost),
    archetype: character.archetype ?? "",
    imageUrl: character.imageUrl ?? null,
    imageFocusX: character.imageFocusX,
    imageFocusY: character.imageFocusY,
    imageScale: character.imageScale,
    attack: String(character.attack),
    defense: String(character.defense),
    abilityName: character.abilityName ?? "",
    abilityEffect: character.abilityEffect ?? "",
    abilityValue: character.abilityValue !== null ? String(character.abilityValue) : "",
    abilityTrigger: character.abilityTrigger ?? "",
  };
}

type CharacterFormProps = {
  /** Omit or pass null for create mode. Pass a character to edit it. */
  character?: Character | null;
  /** Pre-filled era for create mode (e.g. the collection page's current era filter). */
  defaultEraId?: number | null;
  /** Pre-filled card type for create mode (e.g. the admin Locations page). */
  defaultCardType?: (typeof CARD_TYPE_ENUM)[number];
  /** Pre-select a catalog book when linking during create. */
  defaultCatalogBookId?: number | null;
  onSaved: (character: Character) => void;
  onCancel: () => void;
};

/**
 * Render this with a `key` that changes with the target character (e.g.
 * `key={character?.id ?? "new"}`) so switching edit targets remounts the
 * form with fresh state instead of reusing stale field values.
 */
export function CharacterForm({
  character,
  defaultEraId,
  defaultCardType,
  defaultCatalogBookId,
  onSaved,
  onCancel,
}: CharacterFormProps) {
  const queryClient = useQueryClient();
  const editingId = character?.id ?? null;

  const { data: eras } = useQuery({ queryKey: ["eras"], queryFn: fetchEras });
  const { data: catalogBooks } = useQuery({
    queryKey: ["admin-catalog-books"],
    queryFn: fetchCatalogBooks,
    enabled: !editingId,
  });
  const [form, setForm] = useState<CharacterFormState>(() =>
    buildInitialForm(character, defaultEraId, defaultCardType),
  );
  const [linkCatalogBookId, setLinkCatalogBookId] = useState(() =>
    defaultCatalogBookId != null ? String(defaultCatalogBookId) : "",
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageFrame: ImageFrame = {
    focusX: form.imageFocusX,
    focusY: form.imageFocusY,
    scale: form.imageScale,
  };

  function setImageFrame(next: ImageFrame) {
    const clamped = clampImageFrame(next);
    setForm((current) => ({
      ...current,
      imageFocusX: clamped.focusX,
      imageFocusY: clamped.focusY,
      imageScale: clamped.scale,
    }));
  }

  const imageDragHandlers = useImageFrameDrag(imageFrame, setImageFrame, !form.imageUrl || uploading);

  const isLocation = form.cardType === "location";

  const compatibleBooks = useMemo(() => {
    if (!catalogBooks || !form.eraId) return [];
    const eraId = Number(form.eraId);
    return catalogBooks.filter((book) => book.eraId == null || book.eraId === eraId);
  }, [catalogBooks, form.eraId]);

  function handleEraChange(eraId: string) {
    setForm((current) => ({ ...current, eraId }));
    setLinkCatalogBookId((current) => {
      if (!current) return current;
      const book = catalogBooks?.find((entry) => String(entry.id) === current);
      if (!book || (book.eraId != null && book.eraId !== Number(eraId))) return "";
      return current;
    });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        flavorText: form.flavorText.trim() || null,
        eraId: Number(form.eraId),
        rarity: form.rarity,
        cardType: form.cardType,
        holographic: form.holographic,
        cost: Number(form.cost),
        archetype: isLocation ? null : form.archetype || null,
        imageUrl: form.imageUrl,
        imageFocusX: Math.round(form.imageFocusX),
        imageFocusY: Math.round(form.imageFocusY),
        imageScale: Math.round(form.imageScale),
        attack: isLocation ? 0 : Number(form.attack),
        defense: isLocation ? 0 : Number(form.defense),
        abilityName: form.abilityName.trim() || null,
        abilityEffect: form.abilityEffect || null,
        abilityValue: form.abilityValue.trim() ? Number(form.abilityValue) : null,
        abilityTrigger: form.abilityTrigger || null,
      };
      const res = await fetch(editingId ? `/api/characters/${editingId}` : "/api/characters", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save character");
      }
      const saved = (await res.json()) as Character;

      if (!editingId && linkCatalogBookId) {
        const linkRes = await fetch(`/api/admin/catalog-books/${linkCatalogBookId}/cards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId: saved.id }),
        });
        if (!linkRes.ok) {
          const body = await linkRes.json().catch(() => ({}));
          throw new Error(body.error ?? "Card saved but failed to link to book");
        }
      }

      return saved;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      if (linkCatalogBookId) {
        queryClient.invalidateQueries({
          queryKey: ["admin-catalog-book-cards", Number(linkCatalogBookId)],
        });
        queryClient.invalidateQueries({ queryKey: ["admin-catalog-books"] });
        queryClient.invalidateQueries({ queryKey: ["books"] });
      }
      onSaved(saved);
    },
    onError: (err: Error) => setError(err.message),
  });

  function suggestStats() {
    setForm((f) => ({ ...f, ...suggestedFormStats(f.rarity, f.archetype) }));
  }

  function suggestBuff() {
    setForm((f) => ({ ...f, ...suggestedFormBuff(f.rarity) }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? "Failed to upload image");
      }
      const { url } = await res.json();
      setForm((f) => ({
        ...f,
        imageUrl: url,
        imageFocusX: DEFAULT_IMAGE_FRAME.focusX,
        imageFocusY: DEFAULT_IMAGE_FRAME.focusY,
        imageScale: DEFAULT_IMAGE_FRAME.scale,
      }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const previewEraSelection = eras?.find((era) => String(era.id) === form.eraId);
  const previewEra = previewEraSelection ?? { colorPrimary: "#57534e", colorSecondary: "#292524" };
  const previewSeed = form.name.trim() ? `preview-${form.name.trim()}` : "preview-new-character";
  const previewCost = Number(form.cost) || 0;
  const previewAttack = Number(form.attack) || 0;
  const previewDefense = Number(form.defense) || 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate();
      }}
      className="flex max-h-[min(90dvh,calc(100dvh-2rem))] flex-col overflow-hidden rounded-lg border border-border bg-surface/60"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-foreground">
          {editingId ? "Edit character" : "New character"}
        </h2>
        <button type="button" onClick={onCancel} className="text-muted hover:text-foreground">
          <X size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(22rem,26rem)_minmax(0,30rem)] xl:justify-start">
        {/* Live card preview — matches collection modal layout */}
        <div className="mx-auto w-full max-w-[26rem] xl:mx-0 xl:sticky xl:top-0 xl:self-start">
          <CharacterCardPreview
            name={form.name.trim() || "Unnamed character"}
            rarity={form.rarity}
            cardType={form.cardType}
            cost={previewCost}
            attack={previewAttack}
            defense={previewDefense}
            archetype={form.archetype || null}
            era={{
              name: previewEraSelection?.name ?? "Select an era",
              colorPrimary: previewEra.colorPrimary,
              colorSecondary: previewEra.colorSecondary,
            }}
            abilityName={form.abilityName.trim() || null}
            abilityEffect={(form.abilityEffect || null) as AbilityEffect | null}
            abilityValue={form.abilityValue.trim() ? Number(form.abilityValue) : null}
            abilityTrigger={form.abilityTrigger || null}
            flavorText={form.flavorText.trim() || null}
            seed={previewSeed}
            imageUrl={form.imageUrl}
            imageFrame={imageFrame}
            holographic={form.holographic}
            dexLabel={editingId ? dexNumber(editingId) : "NEW"}
            reserveHeaderActionsSpace={false}
            onImagePointerDown={form.imageUrl ? imageDragHandlers.onPointerDown : undefined}
            onImagePointerMove={form.imageUrl ? imageDragHandlers.onPointerMove : undefined}
            onImagePointerUp={form.imageUrl ? imageDragHandlers.onPointerUp : undefined}
          />

          <details className="mt-3 rounded-lg border border-border bg-background/50 p-2">
            <summary className="cursor-pointer select-none px-1 py-0.5 text-xs font-medium text-foreground/80">
              Art & crop
            </summary>
            <div className="mt-2 flex flex-col items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="character-image-upload"
            />
            <label
              htmlFor="character-image-upload"
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border-strong px-3 py-1.5 text-sm text-foreground hover:bg-surface-raised"
            >
              <Upload size={14} />
              {uploading ? "Uploading..." : "Upload custom art"}
            </label>
            {form.imageUrl && (
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    imageUrl: null,
                    imageFocusX: DEFAULT_IMAGE_FRAME.focusX,
                    imageFocusY: DEFAULT_IMAGE_FRAME.focusY,
                    imageScale: DEFAULT_IMAGE_FRAME.scale,
                  }))
                }
                className="text-xs text-muted hover:text-red-400"
              >
                Remove image (use generated sprite)
              </button>
            )}
            {form.imageUrl && (
              <ImageFrameEditor
                frame={imageFrame}
                onChange={setImageFrame}
                disabled={uploading}
              />
            )}
            <p className="text-center text-[10px] text-subtle">
              PNG, JPEG, GIF, or WebP. Max 5MB.
            </p>
            </div>
          </details>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:max-w-[30rem]">
          <label className="col-span-full flex flex-col gap-1 text-sm">
            Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded border border-border-strong bg-background px-2 py-1.5"
            />
          </label>
          <label className="col-span-full flex flex-col gap-1 text-sm">
            Flavor text (optional)
            <textarea
              value={form.flavorText}
              onChange={(e) => setForm({ ...form, flavorText: e.target.value })}
              maxLength={280}
              rows={2}
              placeholder="A short quote or lore snippet for the card..."
              className="resize-none rounded border border-border-strong bg-background px-2 py-1.5"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Card type
            <select
              value={form.cardType}
              onChange={(e) => {
                const cardType = e.target.value as CharacterFormState["cardType"];
                setForm((f) => {
                  const next = {
                    ...f,
                    cardType,
                    archetype: cardType === "location" ? "" : f.archetype,
                    abilityTrigger:
                      cardType === "event" || cardType === "location" ? "" : f.abilityTrigger,
                  };
                  if (
                    next.abilityEffect &&
                    !isEffectValidForCardType(next.abilityEffect, cardType)
                  ) {
                    next.abilityName = "";
                    next.abilityEffect = "";
                    next.abilityValue = "";
                    next.abilityTrigger = "";
                  }
                  return next;
                });
              }}
              className="rounded border border-border-strong bg-background px-2 py-1.5"
            >
              <option value="character">Character</option>
              <option value="unit">Unit</option>
              <option value="location">Location</option>
              <option value="event">Event</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Era
            <select
              required
              value={form.eraId}
              onChange={(e) => handleEraChange(e.target.value)}
              className="rounded border border-border-strong bg-background px-2 py-1.5"
            >
              <option value="" disabled>
                Select an era
              </option>
              {eras?.map((era) => (
                <option key={era.id} value={era.id}>
                  {era.name}
                </option>
              ))}
            </select>
          </label>
          {!editingId && (
            <label className="col-span-full flex flex-col gap-1 text-sm">
              Link to book (optional)
              <select
                value={linkCatalogBookId}
                onChange={(e) => setLinkCatalogBookId(e.target.value)}
                disabled={!form.eraId}
                className="rounded border border-border-strong bg-background px-2 py-1.5 disabled:opacity-50"
              >
                <option value="">
                  {!form.eraId ? "Select an era first" : "— None —"}
                </option>
                {compatibleBooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                    {book.author ? ` · ${book.author}` : ""}
                    {book.eraName ? ` (${book.eraName})` : " (any era)"}
                  </option>
                ))}
              </select>
              {form.eraId && compatibleBooks.length === 0 ? (
                <span className="text-xs text-muted">
                  No catalog books match this era yet.
                </span>
              ) : null}
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm">
            Rarity
            <select
              value={form.rarity}
              onChange={(e) =>
                setForm({ ...form, rarity: e.target.value as CharacterFormState["rarity"] })
              }
              className="rounded border border-border-strong bg-background px-2 py-1.5"
            >
              {RARITY_ORDER.map((r) => (
                <option key={r} value={r}>
                  {r} · {RARITY_META[r].stars}★
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Cost (points) — sets the power bar
            <input
              required
              type="number"
              min={1}
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              className="rounded border border-border-strong bg-background px-2 py-1.5"
            />
          </label>
          {!isLocation && (
            <label className="flex flex-col gap-1 text-sm">
              Archetype (optional)
              <select
                value={form.archetype}
                onChange={(e) =>
                  setForm({
                    ...form,
                    archetype: e.target.value as CharacterFormState["archetype"],
                  })
                }
                className="rounded border border-border-strong bg-background px-2 py-1.5"
              >
                <option value="">— None —</option>
                {ARCHETYPE_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {ARCHETYPE_LABEL[a]}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="col-span-full flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.holographic}
              onChange={(e) => setForm({ ...form, holographic: e.target.checked })}
              className="h-4 w-4 rounded border-border-strong bg-background"
            />
            Holographic
          </label>

          <div className="col-span-full flex items-center justify-between border-t border-border pt-3">
            <h3 className="text-sm font-medium text-foreground">{isLocation ? "Buff" : "Battle stats"}</h3>
            <button
              type="button"
              onClick={isLocation ? suggestBuff : suggestStats}
              className="flex items-center gap-1.5 rounded-md border border-border-strong px-2.5 py-1 text-xs text-foreground/80 hover:bg-surface-raised"
            >
              <RefreshCw size={12} />
              {isLocation
                ? `Suggest buff for ${form.rarity}`
                : `Suggest stats for ${form.rarity}/${form.archetype || "none"}`}
            </button>
          </div>

          {!isLocation && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                Attack
                <input
                  required
                  type="number"
                  min={0}
                  value={form.attack}
                  onChange={(e) => setForm({ ...form, attack: e.target.value })}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Defense
                <input
                  required
                  type="number"
                  min={0}
                  value={form.defense}
                  onChange={(e) => setForm({ ...form, defense: e.target.value })}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
            </>
          )}
          <AbilityBuilder
            cardType={form.cardType}
            rarity={form.rarity}
            archetype={form.archetype}
            value={{
              abilityName: form.abilityName,
              abilityEffect: form.abilityEffect,
              abilityValue: form.abilityValue,
              abilityTrigger: form.abilityTrigger,
            }}
            onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
          />

          {error && <p className="col-span-full text-sm text-red-400">{error}</p>}
        </div>
      </div>
      </div>

      <div className="shrink-0 border-t border-border bg-surface/95 px-4 py-3">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-sm text-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending || uploading}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : editingId ? "Save changes" : "Create character"}
          </button>
        </div>
      </div>
    </form>
  );
}
