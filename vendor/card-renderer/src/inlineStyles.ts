import type { CSSProperties } from "react";

/** Parse slotStyle / textStyle / etc. from layout instance overrides. */
export function configInlineStyle(raw: unknown): CSSProperties | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "number") out[key] = String(value);
    else if (typeof value === "string") out[key] = value;
  }
  return Object.keys(out).length > 0 ? (out as CSSProperties) : undefined;
}

export function mergeInlineStyles(
  base?: CSSProperties,
  override?: CSSProperties
): CSSProperties | undefined {
  if (!base && !override) return undefined;
  return { ...(base || {}), ...(override || {}) };
}
