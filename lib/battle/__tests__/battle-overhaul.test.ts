import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_BATTLE_RULES, applyCpGain, cpForTurn } from "@/lib/battle/constants";
import { createMatchState } from "@/lib/battle/setup";
import { applyAction } from "@/lib/battle/reducer";
import { buildAiDeckFromPool } from "@/lib/battle/ai-deck";
import { normalizeMatchState } from "@/lib/battle/state-normalize";
import { previewAttack, previewEstablishInfluence } from "@/lib/battle/preview";
import {
  cardToBoardUnit,
  effectiveMaxDefense,
  currentDefenseFromDamage,
  recalculateLaneEraSynergy,
} from "@/lib/battle/abilities";
import { gainInfluence } from "@/lib/battle/influence";
import { captureActiveLocation } from "@/lib/battle/capture";
import type { BoardUnit, CardSnapshot, Lane } from "@/lib/battle/types";
import { createEmptyLane } from "@/lib/battle/types";

function sampleCard(overrides: Partial<CardSnapshot> = {}): CardSnapshot {
  return {
    characterId: 1,
    name: "Swordsman",
    cost: 20,
    attack: 24,
    defense: 16,
    eraId: 1,
    eraName: "Roman Britain",
    eraColorPrimary: "#4a3728",
    eraColorSecondary: "#2a1f16",
    rarity: "common",
    archetype: "warrior",
    cardType: "character",
    abilityName: "Giant Slayer",
    abilityEffect: "vs_higher_rarity_attack",
    abilityValue: 6,
    abilityTrigger: null,
    imageUrl: null,
    seed: "test-1",
    flavorText: null,
    ...overrides,
  };
}

function sampleLocation(overrides: Partial<CardSnapshot> = {}): CardSnapshot {
  return sampleCard({
    characterId: 100,
    name: "Londinium",
    cardType: "location",
    attack: 0,
    defense: 0,
    archetype: null,
    abilityName: "Home Ground Advantage",
    abilityEffect: "flat_defense",
    abilityValue: 25,
    cost: 75,
    ...overrides,
  });
}

function buildTestDeck(): CardSnapshot[] {
  const deck: CardSnapshot[] = [];
  for (let i = 0; i < 19; i++) deck.push(sampleCard({ characterId: i + 1, cardType: "unit", seed: `u-${i}` }));
  for (let i = 0; i < 9; i++) {
    deck.push(sampleCard({ characterId: 50 + i, cardType: "event", attack: 0, defense: 0, seed: `e-${i}` }));
  }
  for (let i = 0; i < 7; i++) {
    deck.push(sampleLocation({ characterId: 200 + i, name: `Loc ${i}`, seed: `l-${i}` }));
  }
  for (let i = 0; i < 5; i++) {
    deck.push(sampleCard({ characterId: 300 + i, cardType: "character", seed: `c-${i}` }));
  }
  return deck;
}

function readyMatch(rngSeed = 42) {
  const deck = buildTestDeck();
  let state = createMatchState({ playerDeck: deck, aiDeck: deck, rngSeed });
  assert.equal(state.phase, "logistics");
  // Locations are split out of both decks at setup and pooled into a shared,
  // shuffled location deck that auto-seats the lane — they never appear in
  // either player's hand or draw deck anymore.
  assert.ok(!state.player.hand.some((c) => c.cardType === "location"));
  assert.ok(state.lanes[0]!.location != null);
  state = {
    ...state,
    lanes: [{ ...state.lanes[0]!, location: sampleLocation(), locationOwner: "player" }],
  };
  return state;
}

describe("battle overhaul", () => {
  it("cp track supports mythic on turn 6", () => {
    assert.equal(cpForTurn(6), 450);
    assert.equal(cpForTurn(10), 450);
  });

  it("cp does not carry over between turns", () => {
    const state = readyMatch();
    assert.equal(state.player.cp, 50);
  });

  it("merchant refund respects cp cap", () => {
    const capped = applyCpGain(440, 20, DEFAULT_BATTLE_RULES);
    assert.equal(capped, 450);
  });

  it("match setup auto-seats a location from the shared location deck", () => {
    const state = createMatchState({
      playerDeck: buildTestDeck(),
      aiDeck: buildTestDeck(),
      rngSeed: 99,
    });
    assert.equal(state.phase, "logistics");
    // 7 locations per deck * 2 players, minus the one auto-seated at setup.
    assert.equal(state.locationDeck.length, 13);
    assert.ok(state.lanes[0]!.location != null);
    assert.ok(!state.player.hand.some((c) => c.cardType === "location"));
    assert.ok(!state.player.deck.some((c) => c.cardType === "location"));
    assert.ok(!state.ai.hand.some((c) => c.cardType === "location"));
    assert.ok(!state.ai.deck.some((c) => c.cardType === "location"));
  });

  it("ai deck includes locations and validates", () => {
    const result = buildAiDeckFromPool(buildTestDeck());
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.ok(result.deck.some((c) => c.cardType === "location"));
      assert.equal(result.deck.length, 40);
    }
  });

  it("dynamic era synergy preserves damage when location leaves", () => {
    const loc = sampleLocation({ eraId: 1 });
    let unit = cardToBoardUnit(sampleCard({ defense: 50, eraId: 1 }), "player", "u1", 1, loc);
    unit = { ...unit, damageTaken: 15 };
    assert.equal(currentDefenseFromDamage(unit, loc), 50 + 25 - 15);
    assert.equal(currentDefenseFromDamage(unit, null), 50 - 15);
  });

  it("establish influence commits unit and gains influence", () => {
    let state = readyMatch();
    const unit = cardToBoardUnit(sampleCard(), "player", "u-est", 1, state.lanes[0]!.location);
    state = {
      ...state,
      lanes: [{ ...state.lanes[0]!, playerUnits: [{ ...unit, summoningSickness: false }] }],
    };
    const result = applyAction(state, "player", {
      type: "establish_influence",
      laneIndex: 0,
      unitInstanceId: "u-est",
    });
    assert.ok(!result.error);
    assert.equal(result.state.lanes[0]?.playerInfluence, 1);
    assert.equal(result.state.lanes[0]?.playerUnits[0]?.isCommitted, true);
  });

  it("committed unit cannot attack", () => {
    let state = readyMatch();
    const friendly = cardToBoardUnit(sampleCard(), "player", "a1", 1, state.lanes[0]!.location);
    const enemy = cardToBoardUnit(sampleCard({ characterId: 2 }), "ai", "d1", 1, state.lanes[0]!.location);
    state = {
      ...state,
      phase: "campaign",
      lanes: [
        {
          ...state.lanes[0]!,
          playerUnits: [{ ...friendly, summoningSickness: false, isCommitted: true, cannotAttack: true }],
          aiUnits: [{ ...enemy, summoningSickness: false }],
        },
      ],
    };
    const result = applyAction(state, "player", {
      type: "attack",
      laneIndex: 0,
      attackerInstanceId: "a1",
      defenderInstanceId: "d1",
    });
    assert.ok(result.error);
  });

  it("capture keeps lane units in place while the next location is seated", () => {
    let state = readyMatch();
    const friendly = cardToBoardUnit(
      sampleCard({ attack: 40, defense: 20, eraId: 2 }),
      "player",
      "p1",
      1,
      state.lanes[0]!.location,
    );
    const enemy = cardToBoardUnit(
      sampleCard({ defense: 5, attack: 5, eraId: 2 }),
      "ai",
      "a1",
      1,
      state.lanes[0]!.location,
    );
    state = {
      ...state,
      player: { ...state.player, capturedLocations: 0 },
      lanes: [
        {
          ...state.lanes[0]!,
          playerInfluence: 2,
          playerUnits: [{ ...friendly, summoningSickness: false }],
          aiUnits: [{ ...enemy, summoningSickness: false }],
        },
      ],
    };
    const playerDiscardBefore = state.player.discard.length;
    const aiDiscardBefore = state.ai.discard.length;

    state = captureActiveLocation(state, "player", 0, DEFAULT_BATTLE_RULES);

    assert.equal(state.lanes[0]!.playerUnits.length, 1);
    assert.equal(state.lanes[0]!.playerUnits[0]!.instanceId, "p1");
    assert.equal(state.lanes[0]!.aiUnits.length, 1);
    assert.equal(state.lanes[0]!.aiUnits[0]!.instanceId, "a1");
    assert.equal(state.player.discard.length, playerDiscardBefore);
    assert.equal(state.ai.discard.length, aiDiscardBefore);
    assert.equal(state.player.capturedLocations, 1);
    assert.ok(state.lanes[0]?.location != null);
  });

  it("capture increments capturedLocations without instant match win at threshold", () => {
    let state = readyMatch();
    state = {
      ...state,
      lanes: [{ ...state.lanes[0]!, playerInfluence: 2 }],
    };
    state = gainInfluence(state, "player", 0, 1, DEFAULT_BATTLE_RULES, "establish");
    assert.equal(state.player.capturedLocations, 1);
    assert.equal(state.status, "active");
    // The shared location deck immediately auto-seats the next Location —
    // the lane doesn't sit empty waiting on a manual play anymore.
    assert.ok(state.lanes[0]?.location != null);
  });

  it("match wins only at locationsToWin captures", () => {
    let state = readyMatch();
    state = {
      ...state,
      player: { ...state.player, capturedLocations: 2 },
      lanes: [{ ...state.lanes[0]!, playerInfluence: 2, playerUnits: [cardToBoardUnit(sampleCard(), "player", "hold", 1, state.lanes[0]!.location)] }],
    };
    state = captureActiveLocation(state, "player", 0, DEFAULT_BATTLE_RULES);
    assert.equal(state.player.capturedLocations, 3);
    assert.equal(state.status, "won");
  });

  it("destroyed units go to discard", () => {
    let state = readyMatch();
    const friendly = cardToBoardUnit(sampleCard({ attack: 40, defense: 20, eraId: 2 }), "player", "a1", 1, state.lanes[0]!.location);
    const enemy = cardToBoardUnit(sampleCard({ defense: 5, attack: 5, eraId: 2 }), "ai", "d1", 1, state.lanes[0]!.location);
    state = {
      ...state,
      phase: "campaign",
      lanes: [
        {
          ...state.lanes[0]!,
          playerUnits: [{ ...friendly, summoningSickness: false }],
          aiUnits: [{ ...enemy, summoningSickness: false }],
        },
      ],
    };
    const beforeDiscard = state.ai.discard.length;
    const result = applyAction(state, "player", {
      type: "attack",
      laneIndex: 0,
      attackerInstanceId: "a1",
      defenderInstanceId: "d1",
    });
    assert.ok(!result.error);
    assert.equal(result.state.ai.discard.length, beforeDiscard + 1);
  });

  it("attack preview matches combat math", () => {
    const state = readyMatch();
    const friendly = cardToBoardUnit(sampleCard({ attack: 40, defense: 20, eraId: 2 }), "player", "a1", 1, state.lanes[0]!.location);
    const enemy = cardToBoardUnit(sampleCard({ attack: 5, defense: 5, eraId: 2 }), "ai", "d1", 1, state.lanes[0]!.location);
    const withUnits = {
      ...state,
      phase: "campaign" as const,
      lanes: [
        {
          ...state.lanes[0]!,
          playerUnits: [{ ...friendly, summoningSickness: false }],
          aiUnits: [{ ...enemy, summoningSickness: false }],
        },
      ],
    };
    const preview = previewAttack(withUnits, "player", 0, "a1", "d1");
    assert.ok(preview);
    assert.equal(preview!.defenderDestroyed, true);
  });

  it("normalizes legacy saved state", () => {
    const legacy = {
      rngSeed: 1,
      rngCounter: 1,
      phase: "logistics",
      activePlayer: "player",
      turnNumber: 1,
      player: {
        cp: 50,
        cpGrantedThisTurn: 50,
        deck: [],
        hand: [],
        discard: [],
        capturedLocations: 0,
        eventsPlayedThisTurn: 0,
        deployCostReduction: 0,
        opponentInfluenceBlocked: false,
      },
      ai: {
        cp: 50,
        cpGrantedThisTurn: 50,
        deck: [],
        hand: [],
        discard: [],
        capturedLocations: 0,
        eventsPlayedThisTurn: 0,
        deployCostReduction: 0,
        opponentInfluenceBlocked: false,
      },
      lanes: [
        {
          location: null,
          playerInfluence: 0,
          aiInfluence: 0,
          playerUnits: [
            {
              instanceId: "legacy",
              characterId: 1,
              name: "Legacy",
              owner: "player",
              cardType: "unit",
              baseAttack: 10,
              baseDefense: 10,
              currentDefense: 8,
              eraId: 1,
              eraName: "E",
              eraColorPrimary: "#000",
              eraColorSecondary: "#111",
              rarity: "common",
              archetype: null,
              abilityName: null,
              abilityEffect: null,
              abilityValue: null,
              abilityTrigger: null,
              imageUrl: null,
              seed: "legacy",
              flavorText: null,
              cost: 20,
              eraSynergyBonus: 0,
              tempAttackBonus: 0,
              tempDefenseBonus: 0,
              summoningSickness: false,
              deployedTurn: 1,
              cannotAttack: false,
            } as BoardUnit,
          ],
          aiUnits: [],
        },
      ],
      locationDeck: [],
      pendingLocation: null,
      pendingChoice: null,
      log: [],
      pendingEvents: [],
      winner: null,
      status: "active",
    } as import("@/lib/battle/types").MatchState;

    const normalized = normalizeMatchState(legacy);
    assert.equal(normalized.player.capturedLocationHistory.length, 0);
    assert.equal(normalized.lanes[0]?.playerUnits[0]?.damageTaken, 2);
  });
});
