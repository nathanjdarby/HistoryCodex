# HistoryCodex: Core Rulebook & Game Logic

*Version 2.0 — Canonical rules for the digital TCG*

Welcome to **HistoryCodex**, a tactical trading card game where different eras, cultures, and archetypes clash across the timeline.

---

## Victory

There is **no player health or life total**. You win a territorial struggle:

1. **Reach the Influence threshold** on the active Location to **capture** it.
2. **Capture the required number of Locations** (default **3**) to win the match.

Reaching the Influence threshold **never ends the match by itself** — it always resolves as a Location capture.

> Reach the Influence threshold to capture the active Location. Capture the required number of Locations to win the match.

---

## Chronos Points (CP)

CP **refreshes each turn** and **does not carry over**.

| Turn | Default CP |
| --- | --- |
| 1 | 50 |
| 2 | 100 |
| 3 | 150 |
| 4 | 225 |
| 5 | 300 |
| 6+ | 450 (cap) |

Card **cost** equals CP to play. **Mythic** cards (450 CP) are naturally playable from turn 6 under default rules. Cost-reduction effects can enable earlier deployment.

Merchant refunds and other CP gains respect the configured **CP cap** unless **CP overflow** is enabled in Admin Rules.

---

## Deck

- **40 cards** in one Chronos deck (Units, Characters, Events, Locations shuffled together)
- **Max 3 copies** per card
- Recommended mix: **18–20 Units**, **8–10 Events**, **6–8 Locations**, **4–5 Characters**
- **Opening hand:** 5 cards, guaranteed to include at least one Location (injected silently if needed)
- Decks without any Location **cannot start a match**

---

## Battlefield (one lane)

- Match begins with **no Location**
- During **Logistics**, play a Location from hand (pay CP)
- **Deploying Units/Characters requires an active Location**
- Only **one Location** is active at a time

### Location replacement

When you play a Location over an existing one:

- Incoming Location becomes active
- **All Influence resets to 0**
- Replaced Location goes to **its owner's discard pile**
- Surviving Units remain and **recalculate Era synergy**

---

## Influence

### Establish Influence (Logistics, once per turn)

- Requires an active Location and a **ready** friendly Unit
- Cannot be used by Units with **summoning sickness** or already **committed**
- Commits the chosen Unit — it **cannot attack** this turn
- Grants **+1 Influence** immediately (respects block effects and capture threshold)
- If this reaches the threshold, **capture resolves immediately**

### Passive Consolidation Influence

At **Consolidation**, gain Influence only when:

- An active Location exists
- You control at least one surviving Unit
- Opponent controls **no** Units
- Influence gain is not blocked

**Leaders** grant **+1 bonus Influence** when uncontested (non-stacking by default).

---

## Capture aftermath

When you capture a Location:

- Your **captured Locations** counter increases
- Captured Location is recorded in **capture history** (not sent to discard)
- **Enemy Units are routed to discard** (death triggers fire)
- **Your surviving Units remain** in the lane
- Active Location is cleared; Influence resets
- Surviving Units cannot attack, establish Influence, or gain Location synergy until a new Location is played
- Either player may play the next Location during Logistics

---

## Combat

- Attacks occur during **Campaign**, within the active lane
- **Warriors** must be targeted first while any live Warrior remains
- **Simultaneous damage** — both Units deal DEF damage
- Units at **0 DEF or below** are destroyed and sent to their owner's **discard pile**
- Death triggers resolve once

### Unit commitment

Units committed via **Establish Influence** cannot attack until commitment clears at their owner's next **Chronos** phase.

---

## Dynamic Era synergy

Location DEF bonuses are **not permanent**. They recalculate when:

- A Unit deploys
- A Location is played or replaced
- A Location is captured and cleared

Damage already taken is preserved when bonuses change.

**Sailors** gain **+5 DEF** when eras mismatch, **+10** when they match (also dynamic).

---

## Archetype passives

| Archetype | Passive |
| --- | --- |
| **Warrior** | Must be targeted first; **Giant Slayer** doubles own ATK vs Epic/Legendary/Mythic |
| **Monarch** | **+10 ATK aura** to other friendlies in lane (non-stacking by default) |
| **Merchant** | **+20 CP refund** on deploy (respects CP cap) |
| **Scholar** | **+1 Chronos draw** per Scholar (capped, default max 2) |
| **Sailor** | Dynamic DEF bonus based on Location era |
| **Leader** | **+1 Consolidation Influence** when uncontested (non-stacking by default) |

---

## Unification (one-lane)

Monarchs with an ability name containing **"Unification"** may use a once-per-turn Logistics action:

- Choose another friendly Unit in the lane (not the Monarch)
- Remove summoning sickness / clear commitment from that Unit
- Grant temporary **ATK bonus** until end of turn

---

## Historical Exhaustion

When a player cannot draw during **Chronos**:

- No immediate loss (there is no health)
- Failed mandatory Chronos draws are tracked
- After **3 consecutive** failed Chronos draws (configurable), that player loses to **Historical Exhaustion**
- Returning cards to the deck resets the counter

---

## Turn structure

1. **Chronos** — refresh CP, draw, Scholar bonus, exhaustion check
2. **Logistics** — play Location, deploy, Events, Establish Influence, Unification
3. **Campaign** — combat
4. **Consolidation** — passive Influence, capture checks, pass turn

---

## Event effect families

Events use data-driven `abilityEffect` keys including:

- Standard: `flat_attack`, `flat_defense`, `add_influence`, `remove_influence`, …
- **Epidemic** — DEF damage to all Units in lane
- **Treaty** — block attacks / Influence for the turn
- **Revolution** — CP grant + deploy cost reduction
- **Trade Route** — CP + draw
- **Reform** — suppress enemy auras until end of turn
- **Forced movement** — return to hand, discard, or exhaust enemy Units

---

## Configurable rules (Admin)

All balance values are configurable: CP track, CP cap, overflow, influence threshold, locations to win, Merchant refund, Monarch aura, Leader bonus, Scholar draw cap, establish Influence limit, exhaustion threshold, and more.
