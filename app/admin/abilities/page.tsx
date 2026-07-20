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
          className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-foreground/80"
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
    return <p className="text-sm text-muted">Loading ability catalog…</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-red-400">Could not load ability catalog.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Zap size={22} className="text-gold" />
            Abilities
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
            Reference for all implemented ability effects and triggers. Cards are configured by
            picking from these templates — new mechanics still require engine code.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-foreground/80">
            {data.effects.length} effect templates
          </span>
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-foreground/80">
            {data.totals.cardsWithAbility} cards configured
          </span>
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-foreground/80">
            {data.totals.distinctNamedAbilities} named abilities in use
          </span>
        </div>
      </div>

      <section className="rounded-xl border border-accent/35 bg-accent/10 p-4">
        <h2 className="text-sm font-semibold text-gold-bright">Configurator vs creator</h2>
        <div className="mt-2 grid gap-3 text-sm leading-relaxed text-foreground/80 md:grid-cols-2">
          <div>
            <p className="font-medium text-foreground">Ability configurator (available today)</p>
            <p className="mt-1 text-muted">
              Assign an existing effect + value + optional trigger to any card via{" "}
              <Link href="/admin/characters" className="text-gold hover:underline">
                Characters
              </Link>
              ,{" "}
              <Link href="/admin/units" className="text-gold hover:underline">
                Units
              </Link>
              ,{" "}
              <Link href="/admin/events" className="text-gold hover:underline">
                Events
              </Link>
              , or{" "}
              <Link href="/admin/locations" className="text-gold hover:underline">
                Locations
              </Link>
              . Balance scripts in{" "}
              <code className="text-foreground/80">db/data/card-balance/</code> do the same at scale.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">True ability creator (not built yet)</p>
            <p className="mt-1 text-muted">
              A new effect like “steal influence” or “bounce to hand” needs TypeScript handlers in{" "}
              <code className="text-foreground/80">lib/battle/effects.ts</code>,{" "}
              <code className="text-foreground/80">triggers.ts</code>, validators, AI, tests, and a DB
              enum migration. An admin UI alone cannot invent behaviour the engine does not know.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-background/60 p-4">
        <h2 className="text-sm font-semibold text-foreground">Value math</h2>
        <p className="mt-1 text-sm text-muted">{data.valueMath.formula}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Stat pool by rarity
            </p>
            <ul className="mt-2 space-y-1 text-sm text-foreground/80">
              {Object.entries(data.valueMath.statPoolByRarity).map(([rarity, pool]) => (
                <li key={rarity} className="flex justify-between gap-4">
                  <span className="capitalize text-muted">{rarity}</span>
                  <span>{pool}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Location buff defaults
            </p>
            <ul className="mt-2 space-y-1 text-sm text-foreground/80">
              {Object.entries(data.valueMath.locationBuffByRarity).map(([rarity, value]) => (
                <li key={rarity} className="flex justify-between gap-4">
                  <span className="capitalize text-muted">{rarity}</span>
                  <span>+{value} DEF</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Archetype ability fractions
            </p>
            <ul className="mt-2 space-y-1 text-sm text-foreground/80">
              {Object.entries(data.valueMath.archetypeAbilityFraction).map(([archetype, fraction]) => (
                <li key={archetype} className="flex justify-between gap-4">
                  <span className="capitalize text-muted">{archetype}</span>
                  <span>{Math.round(fraction * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-foreground">Effect templates</h2>
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter effects…"
            className="w-full max-w-xs rounded-lg border border-border-strong bg-background px-3 py-1.5 text-sm"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-surface/80 text-xs uppercase tracking-wide text-muted">
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
                <tr key={effect.id} className="border-b border-border align-top">
                  <td className="px-3 py-3">
                    <p className="font-medium text-foreground">{effect.label}</p>
                    <p className="font-mono text-[11px] text-muted">{effect.id}</p>
                    {effect.eventTemplate ? (
                      <p className="mt-1 text-xs text-gold-bright/90">{effect.eventTemplate}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <ContextPills contexts={effect.contexts} />
                  </td>
                  <td className="px-3 py-3 text-foreground/80">
                    {effect.triggers.length > 0
                      ? effect.triggers.map((trigger) => (
                          <span key={trigger} className="mr-1 inline-block rounded bg-surface-raised px-1.5 py-0.5 text-[10px]">
                            {trigger}
                          </span>
                        ))
                      : "—"}
                  </td>
                  <td className="px-3 py-3 text-foreground/80">{effect.exampleRare}</td>
                  <td className="px-3 py-3 text-foreground/80">{usageCount(data.usage, effect.id)}</td>
                  <td className="max-w-sm px-3 py-3 text-xs leading-relaxed text-muted">
                    <p>{effect.summary}</p>
                    <p className="mt-1">{effect.valueGuide}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {effect.needsLane ? (
                        <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-foreground/80">
                          needs lane
                        </span>
                      ) : null}
                      {effect.needsFriendlyTarget ? (
                        <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-foreground/80">
                          friendly target
                        </span>
                      ) : null}
                      {effect.needsEnemyTarget ? (
                        <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-foreground/80">
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
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <h2 className="text-lg font-medium text-foreground">Unit triggers</h2>
          <div className="mt-3 space-y-3">
            {data.triggers.map((trigger) => (
              <div key={trigger.id} className="rounded-lg border border-border bg-surface/50 p-3">
                <p className="font-medium text-foreground">{trigger.label}</p>
                <p className="font-mono text-[11px] text-muted">{trigger.id}</p>
                <p className="mt-1 text-sm text-muted">{trigger.summary}</p>
                <p className="mt-2 text-xs text-muted">
                  Supported effects:{" "}
                  {trigger.supportedEffects.length > 0
                    ? trigger.supportedEffects.join(", ")
                    : "none wired yet"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-4">
          <h2 className="flex items-center gap-2 text-lg font-medium text-foreground">
            <Sparkles size={16} className="text-violet-400" />
            Archetype passives
          </h2>
          <p className="mt-1 text-sm text-muted">
            Separate from card abilities — always active based on archetype, not editable per card.
          </p>
          <div className="mt-3 space-y-3">
            {data.archetypePassives.map((passive) => (
              <div key={passive.id} className="rounded-lg border border-border bg-surface/50 p-3">
                <p className="font-medium text-foreground">
                  {passive.archetype} · {passive.name}
                </p>
                <p className="mt-1 text-sm text-muted">{passive.summary}</p>
              </div>
            ))}
          </div>
          <Link
            href="/admin/rules"
            className="mt-4 inline-flex items-center gap-1 text-sm text-gold hover:underline"
          >
            Tune merchant refund & monarch aura in Rules
            <ExternalLink size={13} />
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-background/60 p-4">
        <h2 className="text-lg font-medium text-foreground">Named abilities in the database</h2>
        <p className="mt-1 text-sm text-muted">
          Flavor names assigned to cards. The engine resolves behaviour from{" "}
          <code className="text-foreground/80">abilityEffect</code>, not the display name (except special
          cases like Unification).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
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
                <tr key={`${row.abilityName}-${row.abilityEffect}-${row.abilityTrigger}-${row.cardType}`} className="border-b border-border">
                  <td className="px-3 py-2 text-foreground">{row.abilityName}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted">
                    {row.abilityEffect ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted">
                    {row.abilityTrigger ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-muted">{row.cardType}</td>
                  <td className="px-3 py-2 text-foreground/80">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
