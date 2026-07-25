import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupMatchLogByTurns } from "@/lib/battle/group-match-log";
import type { MatchEvent } from "@/lib/battle/types";

function entry(type: string, message: string, at: number): MatchEvent {
  return { type, message, at };
}

describe("groupMatchLogByTurns", () => {
  it("groups setup, turn 1 player+ai, and turn 2 player", () => {
    const log: MatchEvent[] = [
      entry("setup", "Match started. Chronos Phase begins.", 0),
      entry("chronos", "player receives 50 CP and draws.", 1),
      entry("phase", "player advances to campaign.", 2),
      entry("chronos", "ai receives 50 CP and draws.", 3),
      entry("influence_passive", "ai gains 1 Influence on Wessex (1/3).", 4),
      entry("chronos", "player receives 100 CP and draws.", 5),
      entry("deploy", "player deploys West Saxons.", 6),
    ];

    const sections = groupMatchLogByTurns(log);
    assert.equal(sections.length, 3);
    assert.equal(sections[0]?.turn, null);
    assert.equal(sections[1]?.turn, 1);
    assert.equal(sections[1]?.subsections.length, 2);
    assert.equal(sections[1]?.subsections[0]?.label, "Your turn");
    assert.equal(sections[1]?.subsections[0]?.entries.length, 2);
    assert.equal(sections[1]?.subsections[1]?.label, "Enemy turn");
    assert.equal(sections[1]?.subsections[1]?.entries.length, 2);

    assert.equal(sections[2]?.turn, 2);
    assert.equal(sections[2]?.subsections[0]?.label, "Your turn");
    assert.equal(sections[2]?.subsections[0]?.entries.length, 2);
  });

  it("places pre-chronos shuffle in setup", () => {
    const log: MatchEvent[] = [
      entry("location_deck_shuffled", "The location deck is shuffled with 14 Locations.", 0),
      entry("setup", "Match started. Chronos Phase begins.", 1),
      entry("chronos", "player receives 50 CP and draws.", 2),
    ];

    const sections = groupMatchLogByTurns(log);
    assert.equal(sections[0]?.turn, null);
    assert.equal(sections[0]?.subsections[0]?.entries.length, 2);
    assert.equal(sections[1]?.turn, 1);
  });
});
