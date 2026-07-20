import type { CardBalanceDef } from "@/lib/server/card-balance";
import { generateEraCardBalance } from "@/lib/server/generate-era-card-balance";
import { ANGLO_SAXON_CARD_BALANCE } from "./anglo-saxons";
import { ANGLO_SAXON_EVENT_BALANCE } from "./anglo-saxon-events";
import { FIRST_KING_CARD_BALANCE } from "./first-king";
import { GLOBAL_EVENT_BALANCE } from "./global-events";
import { NAMED_ERA_CARD_BALANCE } from "./named-era-cards";
import { PLANTAGENETS_CARD_BALANCE } from "./plantagenets";
import { SPQR_CARD_BALANCE } from "./spqr";
import { WAGER_CARD_BALANCE } from "./wager";
import { HISTORY_OF_BRITAIN_CARD_BALANCE } from "./history-of-britain";
import { FRANCE_FROM_GAUL_TO_DE_GAULLE_BALANCE } from "./france-from-gaul-to-de-gaulle";
import { HISTORY_OF_NORWAY_CARD_BALANCE } from "./history-of-norway";
import { HISTORY_OF_BRITAIN_VOLUME_2_BALANCE } from "./history-of-britain-volume-2";
import { HISTORY_OF_BRITAIN_VOLUME_3_BALANCE } from "./history-of-britain-volume-3";
import { IMPERIAL_POSSESSION_BALANCE } from "./imperial-possession";
import { IMPORTED_BOOKS_CARD_BALANCE } from "./imported-books-balance";

const EXPLICIT_BALANCE: Record<string, CardBalanceDef> = {
  ...GLOBAL_EVENT_BALANCE,
  ...ANGLO_SAXON_EVENT_BALANCE,
  ...NAMED_ERA_CARD_BALANCE,
  ...ANGLO_SAXON_CARD_BALANCE,
  ...FIRST_KING_CARD_BALANCE,
  ...PLANTAGENETS_CARD_BALANCE,
  ...SPQR_CARD_BALANCE,
  ...WAGER_CARD_BALANCE,
  ...HISTORY_OF_BRITAIN_CARD_BALANCE,
  ...FRANCE_FROM_GAUL_TO_DE_GAULLE_BALANCE,
  ...HISTORY_OF_NORWAY_CARD_BALANCE,
  ...HISTORY_OF_BRITAIN_VOLUME_2_BALANCE,
  ...HISTORY_OF_BRITAIN_VOLUME_3_BALANCE,
  ...IMPERIAL_POSSESSION_BALANCE,
  ...IMPORTED_BOOKS_CARD_BALANCE,
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
  SPQR_CARD_BALANCE,
  WAGER_CARD_BALANCE,
  HISTORY_OF_BRITAIN_CARD_BALANCE,
  FRANCE_FROM_GAUL_TO_DE_GAULLE_BALANCE,
  HISTORY_OF_NORWAY_CARD_BALANCE,
  HISTORY_OF_BRITAIN_VOLUME_2_BALANCE,
  HISTORY_OF_BRITAIN_VOLUME_3_BALANCE,
  IMPERIAL_POSSESSION_BALANCE,
  IMPORTED_BOOKS_CARD_BALANCE,
};
