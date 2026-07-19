import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_BATTLE_RULES, cpForTurn } from "@/lib/battle/constants";
import { createMatchState } from "@/lib/battle/setup";
import { applyAction } from "@/lib/battle/reducer";
import { validateDeckComposition } from "@/lib/battle/validators";
import {
  effectiveAttack,
  eraSynergyBonus,
  monarchCountInLane,
} from "@/lib/battle/abilities";
import { playLocationFromHand } from "@/lib/battle/locations";
import type { BoardUnit, CardSnapshot, Lane } from "@/lib/battle/types";
import { runConsolidation } from "@/lib/battle/phases/campaign";

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

function sampleBoardUnit(overrides: Partial<BoardUnit> = {}): BoardUnit {
  return {
    instanceId: "u1",
    characterId: 1,
    name: "Warrior",
    owner: "player",
    cardType: "character",
    baseAttack: 20,
    baseDefense: 10,
    currentDefense: 10,
    eraId: 1,
    eraName: "Roman Britain",
    eraColorPrimary: "#4a3728",
    eraColorSecondary: "#2a1f16",
    rarity: "common",
    archetype: "warrior",
    abilityName: null,
    abilityEffect: null,
    abilityValue: null,
    abilityTrigger: null,
    imageUrl: null,
    seed: "warrior",
    flavorText: null,
    cost: 20,
    eraSynergyBonus: 0,
    tempAttackBonus: 0,
    tempDefenseBonus: 0,
    summoningSickness: false,
    cannotAttack: false,
    deployedTurn: 1,
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
  for (let i = 0; i < 19; i++) {
    deck.push(sampleCard({ characterId: i + 1, cardType: "unit", seed: `u-${i}` }));
  }
  for (let i = 0; i < 9; i++) {
    deck.push(
      sampleCard({
        characterId: 50 + i,
        cardType: "event",
        attack: 0,
        defense: 0,
        seed: `e-${i}`,
      }),
    );
  }
  for (let i = 0; i < 7; i++) {
    deck.push(sampleLocation({ characterId: 200 + i, name: `Loc ${i}`, seed: `l-${i}` }));
  }
  for (let i = 0; i < 5; i++) {
    deck.push(sampleCard({ characterId: 300 + i, cardType: "character", seed: `c-${i}` }));
  }
  return deck;
}

function withLocationOnLane(state: import("@/lib/battle/types").MatchState): import("@/lib/battle/types").MatchState {
  return {
    ...state,
    lanes: [{ ...state.lanes[0]!, location: sampleLocation() }],
  };
}

function readyMatchState(rngSeed = 42): import("@/lib/battle/types").MatchState {
  const deck = buildTestDeck();
  let state = createMatchState({
    playerDeck: deck,
    aiDeck: deck,
    rngSeed,
  });
  let safety = 0;
  while (state.phase === "opening" && safety < 50) {
    const result = applyAction(state, "player", { type: "redraw_opening_hand" });
    assert.ok(!result.error);
    state = result.state;
    safety++;
  }
  assert.equal(state.phase, "logistics");
  return withLocationOnLane(state);
}

describe("battle constants", () => {
  it("cp track caps at turn 5", () => {
    assert.equal(cpForTurn(1), 50);
    assert.equal(cpForTurn(5), 300);
    assert.equal(cpForTurn(10), 300);
  });
});

describe("deck validation", () => {
  it("requires baseline type counts at 40 cards", () => {
    const result = validateDeckComposition([
      { characterId: 1, quantity: 40, cardType: "character" },
    ]);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("Units")));
  });

  it("accepts baseline composition", () => {
    const result = validateDeckComposition([
      ...Array.from({ length: 19 }, (_, i) => ({
        characterId: i + 1,
        quantity: 1,
        cardType: "unit",
      })),
      ...Array.from({ length: 9 }, (_, i) => ({
        characterId: 50 + i,
        quantity: 1,
        cardType: "event",
      })),
      ...Array.from({ length: 7 }, (_, i) => ({
        characterId: 100 + i,
        quantity: 1,
        cardType: "location",
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        characterId: 200 + i,
        quantity: 1,
        cardType: "character",
      })),
    ]);
    assert.equal(result.valid, true);
    assert.equal(result.totalCards, 40);
  });

  it("rejects too many locations", () => {
    const result = validateDeckComposition([
      ...Array.from({ length: 18 }, (_, i) => ({
        characterId: i + 1,
        quantity: 1,
        cardType: "unit",
      })),
      ...Array.from({ length: 8 }, (_, i) => ({
        characterId: 50 + i,
        quantity: 1,
        cardType: "event",
      })),
      ...Array.from({ length: 9 }, (_, i) => ({
        characterId: 100 + i,
        quantity: 1,
        cardType: "location",
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        characterId: 200 + i,
        quantity: 1,
        cardType: "character",
      })),
    ]);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("Locations")));
  });
});

describe("abilities", () => {
  it("applies era synergy DEF bonus", () => {
    const unit = sampleCard({ eraId: 1 });
    const location = sampleLocation({ eraId: 1 });
    assert.equal(eraSynergyBonus(unit, location), 25);
  });

  it("monarch aura adds ATK to allies", () => {
    const lane: Lane = {
      location: sampleLocation(),
      playerInfluence: 0,
      aiInfluence: 0,
      playerUnits: [
        sampleBoardUnit({
          instanceId: "m1",
          characterId: 2,
          name: "Monarch",
          baseAttack: 10,
          baseDefense: 10,
          currentDefense: 10,
          rarity: "rare",
          archetype: "monarch",
          seed: "monarch",
        }),
        sampleBoardUnit({
          instanceId: "w1",
          name: "Warrior",
          baseAttack: 20,
          currentDefense: 10,
        }),
      ],
      aiUnits: [],
    };
    assert.equal(monarchCountInLane(lane, "player"), 1);
    const ally = lane.playerUnits[1]!;
    assert.equal(effectiveAttack(ally, lane, DEFAULT_BATTLE_RULES), 30);
  });
});

describe("match flow", () => {
  it("creates a match with one empty lane and no starting location", () => {
    const deck = buildTestDeck();
    const state = createMatchState({
      playerDeck: deck,
      aiDeck: deck,
      rngSeed: 42,
    });
    assert.equal(state.lanes.length, 1);
    assert.equal(state.lanes[0]?.location, null);
    assert.ok(state.phase === "logistics" || state.phase === "opening");
    if (state.phase === "logistics") {
      assert.equal(state.player.hand.length, 6);
      assert.equal(state.player.cp, 50);
    } else {
      assert.equal(state.player.hand.length, 5);
      assert.equal(state.player.cp, 0);
    }
    assert.equal(state.pendingLocation, null);
  });

  it("redraw_opening_hand reshuffles until a location is drawn", () => {
    const deck = buildTestDeck();
    let state = createMatchState({
      playerDeck: deck,
      aiDeck: deck,
      rngSeed: 42,
    });
    if (state.phase !== "opening") return;

    let safety = 0;
    while (state.phase === "opening" && safety < 50) {
      const result = applyAction(state, "player", { type: "redraw_opening_hand" });
      assert.ok(!result.error);
      state = result.state;
      safety++;
    }
    assert.equal(state.phase, "logistics");
    assert.ok(state.player.hand.some((card) => card.cardType === "location"));
    assert.equal(state.player.cp, 50);
  });

  it("play_location from hand sets the lane and costs CP", () => {
    let state = readyMatchState();
    const location = sampleLocation({ characterId: 501, name: "York", cost: 30, seed: "york" });
    state = {
      ...state,
      lanes: [{ ...state.lanes[0]!, location: null }],
      player: { ...state.player, hand: [location], cp: 100 },
    };

    const result = applyAction(state, "player", {
      type: "play_location",
      handIndex: 0,
      laneIndex: 0,
    });
    assert.ok(!result.error);
    assert.equal(result.state.lanes[0]?.location?.name, "York");
    assert.equal(result.state.player.cp, 70);
    assert.equal(result.state.lanes[0]?.playerInfluence, 0);
  });

  it("overriding a location resets influence", () => {
    const deck = buildTestDeck();
    let state = withLocationOnLane(
      createMatchState({
        playerDeck: deck,
        aiDeck: deck,
        rngSeed: 42,
      }),
    );
    state = {
      ...state,
      lanes: [
        {
          ...state.lanes[0]!,
          playerInfluence: 2,
          aiInfluence: 1,
        },
      ],
      player: {
        ...state.player,
        hand: [sampleLocation({ characterId: 502, name: "Hadrian", cost: 20, seed: "hadrian" })],
        cp: 100,
      },
    };

    const played = playLocationFromHand(state, "player", 0, 0);
    assert.ok(played);
    assert.equal(played!.lanes[0]?.location?.name, "Hadrian");
    assert.equal(played!.lanes[0]?.playerInfluence, 0);
    assert.equal(played!.lanes[0]?.aiInfluence, 0);
  });

  it("merchant refund increases CP on deploy", () => {
    const merchant = sampleCard({
      characterId: 99,
      archetype: "merchant",
      cost: 20,
      name: "Trader",
      seed: "merchant",
    });
    let state = withLocationOnLane(readyMatchState(7));
    state = {
      ...state,
      player: { ...state.player, hand: [merchant] },
    };
    const handIndex = 0;
    const result = applyAction(state, "player", {
      type: "deploy_unit",
      handIndex,
      laneIndex: 0,
    });
    assert.ok(!result.error);
    assert.equal(result.state.player.cp, 50 - 20 + DEFAULT_BATTLE_RULES.merchantRefundCp);
  });
});

describe("strategic effects", () => {
  function baseMatchState() {
    return readyMatchState();
  }

  it("scry event creates a pending choice", () => {
    let state = baseMatchState();
    const scryEvent = sampleCard({
      characterId: 900,
      cardType: "event",
      name: "Royal Survey",
      cost: 15,
      abilityEffect: "scry",
      abilityValue: 2,
      seed: "scry",
    });
    state = {
      ...state,
      player: {
        ...state.player,
        hand: [scryEvent],
        deck: [sampleCard({ characterId: 901, seed: "top" }), sampleCard({ characterId: 902, seed: "second" })],
      },
    };

    const result = applyAction(state, "player", { type: "play_event", handIndex: 0 });
    assert.ok(!result.error);
    assert.equal(result.state.pendingChoice?.kind, "scry");
    assert.equal(result.state.pendingChoice?.revealedCards.length, 2);
  });

  it("resolve_choice completes scry reorder", () => {
    let state = baseMatchState();
    const top = sampleCard({ characterId: 901, name: "Top", seed: "top" });
    const bottom = sampleCard({ characterId: 902, name: "Bottom", seed: "bottom" });
    state = {
      ...state,
      pendingChoice: {
        kind: "scry",
        player: "player",
        revealedCards: [top, bottom],
        eventName: "Royal Survey",
      },
      player: {
        ...state.player,
        deck: [top, bottom, sampleCard({ characterId: 903, seed: "rest" })],
      },
    };

    const result = applyAction(state, "player", {
      type: "resolve_choice",
      topIndices: [1, 0],
    });
    assert.ok(!result.error);
    assert.equal(result.state.pendingChoice, null);
    assert.equal(result.state.player.deck[0]?.name, "Bottom");
    assert.equal(result.state.player.deck[1]?.name, "Top");
  });

  it("heal_unit restores defense on a friendly target", () => {
    let state = baseMatchState();
    const healEvent = sampleCard({
      characterId: 910,
      cardType: "event",
      name: "Field Surgeon",
      cost: 25,
      abilityEffect: "heal_unit",
      abilityValue: 15,
      seed: "heal",
    });
    const wounded = sampleBoardUnit({
      instanceId: "wounded",
      currentDefense: 5,
      baseDefense: 20,
    });
    state = {
      ...state,
      player: { ...state.player, hand: [healEvent], cp: 100 },
      lanes: [
        {
          ...state.lanes[0]!,
          playerUnits: [wounded],
        },
      ],
    };

    const result = applyAction(state, "player", {
      type: "play_event",
      handIndex: 0,
      laneIndex: 0,
      targetInstanceId: "wounded",
    });
    assert.ok(!result.error);
    assert.equal(result.state.lanes[0]?.playerUnits[0]?.currentDefense, 20);
  });

  it("add_influence event grants influence on a lane", () => {
    let state = baseMatchState();
    const propaganda = sampleCard({
      characterId: 920,
      cardType: "event",
      name: "Proclamation",
      cost: 50,
      abilityEffect: "add_influence",
      abilityValue: 1,
      seed: "propaganda",
    });
    state = {
      ...state,
      player: { ...state.player, hand: [propaganda], cp: 100 },
      lanes: [
        {
          ...state.lanes[0]!,
          playerUnits: [sampleBoardUnit({ instanceId: "hold" })],
        },
      ],
    };

    const result = applyAction(state, "player", {
      type: "play_event",
      handIndex: 0,
      laneIndex: 0,
    });
    assert.ok(!result.error);
    assert.equal(result.state.lanes[0]?.playerInfluence, 1);
  });

  it("deploy trigger draws a card", () => {
    let state = baseMatchState();
    const chronicler = sampleCard({
      characterId: 930,
      cardType: "unit",
      name: "Royal Chronicler",
      cost: 25,
      abilityEffect: "draw_card",
      abilityValue: 1,
      abilityTrigger: "deploy",
      seed: "chronicler",
    });
    state = {
      ...state,
      player: {
        ...state.player,
        hand: [chronicler],
        deck: [sampleCard({ characterId: 931, seed: "drawn" })],
      },
    };
    const handBefore = state.player.hand.length;
    const deckBefore = state.player.deck.length;

    const result = applyAction(state, "player", {
      type: "deploy_unit",
      handIndex: 0,
      laneIndex: 0,
    });
    assert.ok(!result.error);
    assert.equal(result.state.player.deck.length, deckBefore - 1);
    assert.equal(result.state.player.hand.length, handBefore);
  });

  it("cost_reduction lowers the next deploy cost", () => {
    let state = baseMatchState();
    const warBonds = sampleCard({
      characterId: 940,
      cardType: "event",
      name: "War Bonds",
      cost: 30,
      abilityEffect: "cost_reduction",
      abilityValue: 15,
      seed: "bonds",
    });
    const unit = sampleCard({ characterId: 941, cost: 40, seed: "unit" });
    state = {
      ...state,
      player: { ...state.player, hand: [warBonds, unit], cp: 100 },
    };

    const playBonds = applyAction(state, "player", { type: "play_event", handIndex: 0 });
    assert.ok(!playBonds.error);
    assert.equal(playBonds.state.player.deployCostReduction, 15);

    const deploy = applyAction(playBonds.state, "player", {
      type: "deploy_unit",
      handIndex: 0,
      laneIndex: 0,
    });
    assert.ok(!deploy.error);
    assert.equal(deploy.state.player.cp, 100 - 30 - (40 - 15));
  });

  it("block_influence_gain prevents opponent consolidation influence", () => {
    let state = baseMatchState();
    state = {
      ...state,
      activePlayer: "player",
      phase: "consolidation",
      ai: {
        ...state.ai,
        opponentInfluenceBlocked: true,
      },
      lanes: [
        {
          ...state.lanes[0]!,
          playerUnits: [sampleBoardUnit({ instanceId: "player-unit" })],
          aiUnits: [],
        },
      ],
    };

    const next = runConsolidation(state);
    assert.equal(next.lanes[0]?.playerInfluence, 0);
  });
});
