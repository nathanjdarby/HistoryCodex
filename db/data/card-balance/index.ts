import type { CardBalanceDef } from "@/lib/server/card-balance";
import { generateEraCardBalance } from "@/lib/server/generate-era-card-balance";
import { ANGLO_SAXON_CARD_BALANCE } from "./anglo-saxons";
import { ANGLO_SAXON_EVENT_BALANCE } from "./anglo-saxon-events";
import { FIRST_KING_CARD_BALANCE } from "./first-king";
import { GLOBAL_EVENT_BALANCE } from "./global-events";
import { NAMED_ERA_CARD_BALANCE } from "./named-era-cards";
import { PLANTAGENETS_CARD_BALANCE } from "./plantagenets";
import { WAGER_CARD_BALANCE } from "./wager";

const EXPLICIT_BALANCE: Record<string, CardBalanceDef> = {
  ...GLOBAL_EVENT_BALANCE,
  ...ANGLO_SAXON_EVENT_BALANCE,
  ...NAMED_ERA_CARD_BALANCE,
  ...ANGLO_SAXON_CARD_BALANCE,
  ...FIRST_KING_CARD_BALANCE,
  ...PLANTAGENETS_CARD_BALANCE,
  ...WAGER_CARD_BALANCE,
};

export function resolveCardBalance(params: {
  seed: string;
  name: string;
  eraName: string;
}): CardBalanceDef | null {
  return (
    EXPLICIT_BALANCE[params.seed] ??
    generateEraCardBalance(params) ??
    null
  );
}

export const CATALOG_BOOK_CARD_BALANCE = EXPLICIT_BALANCE;

export {
  ANGLO_SAXON_CARD_BALANCE,
  ANGLO_SAXON_EVENT_BALANCE,
  FIRST_KING_CARD_BALANCE,
  GLOBAL_EVENT_BALANCE,
  NAMED_ERA_CARD_BALANCE,
  PLANTAGENETS_CARD_BALANCE,
  WAGER_CARD_BALANCE,
};
