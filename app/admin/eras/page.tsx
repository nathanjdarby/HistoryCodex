"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { Era } from "@/lib/types";
import { formatYearRange } from "@/lib/format";

async function fetchEras(): Promise<Era[]> {
  const res = await fetch("/api/eras");
  if (!res.ok) throw new Error("Failed to load eras");
  return res.json();
}

type EraFormState = {
  name: string;
  region: string;
  startYear: string;
  endYear: string;
  colorPrimary: string;
  colorSecondary: string;
  description: string;
};

const emptyForm: EraFormState = {
  name: "",
  region: "",
  startYear: "",
  endYear: "",
  colorPrimary: "#b45309",
  colorSecondary: "#1e293b",
  description: "",
};

function toFormState(era: Era): EraFormState {
  return {
    name: era.name,
    region: era.region ?? "",
    startYear: String(era.startYear),
    endYear: String(era.endYear),
    colorPrimary: era.colorPrimary,
    colorSecondary: era.colorSecondary,
    description: era.description ?? "",
  };
}

function formToPayload(form: EraFormState) {
  return {
    name: form.name,
    region: form.region || null,
    startYear: Number(form.startYear),
    endYear: Number(form.endYear),
    colorPrimary: form.colorPrimary,
    colorSecondary: form.colorSecondary,
    description: form.description || null,
  };
}

export default function ErasPage() {
  const queryClient = useQueryClient();
  const { data: eras, isLoading } = useQuery({ queryKey: ["eras"], queryFn: fetchEras });

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EraFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = formToPayload(form);
      const res = await fetch(editingId ? `/api/eras/${editingId}` : "/api/eras", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save era");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eras"] });
      closeForm();
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/eras/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete era");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eras"] });
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setFormOpen(true);
  }

  function openEditForm(era: Era) {
    setEditingId(era.id);
    setForm(toFormState(era));
    setError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function promptDelete(era: Era) {
    if (confirm(`Delete "${era.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(era.id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Eras &amp; Civilizations</h1>
          <p className="text-sm text-muted">
            Create, edit, and remove historical periods. Each era drives timeline swimlanes, book
            grouping, character pools, and pack scoping.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:brightness-110"
        >
          <Plus size={16} />
          New era
        </button>
      </div>

      {error && !formOpen && (
        <div className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {isLoading && <p className="text-muted">Loading eras…</p>}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-surface/80 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">Era</th>
              <th className="px-3 py-2">Region</th>
              <th className="px-3 py-2">Years</th>
              <th className="px-3 py-2">Colors</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && (eras?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted">
                  No eras yet. Create one, or run <code className="text-muted">npm run db:seed</code>{" "}
                  for starter data.
                </td>
              </tr>
            )}
            {eras?.map((era) => (
              <tr key={era.id} className="border-b border-border/80 hover:bg-surface/40">
                <td className="px-3 py-3">
                  <p className="font-medium text-foreground">{era.name}</p>
                  <p className="font-mono text-[10px] text-subtle">{era.slug}</p>
                </td>
                <td className="px-3 py-3 text-muted">{era.region ?? "—"}</td>
                <td className="px-3 py-3 whitespace-nowrap text-foreground/80">
                  {formatYearRange(era.startYear, era.endYear)}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-5 w-5 rounded border border-white/10"
                      style={{ background: era.colorPrimary }}
                      title={era.colorPrimary}
                    />
                    <span
                      className="h-5 w-5 rounded border border-white/10"
                      style={{ background: era.colorSecondary }}
                      title={era.colorSecondary}
                    />
                  </div>
                </td>
                <td className="max-w-xs px-3 py-3 text-muted">
                  <p className="line-clamp-2">{era.description ?? "—"}</p>
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEditForm(era)}
                      className="rounded p-1.5 text-muted hover:bg-surface-raised hover:text-foreground"
                      aria-label={`Edit ${era.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => promptDelete(era)}
                      disabled={deleteMutation.isPending}
                      className="rounded p-1.5 text-muted hover:bg-red-950 hover:text-red-300 disabled:opacity-50"
                      aria-label={`Delete ${era.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            className="my-8 w-full max-w-2xl rounded-lg border border-border bg-surface/95 p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium text-foreground">
                {editingId ? "Edit era" : "Create era"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded p-1 text-muted hover:bg-surface-raised hover:text-foreground"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                Name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Tudor England"
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Region / civilization
                <input
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  placeholder="e.g. Britain"
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Start year (negative = BCE)
                <input
                  required
                  type="number"
                  value={form.startYear}
                  onChange={(e) => setForm({ ...form, startYear: e.target.value })}
                  placeholder="e.g. -500"
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                End year (negative = BCE)
                <input
                  required
                  type="number"
                  value={form.endYear}
                  onChange={(e) => setForm({ ...form, endYear: e.target.value })}
                  placeholder="e.g. 1485"
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Primary color
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.colorPrimary}
                    onChange={(e) => setForm({ ...form, colorPrimary: e.target.value })}
                    className="h-9 w-12 rounded border border-border-strong bg-background px-1"
                  />
                  <span className="font-mono text-xs text-muted">{form.colorPrimary}</span>
                </div>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Secondary color
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.colorSecondary}
                    onChange={(e) => setForm({ ...form, colorSecondary: e.target.value })}
                    className="h-9 w-12 rounded border border-border-strong bg-background px-1"
                  />
                  <span className="font-mono text-xs text-muted">{form.colorSecondary}</span>
                </div>
              </label>
              <label className="col-span-full flex flex-col gap-1 text-sm">
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Optional context for this period or civilization…"
                  className="rounded border border-border-strong bg-background px-2 py-1.5"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-foreground/80 hover:bg-surface-raised"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:brightness-110 disabled:opacity-50"
              >
                {saveMutation.isPending ? "Saving…" : editingId ? "Save changes" : "Create era"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
