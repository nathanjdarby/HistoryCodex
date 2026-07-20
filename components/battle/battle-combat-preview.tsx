"use client";

import type { AttackPreview, EstablishInfluencePreview } from "@/lib/battle/preview";

export function AttackPreviewPanel({ preview }: { preview: AttackPreview }) {
  return (
    <ul className="space-y-1.5 text-sm text-neutral-300">
      <li>
        Your attack: <span className="text-sky-300">{preview.attackerAtk} ATK</span>
      </li>
      <li>
        Enemy counter: <span className="text-red-300">{preview.defenderAtk} ATK</span>
      </li>
      <li>
        You remain:{" "}
        <span className={preview.attackerDestroyed ? "text-red-400" : "text-emerald-300"}>
          {preview.attackerRemaining} DEF
          {preview.attackerDestroyed ? " (destroyed)" : ""}
        </span>
      </li>
      <li>
        Enemy remains:{" "}
        <span className={preview.defenderDestroyed ? "text-emerald-300" : "text-neutral-200"}>
          {preview.defenderRemaining} DEF
          {preview.defenderDestroyed ? " (destroyed)" : ""}
        </span>
      </li>
      {preview.monarchAuraApplied > 0 ? (
        <li className="text-xs text-amber-200/90">Monarch aura: +{preview.monarchAuraApplied} ATK</li>
      ) : null}
      {preview.giantSlayerApplied ? (
        <li className="text-xs text-amber-200/90">Giant Slayer: attack doubled vs high rarity</li>
      ) : null}
      {preview.warriorMustTargetFirst ? (
        <li className="text-xs text-neutral-500">Warriors must be targeted first in this lane.</li>
      ) : null}
    </ul>
  );
}

export function EstablishInfluencePreviewPanel({ preview }: { preview: EstablishInfluencePreview }) {
  return (
    <ul className="space-y-1.5 text-sm text-neutral-300">
      <li>
        Commit <span className="text-sky-300">{preview.unitName}</span> to gain Influence.
      </li>
      <li>
        Influence: {preview.currentInfluence} → {preview.resultingInfluence}
        {preview.willCapture ? (
          <span className="ml-1 font-medium text-amber-300">(captures this Location!)</span>
        ) : null}
      </li>
      <li className="text-xs text-neutral-500">This unit cannot attack during the Campaign phase.</li>
    </ul>
  );
}
