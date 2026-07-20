"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { LayoutGrid, List, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { BoosterPacksEraSections } from "@/components/booster-packs-era-sections";
import {
  groupBoosterPacksByEraAz,
  sortBoosterPacksByEraAz,
} from "@/lib/client/booster-packs-by-era";
import { fetchEras } from "@/lib/client/eras";
import { CARD_TYPE_LABELS_PLURAL, type CardType } from "@/lib/card-types";

type PackConfig = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  cardsPerPack: number;
  price: number;
  eraId: number | null;
  cardType: CardType | null;
  weightCommon: number;
  weightUncommon: number;
  weightRare: number;
  weightEpic: number;
  weightLegendary: number;
  weightMythic: number;
  active: boolean;
};

async function fetchPackConfigs(): Promise<PackConfig[]> {
  const res = await fetch("/api/pack-configs");
  if (!res.ok) throw new Error("Failed to load packs");
  return res.json();
}

type PackFormState = {
  name: string;
  description: string;
  imageUrl: string | null;
  cardsPerPack: string;
  price: string;
  eraId: string;
  cardType: "" | CardType;
  weightCommon: string;
  weightUncommon: string;
  weightRare: string;
  weightEpic: string;
  weightLegendary: string;
  weightMythic: string;
  active: boolean;
};

const emptyForm: PackFormState = {
  name: "",
  description: "",
  imageUrl: null,
  cardsPerPack: "10",
  price: "50",
  eraId: "",
  cardType: "",
  weightCommon: "55",
  weightUncommon: "27",
  weightRare: "12",
  weightEpic: "5",
  weightLegendary: "1",
  weightMythic: "0",
  active: true,
};

function toFormState(config: PackConfig): PackFormState {
  return {
    name: config.name,
    description: config.description ?? "",
    imageUrl: config.imageUrl ?? null,
    cardsPerPack: String(config.cardsPerPack),
    price: String(config.price),
    eraId: config.eraId != null ? String(config.eraId) : "",
    cardType: config.cardType ?? "",
    weightCommon: String(config.weightCommon),
    weightUncommon: String(config.weightUncommon),
    weightRare: String(config.weightRare),
    weightEpic: String(config.weightEpic),
    weightLegendary: String(config.weightLegendary),
    weightMythic: String(config.weightMythic),
    active: config.active,
  };
}

type ViewMode = "table" | "gallery";

export default function AdminPacksPage() {
  const queryClient = useQueryClient();
  const { data: eras } = useQuery({ queryKey: ["eras"], queryFn: fetchEras });
  const { data: packConfigs, isLoading } = useQuery({
    queryKey: ["pack-configs"],
    queryFn: fetchPackConfigs,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PackFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function eraName(eraId: number | null) {
    if (eraId == null) return "Any era";
    return eras?.find((e) => e.id === eraId)?.name ?? "Unknown era";
  }

  const sortedPackConfigs = useMemo(
    () =>
      sortBoosterPacksByEraAz(packConfigs ?? [], (config) => eraName(config.eraId)),
    [packConfigs, eras],
  );

  const packGroups = useMemo(
    () => groupBoosterPacksByEraAz(packConfigs ?? [], (config) => eraName(config.eraId)),
    [packConfigs, eras],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description.trim() || null,
        imageUrl: form.imageUrl,
        cardsPerPack: Number(form.cardsPerPack),
        price: Number(form.price),
        eraId: form.eraId ? Number(form.eraId) : null,
        cardType: form.cardType || null,
        weightCommon: Number(form.weightCommon),
        weightUncommon: Number(form.weightUncommon),
        weightRare: Number(form.weightRare),
        weightEpic: Number(form.weightEpic),
        weightLegendary: Number(form.weightLegendary),
        weightMythic: Number(form.weightMythic),
        active: form.active,
      };
      const res = await fetch(
        editingId ? `/api/pack-configs/${editingId}` : "/api/pack-configs",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save pack");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pack-configs"] });
      closeForm();
    },
    onError: (err: Error) => setError(err.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await fetch(`/api/pack-configs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to update pack");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pack-configs"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/pack-configs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete pack");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pack-configs"] }),
    onError: (err: Error) => setError(err.message),
  });

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setFormOpen(true);
  }

  function openEditForm(config: PackConfig) {
    setEditingId(config.id);
    setForm(toFormState(config));
    setError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  function promptDelete(config: PackConfig) {
    if (confirm(`Delete pack "${config.name}"?`)) deleteMutation.mutate(config.id);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", "pack");
      const res = await fetch("/api/uploads", { method: "POST", body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      const { url } = (await res.json()) as { url: string };
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Booster Packs</h1>
          <p className="text-sm text-muted">{packConfigs?.length ?? 0} pack products</p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:brightness-110"
        >
          <Plus size={15} />
          New pack
        </button>
      </div>

      {error && !formOpen && <p className="text-sm text-red-400">{error}</p>}
      {isLoading && <p className="text-sm text-muted">Loading...</p>}

      <div className="flex justify-end">
        <div className="flex rounded-md border border-border-strong bg-surface p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`rounded p-1.5 ${
              viewMode === "table" ? "bg-surface-raised text-foreground" : "text-muted hover:text-foreground"
            }`}
            aria-label="Table view"
            title="Table view"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("gallery")}
            className={`rounded p-1.5 ${
              viewMode === "gallery" ? "bg-surface-raised text-foreground" : "text-muted hover:text-foreground"
            }`}
            aria-label="Gallery view"
            title="Gallery view"
          >
            <LayoutGrid size={15} />
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface/60">
            <tr>
              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                Art
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                Name
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                Scope
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                Price
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                Cards
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                Weights (C/U/R/E/L/M)
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                Active
              </th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sortedPackConfigs.map((config) => (
              <tr key={config.id} className="border-b border-border hover:bg-surface/40">
                <td className="px-3 py-2">
                  <div className="relative aspect-[4/7] w-10 overflow-hidden rounded border border-border bg-background">
                    {config.imageUrl ? (
                      <Image
                        src={config.imageUrl}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-subtle">
                        —
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <p className="font-medium text-foreground">{config.name}</p>
                  {config.description && (
                    <p className="text-xs text-muted">{config.description}</p>
                  )}
                </td>
                <td className="px-3 py-2 text-muted">
                  {eraName(config.eraId)}
                  {config.cardType && (
                    <span className="ml-1 capitalize text-muted">
                      · {config.cardType}s
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-foreground/80">{config.price} pts</td>
                <td className="px-3 py-2 font-mono text-foreground/80">{config.cardsPerPack}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted">
                  {config.weightCommon}/{config.weightUncommon}/{config.weightRare}/
                  {config.weightEpic}/{config.weightLegendary}/{config.weightMythic}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() =>
                      toggleActiveMutation.mutate({ id: config.id, active: !config.active })
                    }
                    disabled={toggleActiveMutation.isPending}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      config.active
                        ? "bg-emerald-900/50 text-emerald-300 hover:bg-emerald-900/70"
                        : "bg-surface-raised text-muted hover:bg-surface-raised"
                    }`}
                  >
                    {config.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditForm(config)}
                      className="text-muted hover:text-gold-bright"
                      aria-label={`Edit ${config.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => promptDelete(config)}
                      className="text-muted hover:text-red-400"
                      aria-label={`Delete ${config.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {packConfigs?.length === 0 && !isLoading && (
          <p className="p-4 text-sm text-muted">No packs yet.</p>
        )}
      </div>
      ) : !isLoading ? (
        <BoosterPacksEraSections
          groups={packGroups}
          getPackKey={(config) => config.id}
          gridClassName="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          renderPack={(config) => (
            <article className="group flex flex-col rounded-xl border border-border bg-surface/40 p-3">
              <div className="relative mb-3 aspect-[4/7] w-full overflow-hidden rounded-lg border border-border bg-background">
                {config.imageUrl ? (
                  <Image
                    src={config.imageUrl}
                    alt={config.name}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-xs text-subtle">
                    No pack art
                  </div>
                )}
              </div>
                <div className="flex min-h-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                    {config.name}
                  </p>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${
                      config.active
                        ? "bg-emerald-900/50 text-emerald-200"
                        : "bg-surface-raised text-muted"
                    }`}
                  >
                    {config.active ? "Active" : "Inactive"}
                  </span>
                </div>
                {config.description ? (
                  <p className="line-clamp-2 text-xs text-muted">{config.description}</p>
                ) : null}
                <p className="text-[10px] text-muted">
                  {eraName(config.eraId)}
                  {config.cardType ? ` · ${config.cardType}s` : ""}
                </p>
                <p className="text-[10px] text-muted">
                  {config.price} pts · {config.cardsPerPack} cards
                </p>
                <p className="font-mono text-[10px] text-muted">
                  {config.weightCommon}/{config.weightUncommon}/{config.weightRare}/
                  {config.weightEpic}/{config.weightLegendary}/{config.weightMythic}
                </p>
              </div>
              <div className="mt-3 flex gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() =>
                    toggleActiveMutation.mutate({ id: config.id, active: !config.active })
                  }
                  disabled={toggleActiveMutation.isPending}
                  className={`inline-flex flex-1 items-center justify-center rounded-md border px-2 py-1.5 text-xs ${
                    config.active
                      ? "border-emerald-900/50 text-emerald-300 hover:bg-emerald-900/20"
                      : "border-border-strong text-muted hover:bg-surface-raised"
                  }`}
                >
                  {config.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => openEditForm(config)}
                  className="rounded-md border border-border-strong p-1.5 text-muted hover:bg-surface-raised"
                  aria-label={`Edit ${config.name}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => promptDelete(config)}
                  className="rounded-md border border-red-900/50 p-1.5 text-red-400 hover:bg-red-950/40"
                  aria-label={`Delete ${config.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          )}
          emptyMessage={<p className="p-4 text-sm text-muted">No packs yet.</p>}
        />
      ) : null}

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onClick={closeForm}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="w-full max-w-lg rounded-lg border border-border bg-surface/90 p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">
                {editingId ? "Edit pack" : "New pack"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="text-muted hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
              <div className="relative aspect-[4/7] w-28 shrink-0 overflow-hidden rounded-lg border border-border-strong bg-background">
                {form.imageUrl ? (
                  <Image src={form.imageUrl} alt="" fill sizes="112px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-subtle">
                    4:7 pack art
                  </div>
                )}
              </div>
              <div className="flex w-full flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImageUpload(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-border-strong px-3 py-1.5 text-sm text-foreground hover:bg-surface-raised disabled:opacity-50"
                >
                  <Upload size={14} />
                  {uploading ? "Uploading..." : "Upload pack art"}
                </button>
                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: null }))}
                    className="text-xs text-muted hover:text-red-400"
                  >
                    Remove artwork
                  </button>
                )}
                <p className="text-xs text-muted">Recommended aspect ratio: 4:7</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                Description (optional)
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Cards per pack
                <input
                  required
                  type="number"
                  min={1}
                  max={20}
                  value={form.cardsPerPack}
                  onChange={(e) => setForm({ ...form, cardsPerPack: e.target.value })}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Price (points)
                <input
                  required
                  type="number"
                  min={1}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Era scope
                <select
                  value={form.eraId}
                  onChange={(e) => setForm({ ...form, eraId: e.target.value })}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                >
                  <option value="">Any era</option>
                  {eras?.map((era) => (
                    <option key={era.id} value={era.id}>
                      {era.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Card type
                <select
                  value={form.cardType}
                  onChange={(e) =>
                    setForm({ ...form, cardType: e.target.value as PackFormState["cardType"] })
                  }
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                >
                  <option value="">Any type</option>
                  <option value="character">{CARD_TYPE_LABELS_PLURAL.character}</option>
                  <option value="unit">{CARD_TYPE_LABELS_PLURAL.unit}</option>
                  <option value="location">{CARD_TYPE_LABELS_PLURAL.location}</option>
                  <option value="event">{CARD_TYPE_LABELS_PLURAL.event}</option>
                </select>
              </label>

              <div className="col-span-full border-t border-border pt-3">
                <h3 className="text-sm font-medium text-foreground">
                  Rarity weights (relative, don&rsquo;t need to sum to 100)
                </h3>
              </div>

              <label className="flex flex-col gap-1 text-sm">
                Common
                <input
                  required
                  type="number"
                  min={0}
                  value={form.weightCommon}
                  onChange={(e) => setForm({ ...form, weightCommon: e.target.value })}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Uncommon
                <input
                  required
                  type="number"
                  min={0}
                  value={form.weightUncommon}
                  onChange={(e) => setForm({ ...form, weightUncommon: e.target.value })}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Rare
                <input
                  required
                  type="number"
                  min={0}
                  value={form.weightRare}
                  onChange={(e) => setForm({ ...form, weightRare: e.target.value })}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Epic
                <input
                  required
                  type="number"
                  min={0}
                  value={form.weightEpic}
                  onChange={(e) => setForm({ ...form, weightEpic: e.target.value })}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Legendary
                <input
                  required
                  type="number"
                  min={0}
                  value={form.weightLegendary}
                  onChange={(e) => setForm({ ...form, weightLegendary: e.target.value })}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Mythic
                <input
                  required
                  type="number"
                  min={0}
                  value={form.weightMythic}
                  onChange={(e) => setForm({ ...form, weightMythic: e.target.value })}
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>

              <label className="col-span-full flex items-center gap-2 border-t border-border pt-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-border-strong"
                />
                Active (visible to open on /packs)
              </label>

              {error && <p className="col-span-full text-sm text-red-400">{error}</p>}

              <div className="col-span-full flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md px-3 py-1.5 text-sm text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-50"
                >
                  {saveMutation.isPending ? "Saving..." : editingId ? "Save changes" : "Create pack"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
