"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Wand2, X } from "lucide-react";
import {
  ABILITY_TRIGGER_LABELS,
  type AbilityEffect,
  type AbilityTrigger,
} from "@/lib/battle";
import {
  defaultTriggerForEffect,
  suggestAbilityFields,
  suggestAbilityValue,
  suggestArchetypeAbilityFields,
  suggestLocationBuffFields,
  validEffectsForCardType,
  validTriggersForEffect,
} from "@/lib/battle/suggest-ability";
import type { CardType } from "@/lib/battle/types";
import type { Archetype, Rarity } from "@/lib/sprite/generateSprite";

export type AbilityBuilderValue = {
  abilityName: string;
  abilityEffect: "" | AbilityEffect;
  abilityValue: string;
  abilityTrigger: "" | AbilityTrigger;
};

type AbilityBuilderProps = {
  cardType: CardType;
  rarity: Rarity;
  archetype: Archetype | "" | null;
  value: AbilityBuilderValue;
  onChange: (patch: Partial<AbilityBuilderValue>) => void;
};

function toFormValue(value: number | null): string {
  return value == null ? "" : String(value);
}

export function AbilityBuilder({
  cardType,
  rarity,
  archetype,
  value,
  onChange,
}: AbilityBuilderProps) {
  const resolvedArchetype = (archetype || null) as Archetype | null;
  const availableEffects = useMemo(() => validEffectsForCardType(cardType), [cardType]);

  const selectedEffect = value.abilityEffect || null;
  const availableTriggers = useMemo(
    () => (selectedEffect ? validTriggersForEffect(selectedEffect, cardType) : []),
    [selectedEffect, cardType],
  );

  const suggestion = useMemo(() => {
    if (!selectedEffect) return null;
    return suggestAbilityFields({
      effect: selectedEffect,
      rarity,
      cardType,
      archetype: resolvedArchetype,
    });
  }, [selectedEffect, rarity, cardType, resolvedArchetype]);

  const valueNote = useMemo(() => {
    if (!selectedEffect) return null;
    if (value.abilityValue.trim()) {
      const numeric = Number(value.abilityValue);
      if (Number.isFinite(numeric)) {
        return suggestAbilityValue(selectedEffect, rarity, cardType, resolvedArchetype).note;
      }
    }
    return suggestion?.valueNote ?? null;
  }, [selectedEffect, value.abilityValue, rarity, cardType, resolvedArchetype, suggestion]);

  function applySuggestion(fields: {
    abilityName: string;
    abilityEffect: AbilityEffect;
    abilityValue: number | null;
    abilityTrigger: AbilityTrigger | null;
  }) {
    onChange({
      abilityName: fields.abilityName,
      abilityEffect: fields.abilityEffect,
      abilityValue: toFormValue(fields.abilityValue),
      abilityTrigger: fields.abilityTrigger ?? "",
    });
  }

  function selectEffect(effect: AbilityEffect) {
    applySuggestion(
      suggestAbilityFields({
        effect,
        rarity,
        cardType,
        archetype: resolvedArchetype,
      }),
    );
  }

  function clearAbility() {
    onChange({
      abilityName: "",
      abilityEffect: "",
      abilityValue: "",
      abilityTrigger: "",
    });
  }

  return (
    <div className="col-span-full space-y-3 rounded-xl border border-accent/30 bg-accent/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Wand2 size={14} className="text-gold" />
            Ability builder
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            Pick a template — name, value, and trigger are suggested from rarity math. Fine-tune
            below.
          </p>
        </div>
        <Link
          href="/admin/abilities"
          className="text-xs text-gold hover:underline"
        >
          Full catalog →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {cardType === "location" ? (
          <button
            type="button"
            onClick={() => applySuggestion(suggestLocationBuffFields(rarity))}
            className="rounded-md border border-border-strong bg-surface px-2.5 py-1 text-xs text-foreground hover:bg-surface-raised"
          >
            Suggest {rarity} location buff
          </button>
        ) : null}
        {cardType !== "event" && cardType !== "location" && resolvedArchetype ? (
          <button
            type="button"
            onClick={() => {
              const fields = suggestArchetypeAbilityFields(rarity, resolvedArchetype);
              if (fields) applySuggestion(fields);
            }}
            className="rounded-md border border-border-strong bg-surface px-2.5 py-1 text-xs text-foreground hover:bg-surface-raised"
          >
            Use {resolvedArchetype} default
          </button>
        ) : null}
        {selectedEffect && suggestion ? (
          <button
            type="button"
            onClick={() => applySuggestion(suggestion)}
            className="rounded-md border border-accent/45 bg-accent/10 px-2.5 py-1 text-xs text-foreground hover:bg-accent/15"
          >
            Recalculate for {rarity}
          </button>
        ) : null}
        {value.abilityEffect ? (
          <button
            type="button"
            onClick={clearAbility}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-foreground"
          >
            <X size={12} />
            Clear
          </button>
        ) : null}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Effect template
        <select
          value={value.abilityEffect}
          onChange={(event) => {
            const next = event.target.value as AbilityEffect | "";
            if (!next) {
              clearAbility();
              return;
            }
            selectEffect(next);
          }}
          className="rounded border border-border-strong bg-background px-2 py-1.5"
        >
          <option value="">— None —</option>
          {availableEffects.map((effect) => (
            <option key={effect.id} value={effect.id}>
              {effect.label}
              {effect.eventTemplate ? ` · ${effect.eventTemplate}` : ""}
            </option>
          ))}
        </select>
        {selectedEffect ? (
          <span className="text-xs text-muted">
            {availableEffects.find((effect) => effect.id === selectedEffect)?.summary}
          </span>
        ) : null}
      </label>

      {selectedEffect ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Ability name
            <input
              value={value.abilityName}
              onChange={(event) => onChange({ abilityName: event.target.value })}
              placeholder="Display name on the card"
              className="rounded border border-border-strong bg-background px-2 py-1.5"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Ability value
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={value.abilityValue}
                onChange={(event) => onChange({ abilityValue: event.target.value })}
                disabled={suggestion?.abilityValue == null && !value.abilityValue}
                placeholder={suggestion?.abilityValue == null ? "Not used" : "Value"}
                className="min-w-0 flex-1 rounded border border-border-strong bg-background px-2 py-1.5 disabled:opacity-50"
              />
              {suggestion && suggestion.abilityValue != null ? (
                <button
                  type="button"
                  onClick={() =>
                    onChange({ abilityValue: toFormValue(suggestion.abilityValue) })
                  }
                  className="shrink-0 rounded border border-accent/40 px-2 text-xs text-gold-bright hover:bg-accent/10"
                  title={suggestion.valueNote}
                >
                  Use {suggestion.abilityValue}
                </button>
              ) : null}
            </div>
            {valueNote ? <span className="text-xs text-muted">{valueNote}</span> : null}
          </label>

          {availableTriggers.length > 0 ? (
            <label className="flex flex-col gap-1 text-sm">
              Trigger
              <select
                value={value.abilityTrigger}
                onChange={(event) =>
                  onChange({
                    abilityTrigger: event.target.value as AbilityBuilderValue["abilityTrigger"],
                  })
                }
                className="rounded border border-border-strong bg-background px-2 py-1.5"
              >
                <option value="">— Passive / none —</option>
                {availableTriggers.map((trigger) => (
                  <option key={trigger} value={trigger}>
                    {ABILITY_TRIGGER_LABELS[trigger]}
                  </option>
                ))}
              </select>
              {availableTriggers.length > 0 && !value.abilityTrigger ? (
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      abilityTrigger:
                        defaultTriggerForEffect(selectedEffect, cardType) ?? "",
                    })
                  }
                  className="text-left text-xs text-gold hover:underline"
                >
                  Suggest{" "}
                  {defaultTriggerForEffect(selectedEffect, cardType)
                    ? ABILITY_TRIGGER_LABELS[
                        defaultTriggerForEffect(selectedEffect, cardType)!
                      ]
                    : "trigger"}
                </button>
              ) : null}
            </label>
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              {cardType === "event"
                ? "Events resolve when played — no trigger."
                : cardType === "location"
                  ? "Locations use a lane buff — no trigger."
                  : "No trigger wired for this effect."}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted">
          Choose an effect template to configure this card&apos;s ability.
        </p>
      )}
    </div>
  );
}
