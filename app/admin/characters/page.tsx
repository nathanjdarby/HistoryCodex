"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ImageOff, LayoutGrid, List, Pencil, Plus, Trash2 } from "lucide-react";
import type { Character, Era } from "@/lib/types";
import { AdminCardGallery } from "@/components/admin-card-gallery";
import { CharacterArt } from "@/components/character-art";
import { CharacterCardModal } from "@/components/character-card-modal";
import { CharacterForm } from "@/components/character-form";
import { HoloBadge } from "@/components/character-badges";
import { imageFrameFromCharacter } from "@/lib/image-frame";
import { RARITY_META, RARITY_ORDER } from "@/lib/rarity";
import { fetchEras } from "@/lib/client/eras";
import { useCardModalNavigation } from "@/lib/client/use-card-modal-navigation";

type CharacterWithEra = Character & { era: Era; owned: boolean; unlockedAt: string | null };

async function fetchCharacters(): Promise<CharacterWithEra[]> {
  const res = await fetch("/api/characters");
  if (!res.ok) throw new Error("Failed to load characters");
  return res.json();
}

type SortKey = "name" | "era" | "rarity" | "cost" | "attack" | "defense";
type ViewMode = "table" | "gallery";

function SortHeader({
  label,
  sortKeyName,
  activeKey,
  activeDir,
  onToggle,
}: {
  label: string;
  sortKeyName: SortKey;
  activeKey: SortKey;
  activeDir: "asc" | "desc";
  onToggle: (key: SortKey) => void;
}) {
  const active = activeKey === sortKeyName;
  return (
    <button
      onClick={() => onToggle(sortKeyName)}
      className={`flex items-center gap-1 whitespace-nowrap text-xs font-medium uppercase tracking-wide ${
        active ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-300"
      }`}
    >
      {label}
      {active && (activeDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
    </button>
  );
}

export default function AdminCharactersPage() {
  const queryClient = useQueryClient();
  const { data: eras } = useQuery({ queryKey: ["eras"], queryFn: fetchEras });
  const { data: characters, isLoading } = useQuery({
    queryKey: ["characters"],
    queryFn: fetchCharacters,
  });

  const [eraFilter, setEraFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [ownedFilter, setOwnedFilter] = useState<"all" | "owned" | "locked">("all");
  const [imageFilter, setImageFilter] = useState<"all" | "custom" | "generated">("all");
  const [sortKey, setSortKey] = useState<SortKey>("era");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");

  const [formOpen, setFormOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<CharacterWithEra | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (characterId: number) => {
      const res = await fetch(`/api/characters/${characterId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete character");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.invalidateQueries({ queryKey: ["admin-artwork"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  function openCreateForm() {
    setEditingCharacter(null);
    setError(null);
    setFormOpen(true);
  }

  function openEditForm(character: CharacterWithEra) {
    setEditingCharacter(character);
    setError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingCharacter(null);
  }

  function promptDelete(character: CharacterWithEra) {
    const warning = character.owned
      ? `Delete "${character.name}"? You've already unlocked this one — deleting it will remove it from the collection.`
      : `Delete "${character.name}"?`;
    if (confirm(warning)) deleteMutation.mutate(character.id);
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const characterRows = useMemo(
    () => (characters ?? []).filter((c) => c.cardType === "character"),
    [characters],
  );

  const filtered = useMemo(() => {
    const rows = characterRows.filter((c) => {
      if (eraFilter && String(c.eraId) !== eraFilter) return false;
      if (rarityFilter && c.rarity !== rarityFilter) return false;
      if (ownedFilter === "owned" && !c.owned) return false;
      if (ownedFilter === "locked" && c.owned) return false;
      if (imageFilter === "custom" && !c.imageUrl) return false;
      if (imageFilter === "generated" && c.imageUrl) return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "era":
          return (
            (a.era.startYear - b.era.startYear || a.era.name.localeCompare(b.era.name)) * dir
          );
        case "rarity":
          return (RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)) * dir;
        case "cost":
          return (a.cost - b.cost) * dir;
        case "attack":
          return (a.attack - b.attack) * dir;
        case "defense":
          return (a.defense - b.defense) * dir;
        default:
          return 0;
      }
    });
  }, [characterRows, eraFilter, rarityFilter, ownedFilter, imageFilter, sortKey, sortDir]);

  const { viewing, onPrevious, onNext, positionLabel } = useCardModalNavigation(
    filtered,
    viewingId,
    setViewingId,
  );

  function openPreview(character: CharacterWithEra) {
    setViewingId(character.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">Characters</h1>
          <p className="text-sm text-neutral-500">{characterRows.length} total</p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-1.5 rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-amber-50 hover:bg-amber-600"
        >
          <Plus size={15} />
          New character
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={eraFilter}
          onChange={(e) => setEraFilter(e.target.value)}
          className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
        >
          <option value="">All eras</option>
          {eras?.map((era) => (
            <option key={era.id} value={era.id}>
              {era.name}
            </option>
          ))}
        </select>
        <select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value)}
          className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
        >
          <option value="">All rarities</option>
          {RARITY_ORDER.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <div className="flex rounded-md border border-neutral-700 bg-neutral-900 p-0.5 text-sm">
          {(["all", "owned", "locked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setOwnedFilter(f)}
              className={`rounded px-2 py-1 capitalize ${
                ownedFilter === f ? "bg-neutral-700 text-neutral-100" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex rounded-md border border-neutral-700 bg-neutral-900 p-0.5 text-sm">
          {(["all", "custom", "generated"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setImageFilter(f)}
              className={`rounded px-2 py-1 capitalize ${
                imageFilter === f ? "bg-neutral-700 text-neutral-100" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex rounded-md border border-neutral-700 bg-neutral-900 p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`rounded p-1.5 ${
              viewMode === "table" ? "bg-neutral-700 text-neutral-100" : "text-neutral-400 hover:text-neutral-200"
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
              viewMode === "gallery" ? "bg-neutral-700 text-neutral-100" : "text-neutral-400 hover:text-neutral-200"
            }`}
            aria-label="Gallery view"
            title="Gallery view"
          >
            <LayoutGrid size={15} />
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {isLoading && <p className="text-sm text-neutral-500">Loading...</p>}

      {viewMode === "table" ? (
      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-800 bg-neutral-900/60">
            <tr>
              <th className="px-3 py-2"></th>
              <th className="px-3 py-2">
                <SortHeader label="Name" sortKeyName="name" activeKey={sortKey} activeDir={sortDir} onToggle={toggleSort} />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="Era" sortKeyName="era" activeKey={sortKey} activeDir={sortDir} onToggle={toggleSort} />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="Rarity" sortKeyName="rarity" activeKey={sortKey} activeDir={sortDir} onToggle={toggleSort} />
              </th>
              <th className="px-3 py-2 text-neutral-500">Archetype</th>
              <th className="px-3 py-2">
                <SortHeader label="Cost" sortKeyName="cost" activeKey={sortKey} activeDir={sortDir} onToggle={toggleSort} />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="ATK" sortKeyName="attack" activeKey={sortKey} activeDir={sortDir} onToggle={toggleSort} />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="DEF" sortKeyName="defense" activeKey={sortKey} activeDir={sortDir} onToggle={toggleSort} />
              </th>
              <th className="px-3 py-2 text-neutral-500">Ability</th>
              <th className="px-3 py-2 text-neutral-500">Holo</th>
              <th className="px-3 py-2 text-neutral-500">Owned</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const meta = RARITY_META[c.rarity];
              return (
                <tr key={c.id} className="border-b border-neutral-900 hover:bg-neutral-900/40">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openPreview(c)}
                      className="relative block h-9 w-9 overflow-hidden rounded border border-neutral-800 bg-black/30 hover:border-amber-700/60"
                      aria-label={`View ${c.name}`}
                    >
                      <CharacterArt
                        seed={c.seed}
                        imageUrl={c.imageUrl}
                        imageFrame={imageFrameFromCharacter(c)}
                        era={c.era}
                        rarity={c.rarity}
                        archetype={c.archetype}
                        size={36}
                      />
                    </button>
                  </td>
                  <td className="px-3 py-2 text-left">
                    <button
                      type="button"
                      onClick={() => openPreview(c)}
                      className="block w-full text-left font-medium text-neutral-200 hover:text-amber-200"
                    >
                      {c.name}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-neutral-400">{c.era.name}</td>
                  <td className="px-3 py-2">
                    <span
                      className="rounded px-1.5 py-0.5 text-xs font-medium uppercase"
                      style={{ color: meta.color, background: `${meta.color}22` }}
                    >
                      {c.rarity}
                    </span>
                  </td>
                  <td className="px-3 py-2 capitalize text-neutral-400">{c.archetype ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-neutral-300">{c.cost}</td>
                  <td className="px-3 py-2 font-mono text-neutral-300">{c.attack}</td>
                  <td className="px-3 py-2 font-mono text-neutral-300">{c.defense}</td>
                  <td className="px-3 py-2 text-neutral-400">
                    {c.abilityName ?? <span className="text-neutral-600">—</span>}
                  </td>
                  <td className="px-3 py-2">{c.holographic && <HoloBadge />}</td>
                  <td className="px-3 py-2">
                    {c.owned ? (
                      <span className="text-xs font-medium text-emerald-400">Yes</span>
                    ) : (
                      <span className="text-xs text-neutral-600">No</span>
                    )}
                    {!c.imageUrl && (
                      <ImageOff
                        size={12}
                        className="ml-1 inline text-neutral-700"
                        aria-label="Generated sprite"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(c)}
                        className="text-neutral-500 hover:text-amber-300"
                        aria-label={`Edit ${c.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => promptDelete(c)}
                        className="text-neutral-500 hover:text-red-400"
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && !isLoading && (
          <p className="p-4 text-sm text-neutral-500">No characters match these filters.</p>
        )}
      </div>
      ) : (
        <>
          <AdminCardGallery
            characters={filtered}
            onPreview={openPreview}
            onEdit={openEditForm}
            onDelete={promptDelete}
          />
          {filtered.length === 0 && !isLoading && (
            <p className="text-sm text-neutral-500">No characters match these filters.</p>
          )}
        </>
      )}

      {viewing && (
        <CharacterCardModal
          character={viewing}
          onClose={() => setViewingId(null)}
          onPrevious={onPrevious}
          onNext={onNext}
          positionLabel={positionLabel}
        />
      )}

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-6 backdrop-blur-sm"
          onClick={closeForm}
        >
          <div className="w-full max-w-5xl shrink-0" onClick={(e) => e.stopPropagation()}>
            <CharacterForm
              key={editingCharacter?.id ?? "new"}
              character={editingCharacter}
              defaultEraId={eraFilter ? Number(eraFilter) : eras?.[0]?.id}
              defaultCardType="character"
              onSaved={closeForm}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}
    </div>
  );
}
