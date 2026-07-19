"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Sparkles, Zap } from "lucide-react";
import type {
  AbilityEffectCatalogEntry,
  AbilityTriggerCatalogEntry,
  ArchetypePassiveCatalogEntry,
} from "@/lib/battle/ability-catalog";

type AbilityAdminCatalog = {
  effects: AbilityEffectCatalogEntry[];
  triggers: AbilityTriggerCatalogEntry[];
  archetypePassives: ArchetypePassiveCatalogEntry[];
  valueMath: {
    statPoolByRarity: Record<string, number>;
    locationBuffByRarity: Record<string, number>;
    archetypeAbilityFraction: Record<string, number>;
    formula: string;
  };
  usage: Array<{
    abilityEffect: string;
    abilityTrigger: string | null;
    cardType: string;
    count: number;
  }>;
  namedUsage: Array<{
    abilityName: string;
    abilityEffect: string | null;
    abilityTrigger: string | null;
    cardType: string;
    count: number;
  }>;
  totals: {
    cardsWithAbility: number;
    distinctNamedAbilities: number;
  };
};

async function fetchAbilityCatalog(): Promise<AbilityAdminCatalog> {
  const res = await fetch("/api/admin/abilities");
  if (!res.ok) throw new Error("Failed to load ability catalog");
  return res.json();
}

function usageCount(
  usage: AbilityAdminCatalog["usage"],
  effectId: string,
): number {
  return usage
    .filter((row) => row.abilityEffect === effectId)
    .reduce((sum, row) => sum + row.count, 0);
}

function ContextPills({ contexts }: { contexts: AbilityEffectCatalogEntry["contexts"] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {contexts.map((context) => (
        <span
          key={context}
          className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-300"
        >
          {context}
        </span>
      ))}
    </div>
  );
}

export default function AdminAbilitiesPage() {
  const [filter, setFilter] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-abilities"],
    queryFn: fetchAbilityCatalog,
  });

  const filteredEffects = useMemo(() => {
    if (!data) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return data.effects;
    return data.effects.filter(
      (effect) =>
        effect.id.includes(q) ||
        effect.label.toLowerCase().includes(q) ||
        effect.summary.toLowerCase().includes(q) ||
        effect.eventTemplate?.toLowerCase().includes(q),
    );
  }, [data, filter]);

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading ability catalog…</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-red-400">Could not load ability catalog.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-neutral-100">
            <Zap size={22} className="text-amber-400" />
            Abilities
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-neutral-400">
            Reference for all implemented ability effects and triggers. Cards are configured by
            picking from these templates — new mechanics still require engine code.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-neutral-300">
            {data.effects.length} effect templates
          </span>
          <span className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-neutral-300">
            {data.totals.cardsWithAbility} cards configured
          </span>
          <span className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-neutral-300">
            {data.totals.distinctNamedAbilities} named abilities in use
          </span>
        </div>
      </div>

      <section className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
        <h2 className="text-sm font-semibold text-amber-200">Configurator vs creator</h2>
        <div className="mt-2 grid gap-3 text-sm leading-relaxed text-neutral-300 md:grid-cols-2">
          <div>
            <p className="font-medium text-neutral-100">Ability configurator (available today)</p>
            <p className="mt-1 text-neutral-400">
              Assign an existing effect + value + optional trigger to any card via{" "}
              <Link href="/admin/characters" className="text-amber-400 hover:underline">
                Characters
              </Link>
              ,{" "}
              <Link href="/admin/units" className="text-amber-400 hover:underline">
                Units
              </Link>
              ,{" "}
              <Link href="/admin/events" className="text-amber-400 hover:underline">
                Events
              </Link>
              , or{" "}
              <Link href="/admin/locations" className="text-amber-400 hover:underline">
                Locations
              </Link>
              . Balance scripts in{" "}
              <code className="text-neutral-300">db/data/card-balance/</code> do the same at scale.
            </p>
          </div>
          <div>
            <p className="font-medium text-neutral-100">True ability creator (not built yet)</p>
            <p className="mt-1 text-neutral-400">
              A new effect like “steal influence” or “bounce to hand” needs TypeScript handlers in{" "}
              <code className="text-neutral-300">lib/battle/effects.ts</code>,{" "}
              <code className="text-neutral-300">triggers.ts</code>, validators, AI, tests, and a DB
              enum migration. An admin UI alone cannot invent behaviour the engine does not know.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
        <h2 className="text-sm font-semibold text-neutral-100">Value math</h2>
        <p className="mt-1 text-sm text-neutral-400">{data.valueMath.formula}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Stat pool by rarity
            </p>
            <ul className="mt-2 space-y-1 text-sm text-neutral-300">
              {Object.entries(data.valueMath.statPoolByRarity).map(([rarity, pool]) => (
                <li key={rarity} className="flex justify-between gap-4">
                  <span className="capitalize text-neutral-400">{rarity}</span>
                  <span>{pool}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Location buff defaults
            </p>
            <ul className="mt-2 space-y-1 text-sm text-neutral-300">
              {Object.entries(data.valueMath.locationBuffByRarity).map(([rarity, value]) => (
                <li key={rarity} className="flex justify-between gap-4">
                  <span className="capitalize text-neutral-400">{rarity}</span>
                  <span>+{value} DEF</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Archetype ability fractions
            </p>
            <ul className="mt-2 space-y-1 text-sm text-neutral-300">
              {Object.entries(data.valueMath.archetypeAbilityFraction).map(([archetype, fraction]) => (
                <li key={archetype} className="flex justify-between gap-4">
                  <span className="capitalize text-neutral-400">{archetype}</span>
                  <span>{Math.round(fraction * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-neutral-100">Effect templates</h2>
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter effects…"
            className="w-full max-w-xs rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-900/80 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2">Effect</th>
                <th className="px-3 py-2">Used on</th>
                <th className="px-3 py-2">Triggers</th>
                <th className="px-3 py-2">Example (rare, 25)</th>
                <th className="px-3 py-2">Cards</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredEffects.map((effect) => (
                <tr key={effect.id} className="border-b border-neutral-900 align-top">
                  <td className="px-3 py-3">
                    <p className="font-medium text-neutral-100">{effect.label}</p>
                    <p className="font-mono text-[11px] text-neutral-500">{effect.id}</p>
                    {effect.eventTemplate ? (
                      <p className="mt-1 text-xs text-amber-300/90">{effect.eventTemplate}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <ContextPills contexts={effect.contexts} />
                  </td>
                  <td className="px-3 py-3 text-neutral-300">
                    {effect.triggers.length > 0
                      ? effect.triggers.map((trigger) => (
                          <span key={trigger} className="mr-1 inline-block rounded bg-neutral-800 px-1.5 py-0.5 text-[10px]">
                            {trigger}
                          </span>
                        ))
                      : "—"}
                  </td>
                  <td className="px-3 py-3 text-neutral-300">{effect.exampleRare}</td>
                  <td className="px-3 py-3 text-neutral-300">{usageCount(data.usage, effect.id)}</td>
                  <td className="max-w-sm px-3 py-3 text-xs leading-relaxed text-neutral-400">
                    <p>{effect.summary}</p>
                    <p className="mt-1">{effect.valueGuide}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {effect.needsLane ? (
                        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300">
                          needs lane
                        </span>
                      ) : null}
                      {effect.needsFriendlyTarget ? (
                        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300">
                          friendly target
                        </span>
                      ) : null}
                      {effect.needsEnemyTarget ? (
                        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300">
                          enemy target
                        </span>
                      ) : null}
                      {effect.interactive ? (
                        <span className="rounded bg-sky-950/60 px-1.5 py-0.5 text-[10px] text-sky-300">
                          player choice
                        </span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
          <h2 className="text-lg font-medium text-neutral-100">Unit triggers</h2>
          <div className="mt-3 space-y-3">
            {data.triggers.map((trigger) => (
              <div key={trigger.id} className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                <p className="font-medium text-neutral-100">{trigger.label}</p>
                <p className="font-mono text-[11px] text-neutral-500">{trigger.id}</p>
                <p className="mt-1 text-sm text-neutral-400">{trigger.summary}</p>
                <p className="mt-2 text-xs text-neutral-500">
                  Supported effects:{" "}
                  {trigger.supportedEffects.length > 0
                    ? trigger.supportedEffects.join(", ")
                    : "none wired yet"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
          <h2 className="flex items-center gap-2 text-lg font-medium text-neutral-100">
            <Sparkles size={16} className="text-violet-400" />
            Archetype passives
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            Separate from card abilities — always active based on archetype, not editable per card.
          </p>
          <div className="mt-3 space-y-3">
            {data.archetypePassives.map((passive) => (
              <div key={passive.id} className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                <p className="font-medium text-neutral-100">
                  {passive.archetype} · {passive.name}
                </p>
                <p className="mt-1 text-sm text-neutral-400">{passive.summary}</p>
              </div>
            ))}
          </div>
          <Link
            href="/admin/rules"
            className="mt-4 inline-flex items-center gap-1 text-sm text-amber-400 hover:underline"
          >
            Tune merchant refund & monarch aura in Rules
            <ExternalLink size={13} />
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
        <h2 className="text-lg font-medium text-neutral-100">Named abilities in the database</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Flavor names assigned to cards. The engine resolves behaviour from{" "}
          <code className="text-neutral-300">abilityEffect</code>, not the display name (except special
          cases like Unification).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-800 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Effect</th>
                <th className="px-3 py-2">Trigger</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Cards</th>
              </tr>
            </thead>
            <tbody>
              {data.namedUsage.slice(0, 40).map((row) => (
                <tr key={`${row.abilityName}-${row.abilityEffect}-${row.abilityTrigger}-${row.cardType}`} className="border-b border-neutral-900">
                  <td className="px-3 py-2 text-neutral-100">{row.abilityName}</td>
                  <td className="px-3 py-2 font-mono text-xs text-neutral-400">
                    {row.abilityEffect ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-neutral-400">
                    {row.abilityTrigger ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-neutral-400">{row.cardType}</td>
                  <td className="px-3 py-2 text-neutral-300">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
