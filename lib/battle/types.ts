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
  | "draw_card";

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
};

export type BoardUnit = {
  instanceId: string;
  characterId: number;
  name: string;
  owner: PlayerId;
  cardType: CardType;
  baseAttack: number;
  baseDefense: number;
  currentDefense: number;
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
  eraSynergyBonus: number;
  tempAttackBonus: number;
  tempDefenseBonus: number;
  summoningSickness: boolean;
  deployedTurn: number;
  cannotAttack: boolean;
};

export type Lane = {
  location: CardSnapshot | null;
  playerInfluence: number;
  aiInfluence: number;
  playerUnits: BoardUnit[];
  aiUnits: BoardUnit[];
};

export type PlayerBattleState = {
  cp: number;
  cpGrantedThisTurn: number;
  deck: CardSnapshot[];
  hand: CardSnapshot[];
  discard: CardSnapshot[];
  capturedLocations: number;
  eventsPlayedThisTurn: number;
  deployCostReduction: number;
  opponentInfluenceBlocked: boolean;
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
  maxEventsPerTurn: number;
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
  type: "unification_move";
  laneIndex: number;
  unitInstanceId: string;
  fromLaneIndex: number;
};

export type PlayLocationAction = {
  type: "play_location";
  handIndex: number;
  laneIndex: number;
};

export type RedrawOpeningHandAction = { type: "redraw_opening_hand" };

export type EndPhaseAction = { type: "end_phase" };

export type BattleAction =
  | DeployUnitAction
  | PlayEventAction
  | ResolveChoiceAction
  | AttackAction
  | UnificationAction
  | PlayLocationAction
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
    eventsPlayedThisTurn: 0,
    deployCostReduction: 0,
    opponentInfluenceBlocked: false,
  };
}
