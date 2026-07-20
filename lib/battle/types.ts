export type PlayerId = "player" | "ai";

export type Phase = "opening" | "chronos" | "logistics" | "campaign" | "consolidation";

export type CardType = "character" | "unit" | "event" | "location";

export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

export type AbilityTrigger = "deploy" | "death" | "campaign_start";

export type AbilityEffect =
  | "flat_attack"
  | "flat_defense"
  | "vs_higher_rarity_attack"
  | "vs_lower_rarity_attack"
  | "scry"
  | "search_deck"
  | "discard_to_hand"
  | "discard_draw"
  | "heal_unit"
  | "add_influence"
  | "remove_influence"
  | "cost_reduction"
  | "block_influence_gain"
  | "replace_location"
  | "draw_card"
  | "epidemic"
  | "treaty"
  | "revolution"
  | "trade_route"
  | "reform"
  | "forced_hand"
  | "forced_discard"
  | "exhaust_unit";

export type CardSnapshot = {
  characterId: number;
  name: string;
  cost: number;
  attack: number;
  defense: number;
  eraId: number;
  eraName: string;
  eraColorPrimary: string;
  eraColorSecondary: string;
  rarity: Rarity;
  archetype: string | null;
  cardType: CardType;
  abilityName: string | null;
  abilityEffect: AbilityEffect | null;
  abilityValue: number | null;
  abilityTrigger: AbilityTrigger | null;
  imageUrl: string | null;
  seed: string;
  flavorText: string | null;
  imageFocusX?: number;
  imageFocusY?: number;
  imageScale?: number;
  holographic?: boolean;
  /** Optional secondary value for multi-part event effects. */
  abilityValue2?: number | null;
};

export type BoardUnit = {
  instanceId: string;
  characterId: number;
  name: string;
  owner: PlayerId;
  cardType: CardType;
  baseAttack: number;
  baseDefense: number;
  /** Cached display value; use damageTaken + location for authoritative math. */
  currentDefense: number;
  damageTaken: number;
  eraId: number;
  eraName: string;
  eraColorPrimary: string;
  eraColorSecondary: string;
  rarity: Rarity;
  archetype: string | null;
  abilityName: string | null;
  abilityEffect: AbilityEffect | null;
  abilityValue: number | null;
  abilityTrigger: AbilityTrigger | null;
  imageUrl: string | null;
  seed: string;
  flavorText: string | null;
  cost: number;
  imageFocusX?: number;
  imageFocusY?: number;
  imageScale?: number;
  holographic?: boolean;
  /** @deprecated Use dynamic location bonus via unit-stats helpers. */
  eraSynergyBonus: number;
  locationDefBonus: number;
  sailorDefBonus: number;
  tempAttackBonus: number;
  tempDefenseBonus: number;
  summoningSickness: boolean;
  deployedTurn: number;
  cannotAttack: boolean;
  isCommitted: boolean;
  committedUntilTurn: number | null;
  cannotEstablishInfluence: boolean;
  auraSuppressed: boolean;
};

export type Lane = {
  location: CardSnapshot | null;
  /** Player who played the current active location. */
  locationOwner: PlayerId | null;
  playerInfluence: number;
  aiInfluence: number;
  playerUnits: BoardUnit[];
  aiUnits: BoardUnit[];
  /** Set when a capture was already resolved this turn on this lane. */
  captureResolvedThisTurn: boolean;
  attacksBlocked: boolean;
};

export type PlayerBattleState = {
  cp: number;
  cpGrantedThisTurn: number;
  deck: CardSnapshot[];
  hand: CardSnapshot[];
  discard: CardSnapshot[];
  capturedLocations: number;
  capturedLocationHistory: CardSnapshot[];
  eventsPlayedThisTurn: number;
  deployCostReduction: number;
  deployCostReductionUses: number;
  opponentInfluenceBlocked: boolean;
  hasEstablishedInfluenceThisTurn: boolean;
  hasUsedUnificationThisTurn: boolean;
  deckExhausted: boolean;
  failedChronosDraws: number;
  attacksBlockedThisTurn: boolean;
  monarchAuraSuppressed: boolean;
};

export type PendingChoiceKind =
  | "scry"
  | "search_deck"
  | "discard_to_hand"
  | "discard_draw";

export type PendingChoice = {
  kind: PendingChoiceKind;
  player: PlayerId;
  revealedCards: CardSnapshot[];
  laneIndex?: number;
  eventName: string;
  spentEventCard?: CardSnapshot;
};

export type MatchStatus = "active" | "won" | "lost";

export type MatchEvent = {
  type: string;
  message: string;
  at: number;
};

export type MatchState = {
  rngSeed: number;
  rngCounter: number;
  phase: Phase;
  activePlayer: PlayerId;
  turnNumber: number;
  player: PlayerBattleState;
  ai: PlayerBattleState;
  lanes: Lane[];
  locationDeck: CardSnapshot[];
  pendingLocation: CardSnapshot | null;
  pendingChoice: PendingChoice | null;
  log: MatchEvent[];
  winner: PlayerId | null;
  status: MatchStatus;
  pendingEvents: MatchEvent[];
  /** @deprecated Opening phase removed; kept for saved-match compat. */
  openingResolved?: boolean;
};

import type { DeckCompositionRules } from "@/lib/battle/deck-composition";

export type BattleRules = {
  cpTrack: number[];
  cpCap: number;
  deckSize: number;
  openingHandSize: number;
  maxCopiesPerCard: number;
  activeLaneCount: number;
  influenceToCapture: number;
  locationsToWin: number;
  /** @deprecated Prefer deckComposition.location */
  locationsInDeck: number;
  deckComposition: DeckCompositionRules;
  merchantRefundCp: number;
  monarchAuraAttack: number;
  monarchAuraStacking: boolean;
  maxEventsPerTurn: number;
  allowCpOverflow: boolean;
  leaderInfluenceBonus: number;
  leaderBonusStacks: boolean;
  scholarBonusDrawCap: number;
  maxEstablishInfluencePerTurn: number;
  failedChronosDrawsToLose: number;
};

export type DeployUnitAction = {
  type: "deploy_unit";
  handIndex: number;
  laneIndex: number;
};

export type PlayEventAction = {
  type: "play_event";
  handIndex: number;
  laneIndex?: number;
  targetInstanceId?: string;
};

export type ResolveChoiceAction = {
  type: "resolve_choice";
  selectedIndex?: number;
  topIndices?: number[];
};

export type AttackAction = {
  type: "attack";
  laneIndex: number;
  attackerInstanceId: string;
  defenderInstanceId: string;
};

export type UnificationAction = {
  type: "unification";
  laneIndex: number;
  monarchInstanceId: string;
  targetInstanceId: string;
  /** Legacy multi-lane movement. */
  fromLaneIndex?: number;
  unitInstanceId?: string;
};

/** @deprecated Use unification with monarchInstanceId/targetInstanceId. */
export type UnificationMoveAction = {
  type: "unification_move";
  laneIndex: number;
  unitInstanceId: string;
  fromLaneIndex: number;
};

export type PlayLocationAction = {
  type: "play_location";
  handIndex: number;
  laneIndex: number;
  confirmed?: boolean;
};

export type EstablishInfluenceAction = {
  type: "establish_influence";
  laneIndex: number;
  unitInstanceId: string;
};

export type RedrawOpeningHandAction = { type: "redraw_opening_hand" };

export type EndPhaseAction = { type: "end_phase" };

export type BattleAction =
  | DeployUnitAction
  | PlayEventAction
  | ResolveChoiceAction
  | AttackAction
  | UnificationAction
  | UnificationMoveAction
  | PlayLocationAction
  | EstablishInfluenceAction
  | RedrawOpeningHandAction
  | EndPhaseAction;

export type ActionResult = {
  state: MatchState;
  events: MatchEvent[];
  error?: string;
};

export function opponentOf(player: PlayerId): PlayerId {
  return player === "player" ? "ai" : "player";
}

export function playerState(state: MatchState, player: PlayerId): PlayerBattleState {
  return player === "player" ? state.player : state.ai;
}

export function setPlayerState(
  state: MatchState,
  player: PlayerId,
  next: PlayerBattleState,
): MatchState {
  return player === "player" ? { ...state, player: next } : { ...state, ai: next };
}

export function unitsInLane(lane: Lane, owner: PlayerId): BoardUnit[] {
  return owner === "player" ? lane.playerUnits : lane.aiUnits;
}

export function setUnitsInLane(lane: Lane, owner: PlayerId, units: BoardUnit[]): Lane {
  return owner === "player" ? { ...lane, playerUnits: units } : { ...lane, aiUnits: units };
}

export function influenceForLane(lane: Lane, owner: PlayerId): number {
  return owner === "player" ? lane.playerInfluence : lane.aiInfluence;
}

export function setInfluenceForLane(lane: Lane, owner: PlayerId, value: number): Lane {
  return owner === "player" ? { ...lane, playerInfluence: value } : { ...lane, aiInfluence: value };
}

export function defaultPlayerState(deck: CardSnapshot[]): PlayerBattleState {
  return {
    cp: 0,
    cpGrantedThisTurn: 0,
    deck,
    hand: [],
    discard: [],
    capturedLocations: 0,
    capturedLocationHistory: [],
    eventsPlayedThisTurn: 0,
    deployCostReduction: 0,
    deployCostReductionUses: 0,
    opponentInfluenceBlocked: false,
    hasEstablishedInfluenceThisTurn: false,
    hasUsedUnificationThisTurn: false,
    deckExhausted: false,
    failedChronosDraws: 0,
    attacksBlockedThisTurn: false,
    monarchAuraSuppressed: false,
  };
}

export function createEmptyLane(): Lane {
  return {
    location: null,
    locationOwner: null,
    playerInfluence: 0,
    aiInfluence: 0,
    playerUnits: [],
    aiUnits: [],
    captureResolvedThisTurn: false,
    attacksBlocked: false,
  };
}
