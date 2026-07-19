"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Save, Scale } from "lucide-react";

type GameRules = {
  milestones: number[];
  pointsPerMilestone: number;
  dailyPointCap: number;
  weeklyPointCap: number;
  packGeneralMultiplier: number;
  minSecondsPerPage: number;
  softSecondsPerPage: number;
  maxWpm: number;
  softWpm: number;
  bulkPageJumpThreshold: number;
  minTrustForInstantAward: number;
  trustDecayPerFlag: number;
  trustGainOnApprove: number;
  battle: {
    cpTrack: number[];
    cpCap: number;
    deckSize: number;
    openingHandSize: number;
    maxCopiesPerCard: number;
    influenceToCapture: number;
    locationsToWin: number;
    merchantRefundCp: number;
    monarchAuraAttack: number;
    maxEventsPerTurn: number;
  };
  updatedAt: string | null;
};

type FormState = {
  milestonesText: string;
  pointsPerMilestone: string;
  dailyPointCap: string;
  weeklyPointCap: string;
  packGeneralMultiplier: string;
  minSecondsPerPage: string;
  softSecondsPerPage: string;
  maxWpm: string;
  softWpm: string;
  bulkPageJumpThreshold: string;
  minTrustForInstantAward: string;
  trustDecayPerFlag: string;
  trustGainOnApprove: string;
  battleCpTrack: string;
  battleCpCap: string;
  battleDeckSize: string;
  battleOpeningHandSize: string;
  battleMaxCopiesPerCard: string;
  battleInfluenceToCapture: string;
  battleLocationsToWin: string;
  battleMerchantRefundCp: string;
  battleMonarchAuraAttack: string;
  battleMaxEventsPerTurn: string;
};

async function fetchRules(): Promise<GameRules> {
  const res = await fetch("/api/admin/rules");
  if (!res.ok) throw new Error("Failed to load game rules");
  return res.json();
}

function rulesToForm(rules: GameRules): FormState {
  return {
    milestonesText: rules.milestones.join(", "),
    pointsPerMilestone: String(rules.pointsPerMilestone),
    dailyPointCap: String(rules.dailyPointCap),
    weeklyPointCap: String(rules.weeklyPointCap),
    packGeneralMultiplier: String(rules.packGeneralMultiplier),
    minSecondsPerPage: String(rules.minSecondsPerPage),
    softSecondsPerPage: String(rules.softSecondsPerPage),
    maxWpm: String(rules.maxWpm),
    softWpm: String(rules.softWpm),
    bulkPageJumpThreshold: String(rules.bulkPageJumpThreshold),
    minTrustForInstantAward: String(rules.minTrustForInstantAward),
    trustDecayPerFlag: String(rules.trustDecayPerFlag),
    trustGainOnApprove: String(rules.trustGainOnApprove),
    battleCpTrack: rules.battle.cpTrack.join(", "),
    battleCpCap: String(rules.battle.cpCap),
    battleDeckSize: String(rules.battle.deckSize),
    battleOpeningHandSize: String(rules.battle.openingHandSize),
    battleMaxCopiesPerCard: String(rules.battle.maxCopiesPerCard),
    battleInfluenceToCapture: String(rules.battle.influenceToCapture),
    battleLocationsToWin: String(rules.battle.locationsToWin),
    battleMerchantRefundCp: String(rules.battle.merchantRefundCp),
    battleMonarchAuraAttack: String(rules.battle.monarchAuraAttack),
    battleMaxEventsPerTurn: String(rules.battle.maxEventsPerTurn),
  };
}

function parseNumberList(
  text: string,
  options: { min: number; max: number; label: string },
): number[] {
  const values = text
    .split(/[,;\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(Number);

  if (values.some((value) => !Number.isInteger(value) || value < options.min || value > options.max)) {
    throw new Error(`${options.label} must be whole numbers between ${options.min} and ${options.max}.`);
  }

  return values;
}

function parseMilestones(text: string): number[] {
  return parseNumberList(text, { min: 1, max: 100, label: "Milestones" });
}

function parseCpTrack(text: string): number[] {
  return parseNumberList(text, { min: 1, max: 1000, label: "CP track values" });
}

function formToPayload(form: FormState) {
  return {
    milestones: parseMilestones(form.milestonesText),
    pointsPerMilestone: Number(form.pointsPerMilestone),
    dailyPointCap: Number(form.dailyPointCap),
    weeklyPointCap: Number(form.weeklyPointCap),
    packGeneralMultiplier: Number(form.packGeneralMultiplier),
    minSecondsPerPage: Number(form.minSecondsPerPage),
    softSecondsPerPage: Number(form.softSecondsPerPage),
    maxWpm: Number(form.maxWpm),
    softWpm: Number(form.softWpm),
    bulkPageJumpThreshold: Number(form.bulkPageJumpThreshold),
    minTrustForInstantAward: Number(form.minTrustForInstantAward),
    trustDecayPerFlag: Number(form.trustDecayPerFlag),
    trustGainOnApprove: Number(form.trustGainOnApprove),
    battleCpTrack: parseCpTrack(form.battleCpTrack),
    battleCpCap: Number(form.battleCpCap),
    battleDeckSize: Number(form.battleDeckSize),
    battleOpeningHandSize: Number(form.battleOpeningHandSize),
    battleMaxCopiesPerCard: Number(form.battleMaxCopiesPerCard),
    battleInfluenceToCapture: Number(form.battleInfluenceToCapture),
    battleLocationsToWin: Number(form.battleLocationsToWin),
    battleMerchantRefundCp: Number(form.battleMerchantRefundCp),
    battleMonarchAuraAttack: Number(form.battleMonarchAuraAttack),
    battleMaxEventsPerTurn: Number(form.battleMaxEventsPerTurn),
  };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-neutral-200">{label}</span>
      {hint ? <span className="block text-xs text-neutral-500">{hint}</span> : null}
      {children}
    </label>
  );
}

function inputClassName() {
  return "w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-600";
}

export default function AdminRulesPage() {
  const queryClient = useQueryClient();
  const { data: rules, isLoading } = useQuery({ queryKey: ["admin-rules"], queryFn: fetchRules });

  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (rules) setForm(rulesToForm(rules));
  }, [rules]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error("Form not ready");
      let payload;
      try {
        payload = formToPayload(form);
      } catch (err) {
        throw err instanceof Error ? err : new Error("Invalid form values");
      }

      const res = await fetch("/api/admin/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save rules");
      }
      return res.json() as Promise<GameRules>;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin-rules"], updated);
      setForm(rulesToForm(updated));
      setError(null);
      setSavedMessage("Rules saved.");
      setTimeout(() => setSavedMessage(null), 3000);
    },
    onError: (err: Error) => {
      setSavedMessage(null);
      setError(err.message);
    },
  });

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setError(null);
    setSavedMessage(null);
  }

  if (isLoading || !form || !rules) {
    return <p className="text-sm text-neutral-500">Loading rules…</p>;
  }

  const milestoneCount = (() => {
    try {
      return parseMilestones(form.milestonesText).length;
    } catch {
      return 0;
    }
  })();

  const maxPerBook = milestoneCount * Number(form.pointsPerMilestone || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale size={20} className="text-amber-500" />
            <h1 className="text-2xl font-semibold text-neutral-100">Game Rules</h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Configure how players earn points while reading, session limits, anti-cheat thresholds,
            and pack pricing multipliers.
          </p>
          {rules.updatedAt ? (
            <p className="mt-1 text-xs text-neutral-600">
              Last updated {new Date(rules.updatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (rules) setForm(rulesToForm(rules));
              setError(null);
              setSavedMessage(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-700 px-3 py-2 text-sm font-medium text-amber-50 hover:bg-amber-600 disabled:opacity-60"
          >
            <Save size={14} />
            {saveMutation.isPending ? "Saving…" : "Save rules"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}
      {savedMessage ? (
        <div className="rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
          {savedMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
          <div>
            <h2 className="text-lg font-medium text-neutral-100">Reading milestones</h2>
            <p className="text-sm text-neutral-500">
              Points awarded when a book reaches each completion percentage. Applies to manual
              progress updates and finalized reading sessions.
            </p>
          </div>

          <Field
            label="Milestone percentages"
            hint="Comma-separated values, unique and ascending (e.g. 25, 50, 75, 100)."
          >
            <input
              className={inputClassName()}
              value={form.milestonesText}
              onChange={(event) => updateField("milestonesText", event.target.value)}
            />
          </Field>

          <Field label="Points per milestone">
            <input
              type="number"
              min={1}
              className={inputClassName()}
              value={form.pointsPerMilestone}
              onChange={(event) => updateField("pointsPerMilestone", event.target.value)}
            />
          </Field>

          <p className="text-xs text-neutral-500">
            Max earn per book: up to {Number.isFinite(maxPerBook) ? maxPerBook : "—"} points (
            {milestoneCount} milestones × {form.pointsPerMilestone || 0} pts).
          </p>
        </section>

        <section className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
          <div>
            <h2 className="text-lg font-medium text-neutral-100">Daily & weekly caps</h2>
            <p className="text-sm text-neutral-500">
              Limits how many points a player can earn from reading per UTC day and week. Overflow
              from fast sessions is held for verification instead of being lost.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Daily point cap">
              <input
                type="number"
                min={1}
                className={inputClassName()}
                value={form.dailyPointCap}
                onChange={(event) => updateField("dailyPointCap", event.target.value)}
              />
            </Field>
            <Field label="Weekly point cap">
              <input
                type="number"
                min={1}
                className={inputClassName()}
                value={form.weeklyPointCap}
                onChange={(event) => updateField("weeklyPointCap", event.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
          <div>
            <h2 className="text-lg font-medium text-neutral-100">Reading velocity</h2>
            <p className="text-sm text-neutral-500">
              Sessions faster than these thresholds are flagged or earn diminished points. Below the
              soft limits, a velocity multiplier reduces awards proportionally.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Min seconds per page" hint="Hard floor — triggers verification queue.">
              <input
                type="number"
                min={1}
                className={inputClassName()}
                value={form.minSecondsPerPage}
                onChange={(event) => updateField("minSecondsPerPage", event.target.value)}
              />
            </Field>
            <Field label="Soft seconds per page" hint="Below this, points are diminished.">
              <input
                type="number"
                min={1}
                className={inputClassName()}
                value={form.softSecondsPerPage}
                onChange={(event) => updateField("softSecondsPerPage", event.target.value)}
              />
            </Field>
            <Field label="Max WPM" hint="Hard ceiling — triggers verification queue.">
              <input
                type="number"
                min={50}
                className={inputClassName()}
                value={form.maxWpm}
                onChange={(event) => updateField("maxWpm", event.target.value)}
              />
            </Field>
            <Field label="Soft WPM" hint="Above this, points are diminished.">
              <input
                type="number"
                min={50}
                className={inputClassName()}
                value={form.softWpm}
                onChange={(event) => updateField("softWpm", event.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
          <div>
            <h2 className="text-lg font-medium text-neutral-100">Trust & progress guards</h2>
            <p className="text-sm text-neutral-500">
              Trust score controls whether session points are awarded instantly or held for admin
              review. Bulk page jumps without a session are blocked.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Min trust for instant award"
              hint="Below this, session points go to the verification queue."
            >
              <input
                type="number"
                min={0}
                max={100}
                className={inputClassName()}
                value={form.minTrustForInstantAward}
                onChange={(event) => updateField("minTrustForInstantAward", event.target.value)}
              />
            </Field>
            <Field label="Trust decay per flag" hint="Subtracted when a session is flagged.">
              <input
                type="number"
                min={0}
                max={100}
                className={inputClassName()}
                value={form.trustDecayPerFlag}
                onChange={(event) => updateField("trustDecayPerFlag", event.target.value)}
              />
            </Field>
            <Field
              label="Trust gain on approve"
              hint="Added when an admin approves a queued session."
            >
              <input
                type="number"
                min={0}
                max={100}
                className={inputClassName()}
                value={form.trustGainOnApprove}
                onChange={(event) => updateField("trustGainOnApprove", event.target.value)}
              />
            </Field>
            <Field
              label="Bulk page jump threshold"
              hint="Manual progress jumps of this many pages or more require a reading session."
            >
              <input
                type="number"
                min={1}
                className={inputClassName()}
                value={form.bulkPageJumpThreshold}
                onChange={(event) => updateField("bulkPageJumpThreshold", event.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 lg:col-span-2">
          <div>
            <h2 className="text-lg font-medium text-neutral-100">Pack pricing</h2>
            <p className="text-sm text-neutral-500">
              Era-specific packs can be bought with general points at a markup. This does not award
              points — it affects spend pricing only.
            </p>
          </div>

          <div className="max-w-xs">
            <Field
              label="General-point multiplier"
              hint="General price = ceil(era price × multiplier) for era packs."
            >
              <input
                type="number"
                min={1}
                step={0.01}
                className={inputClassName()}
                value={form.packGeneralMultiplier}
                onChange={(event) => updateField("packGeneralMultiplier", event.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 lg:col-span-2">
          <div>
            <h2 className="text-lg font-medium text-neutral-100">Chronos TCG battle</h2>
            <p className="text-sm text-neutral-500">
              Tunables for the Play vs AI mode: CP track, deck size, influence capture, and archetype passives.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="CP track" hint="Comma-separated CP per turn (e.g. 50, 100, 150, 200, 300).">
              <input className={inputClassName()} value={form.battleCpTrack} onChange={(e) => updateField("battleCpTrack", e.target.value)} />
            </Field>
            <Field label="CP cap">
              <input type="number" className={inputClassName()} value={form.battleCpCap} onChange={(e) => updateField("battleCpCap", e.target.value)} />
            </Field>
            <Field label="Deck size">
              <input type="number" className={inputClassName()} value={form.battleDeckSize} onChange={(e) => updateField("battleDeckSize", e.target.value)} />
            </Field>
            <Field label="Opening hand">
              <input type="number" className={inputClassName()} value={form.battleOpeningHandSize} onChange={(e) => updateField("battleOpeningHandSize", e.target.value)} />
            </Field>
            <Field label="Max copies per card">
              <input type="number" className={inputClassName()} value={form.battleMaxCopiesPerCard} onChange={(e) => updateField("battleMaxCopiesPerCard", e.target.value)} />
            </Field>
            <Field label="Influence to capture">
              <input type="number" className={inputClassName()} value={form.battleInfluenceToCapture} onChange={(e) => updateField("battleInfluenceToCapture", e.target.value)} />
            </Field>
            <Field label="Locations to win">
              <input type="number" className={inputClassName()} value={form.battleLocationsToWin} onChange={(e) => updateField("battleLocationsToWin", e.target.value)} />
            </Field>
            <Field label="Merchant CP refund">
              <input type="number" className={inputClassName()} value={form.battleMerchantRefundCp} onChange={(e) => updateField("battleMerchantRefundCp", e.target.value)} />
            </Field>
            <Field label="Monarch aura ATK">
              <input type="number" className={inputClassName()} value={form.battleMonarchAuraAttack} onChange={(e) => updateField("battleMonarchAuraAttack", e.target.value)} />
            </Field>
            <Field label="Max events per turn">
              <input type="number" className={inputClassName()} value={form.battleMaxEventsPerTurn} onChange={(e) => updateField("battleMaxEventsPerTurn", e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 lg:col-span-2">
          <h2 className="text-lg font-medium text-neutral-100">Other earn paths (read-only)</h2>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li>
              <span className="text-neutral-300">Verification approval</span> — credits the held
              session amount from the queue entry, not a fixed rule value.
            </li>
            <li>
              <span className="text-neutral-300">Admin manual adjustment</span> — set a user&apos;s
              balance on the Users admin page.
            </li>
            <li>
              <span className="text-neutral-300">Campaign milestones</span> — unlock nodes when
              reading milestones are hit; no separate point grant.
            </li>
            <li>
              <span className="text-neutral-300">Card unlock via points</span> — disabled for
              players (admin-only card grants).
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
