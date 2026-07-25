"use client";

import { useEffect, useMemo, useState } from "react";
import type { Era } from "@/lib/types";
import {
  filterErasByRegion,
  formatEraRegionLabel,
  getEraOptionValue,
  getEraRegions,
  normalizeEraRegion,
  regionForEraValue,
  sortErasChronologically,
  type EraRegionKey,
} from "@/lib/client/era-regions";

export const REGION_ERA_FILTER_SELECT_CLASS =
  "rounded border border-border-strong bg-surface px-2 py-1.5 text-sm text-foreground";

type RegionEraFiltersProps = {
  eras: Era[] | undefined;
  region: EraRegionKey;
  onRegionChange: (region: EraRegionKey) => void;
  eraValue: string;
  onEraChange: (value: string) => void;
  /** When `"slug"`, era option values are era slugs (import forms). Default `"id"`. */
  valueKey?: "id" | "slug";
  allRegionsLabel?: string;
  allErasLabel?: string;
  showAllRegions?: boolean;
  selectClassName?: string;
  regionAriaLabel?: string;
  eraAriaLabel?: string;
  disabled?: boolean;
};

export function RegionEraFilters({
  eras,
  region,
  onRegionChange,
  eraValue,
  onEraChange,
  valueKey = "id",
  allRegionsLabel = "All regions",
  allErasLabel = "All eras",
  showAllRegions = true,
  selectClassName = REGION_ERA_FILTER_SELECT_CLASS,
  regionAriaLabel = "Filter by region",
  eraAriaLabel = "Filter by era",
  disabled = false,
}: RegionEraFiltersProps) {
  const regions = useMemo(() => getEraRegions(eras ?? []), [eras]);
  const filteredEras = useMemo(
    () => sortErasChronologically(filterErasByRegion(eras ?? [], region)),
    [eras, region],
  );

  function handleRegionChange(next: EraRegionKey) {
    onRegionChange(next);
    if (
      eraValue &&
      !filterErasByRegion(eras ?? [], next).some((era) => getEraOptionValue(era, valueKey) === eraValue)
    ) {
      onEraChange("");
    }
  }

  return (
    <>
      <select
        value={region}
        onChange={(e) => handleRegionChange(e.target.value)}
        className={selectClassName}
        aria-label={regionAriaLabel}
        disabled={disabled}
      >
        {showAllRegions ? <option value="">{allRegionsLabel}</option> : null}
        {regions.map((entry) => (
          <option key={entry || "__unset__"} value={entry}>
            {formatEraRegionLabel(entry)}
          </option>
        ))}
      </select>
      <select
        value={eraValue}
        onChange={(e) => onEraChange(e.target.value)}
        className={selectClassName}
        aria-label={eraAriaLabel}
        disabled={disabled}
      >
        <option value="">{allErasLabel}</option>
        {filteredEras.map((era) => (
          <option key={era.id} value={getEraOptionValue(era, valueKey)}>
            {era.name}
          </option>
        ))}
      </select>
    </>
  );
}

type RegionEraFieldProps = {
  eras: Era[] | undefined;
  eraValue: string;
  onEraChange: (value: string) => void;
  valueKey?: "id" | "slug";
  requireRegion?: boolean;
  allowEmptyEra?: boolean;
  emptyEraLabel?: string;
  selectClassName?: string;
  disabled?: boolean;
  onRegionChange?: (region: EraRegionKey) => void;
  className?: string;
};

export function RegionEraField({
  eras,
  eraValue,
  onEraChange,
  valueKey = "id",
  requireRegion = false,
  allowEmptyEra = false,
  emptyEraLabel = "— None —",
  selectClassName = "rounded border border-border-strong bg-background px-2 py-1.5",
  disabled = false,
  onRegionChange,
  className,
}: RegionEraFieldProps) {
  const regions = useMemo(() => getEraRegions(eras ?? []), [eras]);
  const [region, setRegion] = useState<EraRegionKey>(() =>
    regionForEraValue(eras ?? [], eraValue, valueKey),
  );

  useEffect(() => {
    if (!eraValue) return;
    const next = regionForEraValue(eras ?? [], eraValue, valueKey);
    if (next !== region) setRegion(next);
  }, [eraValue, eras, valueKey, region]);

  const filteredEras = useMemo(() => {
    const pool =
      requireRegion || region ? filterErasByRegion(eras ?? [], region) : (eras ?? []);
    return sortErasChronologically(pool);
  }, [eras, region, requireRegion]);

  function handleRegionChange(next: EraRegionKey) {
    setRegion(next);
    onRegionChange?.(next);
    if (
      eraValue &&
      !filterErasByRegion(eras ?? [], next).some((era) => getEraOptionValue(era, valueKey) === eraValue)
    ) {
      onEraChange("");
    }
  }

  const eraDisabled = disabled || (requireRegion && !region);

  return (
    <div className={className ?? "contents"}>
      <label className="flex flex-col gap-1 text-sm">
        Region
        <select
          value={region}
          disabled={disabled}
          onChange={(e) => handleRegionChange(normalizeEraRegion(e.target.value))}
          className={selectClassName}
          required={requireRegion}
        >
          {!requireRegion ? <option value="">All regions</option> : null}
          {requireRegion && !region ? (
            <option value="" disabled>
              Select region…
            </option>
          ) : null}
          {regions.map((entry) => (
            <option key={entry || "__unset__"} value={entry}>
              {formatEraRegionLabel(entry)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Era
        <select
          value={eraValue}
          disabled={eraDisabled}
          required={!allowEmptyEra}
          onChange={(e) => onEraChange(e.target.value)}
          className={selectClassName}
        >
          {allowEmptyEra ? <option value="">{emptyEraLabel}</option> : null}
          {!allowEmptyEra && requireRegion && !region ? (
            <option value="" disabled>
              Select a region first
            </option>
          ) : null}
          {!allowEmptyEra && (!requireRegion || region) && !eraValue ? (
            <option value="" disabled>
              Select an era
            </option>
          ) : null}
          {filteredEras.map((era) => (
            <option key={era.id} value={getEraOptionValue(era, valueKey)}>
              {era.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** Keeps region + era filter state in sync (list pages). */
export function useRegionEraFilterState(initialEraValue = "") {
  const [region, setRegion] = useState<EraRegionKey>("");
  const [eraValue, setEraValue] = useState(initialEraValue);
  return { region, setRegion, eraValue, setEraValue };
}
