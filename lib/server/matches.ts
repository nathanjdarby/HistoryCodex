import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { applyAction, runAiTurn } from "@/lib/battle/reducer";
import { createMatchState } from "@/lib/battle/setup";
import { normalizeMatchState } from "@/lib/battle/state-normalize";
import type { BattleAction, CardSnapshot, MatchState } from "@/lib/battle/types";
import { getBattleRules } from "@/lib/server/battle-rules";
import {
  buildAiDeckFromCollection,
  buildMatchDecks,
  getUserDeck,
} from "@/lib/server/decks";

const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("redraw_opening_hand") }),
  z.object({ type: z.literal("end_phase") }),
  z.object({
    type: z.literal("play_location"),
    handIndex: z.number().int().min(0),
    laneIndex: z.number().int().min(0).max(0),
  }),
  z.object({
    type: z.literal("deploy_unit"),
    handIndex: z.number().int().min(0),
    laneIndex: z.number().int().min(0).max(0),
  }),
  z.object({
    type: z.literal("play_event"),
    handIndex: z.number().int().min(0),
    laneIndex: z.number().int().min(0).max(0).optional(),
    targetInstanceId: z.string().optional(),
  }),
  z.object({
    type: z.literal("attack"),
    laneIndex: z.number().int().min(0).max(0),
    attackerInstanceId: z.string(),
    defenderInstanceId: z.string(),
  }),
  z.object({
    type: z.literal("unification_move"),
    laneIndex: z.number().int().min(0).max(0),
    fromLaneIndex: z.number().int().min(0).max(0),
    unitInstanceId: z.string(),
  }),
  z.object({
    type: z.literal("resolve_choice"),
    selectedIndex: z.number().int().min(0).optional(),
    topIndices: z.array(z.number().int().min(0)).optional(),
  }),
]);

export type MatchSummary = {
  id: number;
  deckId: number;
  status: string;
  phase: string;
  activePlayer: string;
  turnNumber: number;
  winner: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ClientMatchState = {
  id: number;
  deckId: number;
  status: string;
  phase: string;
  activePlayer: string;
  turnNumber: number;
  winner: string | null;
  state: MatchState;
  legalActions: BattleAction[];
};

function parseState(json: string): MatchState {
  const state = JSON.parse(json) as MatchState;
  return normalizeMatchState(state);
}

function hiddenCard(index: number): CardSnapshot {
  return {
    characterId: -1,
    name: "Hidden",
    cost: 0,
    attack: 0,
    defense: 0,
    eraId: 0,
    eraName: "",
    eraColorPrimary: "#1a1510",
    eraColorSecondary: "#0f0d0a",
    rarity: "common",
    archetype: null,
    cardType: "character",
    abilityName: null,
    abilityEffect: null,
    abilityValue: null,
    abilityTrigger: null,
    imageUrl: null,
    seed: `hidden-${index}`,
    flavorText: null,
  };
}

function sanitizeForClient(state: MatchState): MatchState {
  return {
    ...state,
    ai: {
      ...state.ai,
      deck: state.ai.deck.map((_, i) => hiddenCard(i)),
      hand: state.ai.hand.map((_, i) => hiddenCard(i)),
    },
    pendingEvents: [],
  };
}

function persistState(matchId: number, state: MatchState) {
  return db
    .update(matches)
    .set({
      phase: state.phase,
      activePlayer: state.activePlayer,
      turnNumber: state.turnNumber,
      status: state.status,
      winner: state.winner,
      stateJson: JSON.stringify(state),
      updatedAt: new Date(),
    })
    .where(eq(matches.id, matchId));
}

export async function listMatches(userId: number): Promise<MatchSummary[]> {
  const rows = await db
    .select()
    .from(matches)
    .where(eq(matches.userId, userId))
    .orderBy(desc(matches.updatedAt))
    .limit(20);
  return rows.map((r) => ({
    id: r.id,
    deckId: r.deckId,
    status: r.status,
    phase: r.phase,
    activePlayer: r.activePlayer,
    turnNumber: r.turnNumber,
    winner: r.winner,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function createMatch(userId: number, deckId: number) {
  const deck = await getUserDeck(userId, deckId);
  if (!deck.valid) throw new ApiError(400, deck.validationErrors[0] ?? "Deck is invalid");

  const rules = await getBattleRules();
  const playerDeck = await buildMatchDecks(userId, deckId);
  const aiDeck = await buildAiDeckFromCollection(userId);

  const state = createMatchState({
    playerDeck,
    aiDeck,
    rngSeed: Date.now(),
    rules,
  });

  const [row] = await db
    .insert(matches)
    .values({
      userId,
      deckId,
      status: state.status,
      phase: state.phase,
      activePlayer: state.activePlayer,
      turnNumber: state.turnNumber,
      stateJson: JSON.stringify(state),
      winner: state.winner,
    })
    .returning();

  return getMatchForClient(userId, row!.id);
}

export async function getMatchForClient(userId: number, matchId: number): Promise<ClientMatchState> {
  const [row] = await db
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.userId, userId)));
  if (!row) throw new ApiError(404, "Match not found");

  const state = parseState(row.stateJson);
  const rules = await getBattleRules();
  const { getLegalActions } = await import("@/lib/battle/validators");

  const legalActions =
    state.status === "active" && state.activePlayer === "player"
      ? getLegalActions(state, "player", rules)
      : [];

  return {
    id: row.id,
    deckId: row.deckId,
    status: row.status,
    phase: row.phase,
    activePlayer: row.activePlayer,
    turnNumber: row.turnNumber,
    winner: row.winner,
    state: sanitizeForClient(state),
    legalActions,
  };
}

export async function applyMatchAction(userId: number, matchId: number, action: BattleAction) {
  const parsed = actionSchema.parse(action);
  const [row] = await db
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.userId, userId)));
  if (!row) throw new ApiError(404, "Match not found");
  if (row.status !== "active") throw new ApiError(400, "Match is finished");

  const rules = await getBattleRules();
  let state = parseState(row.stateJson);

  if (state.activePlayer !== "player") {
    throw new ApiError(400, "Wait for the AI turn to finish.");
  }

  const result = applyAction(state, "player", parsed, rules);
  if (result.error) throw new ApiError(400, result.error);
  state = result.state;

  if (state.status === "active" && state.activePlayer === "ai") {
    state = runAiTurn(state, rules);
  }

  await persistState(matchId, state);
  return getMatchForClient(userId, matchId);
}

export async function abandonMatch(userId: number, matchId: number) {
  const [row] = await db
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.userId, userId)));
  if (!row) throw new ApiError(404, "Match not found");

  await db
    .update(matches)
    .set({ status: "abandoned", updatedAt: new Date() })
    .where(eq(matches.id, matchId));
}
