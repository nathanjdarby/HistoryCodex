"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Pencil, Plus, Trash2, Upload, X } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  function eraName(eraId: number | null) {
    if (eraId == null) return "Any era";
    return eras?.find((e) => e.id === eraId)?.name ?? "Unknown era";
  }

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
          <h1 className="text-xl font-semibold text-neutral-100">Booster Packs</h1>
          <p className="text-sm text-neutral-500">{packConfigs?.length ?? 0} pack products</p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-1.5 rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-amber-50 hover:bg-amber-600"
        >
          <Plus size={15} />
          New pack
        </button>
      </div>

      {error && !formOpen && <p className="text-sm text-red-400">{error}</p>}
      {isLoading && <p className="text-sm text-neutral-500">Loading...</p>}

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-800 bg-neutral-900/60">
            <tr>
              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                Art
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                Name
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                Scope
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                Price
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                Cards
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                Weights (C/U/R/E/L/M)
              </th>
              <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                Active
              </th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {packConfigs?.map((config) => (
              <tr key={config.id} className="border-b border-neutral-900 hover:bg-neutral-900/40">
                <td className="px-3 py-2">
                  <div className="relative aspect-[4/7] w-10 overflow-hidden rounded border border-neutral-800 bg-neutral-950">
                    {config.imageUrl ? (
                      <Image
                        src={config.imageUrl}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-neutral-600">
                        —
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <p className="font-medium text-neutral-200">{config.name}</p>
                  {config.description && (
                    <p className="text-xs text-neutral-500">{config.description}</p>
                  )}
                </td>
                <td className="px-3 py-2 text-neutral-400">
                  {eraName(config.eraId)}
                  {config.cardType && (
                    <span className="ml-1 capitalize text-neutral-500">
                      · {config.cardType}s
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-neutral-300">{config.price} pts</td>
                <td className="px-3 py-2 font-mono text-neutral-300">{config.cardsPerPack}</td>
                <td className="px-3 py-2 font-mono text-xs text-neutral-400">
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
                        : "bg-neutral-800 text-neutral-500 hover:bg-neutral-700"
                    }`}
                  >
                    {config.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditForm(config)}
                      className="text-neutral-500 hover:text-amber-300"
                      aria-label={`Edit ${config.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => promptDelete(config)}
                      className="text-neutral-500 hover:text-red-400"
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
          <p className="p-4 text-sm text-neutral-500">No packs yet.</p>
        )}
      </div>

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
            className="w-full max-w-lg rounded-lg border border-neutral-800 bg-neutral-900/90 p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-200">
                {editingId ? "Edit pack" : "New pack"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="text-neutral-500 hover:text-neutral-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
              <div className="relative aspect-[4/7] w-28 shrink-0 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-950">
                {form.imageUrl ? (
                  <Image src={form.imageUrl} alt="" fill sizes="112px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-neutral-600">
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
                  className="flex items-center justify-center gap-1.5 rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
                >
                  <Upload size={14} />
                  {uploading ? "Uploading..." : "Upload pack art"}
                </button>
                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: null }))}
                    className="text-xs text-neutral-500 hover:text-red-400"
                  >
                    Remove artwork
                  </button>
                )}
                <p className="text-xs text-neutral-500">Recommended aspect ratio: 4:7</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="col-span-full flex flex-col gap-1 text-sm">
                Name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
                />
              </label>
              <label className="col-span-full flex flex-col gap-1 text-sm">
                Description (optional)
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
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
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
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
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Era scope
                <select
                  value={form.eraId}
                  onChange={(e) => setForm({ ...form, eraId: e.target.value })}
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
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
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
                >
                  <option value="">Any type</option>
                  <option value="character">{CARD_TYPE_LABELS_PLURAL.character}</option>
                  <option value="unit">{CARD_TYPE_LABELS_PLURAL.unit}</option>
                  <option value="location">{CARD_TYPE_LABELS_PLURAL.location}</option>
                  <option value="event">{CARD_TYPE_LABELS_PLURAL.event}</option>
                </select>
              </label>

              <div className="col-span-full border-t border-neutral-800 pt-3">
                <h3 className="text-sm font-medium text-neutral-200">
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
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
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
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
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
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
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
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
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
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
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
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5"
                />
              </label>

              <label className="col-span-full flex items-center gap-2 border-t border-neutral-800 pt-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-neutral-700"
                />
                Active (visible to open on /packs)
              </label>

              {error && <p className="col-span-full text-sm text-red-400">{error}</p>}

              <div className="col-span-full flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-amber-50 hover:bg-amber-600 disabled:opacity-50"
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
