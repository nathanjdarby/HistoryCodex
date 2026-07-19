# HistoryCodex: Core Rulebook & Game Logic

*Version 1.0 — Canonical rules for the digital TCG*

Welcome to **HistoryCodex**, a tactical trading card game where different eras, cultures, and archetypes clash across the timeline. This document is the single source of truth for v1 gameplay in the app.

---

## Conflict Resolution (v1 canonical)

These rules override any earlier draft contradictions:

| Topic | Canonical v1 rule |
| --- | --- |
| Resource name | **Chronos Points (CP)** |
| CP track | Turn 1 = 50, Turn 2 = 100, Turn 3 = 150, Turn 4 = 200, Turn 5+ = 300 (cap). Unspent CP does **not** carry over. |
| Merchant passive | **+20 CP refund immediately** when a Merchant is deployed |
| Monarch passive | **+10 ATK aura** to other friendly units in the same lane (not +DEF) |
| Scholar passive | **+1 draw** per active Scholar during Chronos Phase |
| Warrior passive | **Must be targeted first** in-lane before other units |
| Win condition | **3 influence tokens on one Location** OR **3 captured Locations** total |
| Time sickness | Units **cannot attack** the turn they are deployed |
| Player deck | **40 cards**, max **3 copies** each; baseline mix — **Units 18–20**, **Events 8–10**, **Locations 6–8**, **Characters 4–5** (all shuffled together) |
| Starting battlefield | **No location** on the table at match start |
| Playing locations | During Logistics, play **one location from hand** onto the lane (pay CP). Overrides opponent location and **resets all influence** |
| Mythic cost | 450 CP cards require cost-reduction; not playable on a normal Turn 5 refresh alone |

---

## 1. Core Mechanics & Win Conditions

Players struggle for control over historical **Locations** — not a life total.

- **Chronos Deck:** Each player builds a deck of exactly **40 cards** (max **3 copies** per card). Recommended baseline composition:

| Card type | Count | Role |
| --- | --- | --- |
| Units | 18–20 (~50%) | Frontline infantry — establish board presence early |
| Events | 8–10 (~22%) | Removal, tricks, burst damage |
| Locations | 6–8 (~18%) | Persistent buffs and field control |
| Characters | 4–5 (~10%) | High-impact heroes |

Any Eras may be mixed. All card types are shuffled into one deck and drawn to hand normally.
- **Battlefield:** Starts with **no location** on the table. During Logistics, a player may play a location from hand onto the lane (pay its CP cost). Only **one location** occupies the lane at a time. Playing your location on an opponent's location **overrides** it and **resets all influence** on that lane.
- **Win:** First player to earn **3 influence tokens on a single Location**, or **capture 3 distinct Locations**, wins.

---

## 2. Chronos Points (CP)

| Turn | CP granted |
| --- | --- |
| 1 | 50 |
| 2 | 100 |
| 3 | 150 |
| 4 | 200 |
| 5+ | 300 (cap) |

Card **cost** on each card is its CP deployment price (Common ≈ 20, Legendary ≈ 300, Mythic = 450).

---

## 3. Card Types

### Character / Unit cards

- **Cost**, **Archetype**, **ATK**, **DEF**, **Era**, **Ability**
- Deployed into a Location lane during Logistics Phase

### Location cards

- **3 copies** max per card in each player's 40-card deck (drawn to hand normally)
- Play from hand during Logistics Phase (pay CP)
- Define lane era and **Home Ground** buff (+DEF to matching-era units)
- Override an existing location to reset influence on that lane

### Event cards

One-shot Logistics actions. **0 ATK/DEF**, never placed on the board. Max **1 Event per turn**.

| `abilityEffect` | Event template | Effect |
| --- | --- | --- |
| `flat_attack` | Offensive Maneuver | +abilityValue ATK to all friendly units in chosen lane until end of turn |
| `flat_defense` | Fortify Position | +abilityValue DEF to all friendly units in chosen lane until end of turn |
| `vs_higher_rarity_attack` | Decisive Strike | Deal abilityValue DEF damage to one enemy unit in chosen lane |
| `vs_lower_rarity_attack` | Economic Surge | Gain abilityValue CP immediately |
| `scry` | Royal Survey | Look at top N cards; reorder them on deck |
| `search_deck` | Archive Search | Reveal top N; add one unit/character to hand; shuffle rest |
| `discard_to_hand` | Historical Revision | Return one card from discard to hand |
| `discard_draw` | Mobilize Reserves | Discard one card from hand, draw two |
| `heal_unit` | Field Surgeon | Restore abilityValue DEF to a friendly unit |
| `add_influence` | Proclamation | Gain abilityValue influence on chosen lane |
| `remove_influence` | Undermine Authority | Remove abilityValue enemy influence from lane |
| `cost_reduction` | War Bonds | Next deploy this turn costs abilityValue less CP |
| `block_influence_gain` | Protracted Siege | Opponent cannot gain influence this Consolidation |
| `replace_location` | Relocate Capital | Replace active location with a location from your hand (free); resets influence |

Interactive deck effects (`scry`, `search_deck`, `discard_to_hand`, `discard_draw`) pause the match until the player confirms a choice in the battle UI.

---

## 4. Archetype Passive Rules

| Archetype | Role |
| --- | --- |
| **Warrior** | Frontline. Must be targeted first by enemy attacks in the lane. **Giant Slayer:** double ATK vs Epic/Legendary/Mythic targets. |
| **Monarch** | **Commanding Presence:** +10 ATK to other friendly units in the same lane. |
| **Merchant** | **Shrewd Bargain:** refund **20 CP** when deployed. |
| **Scholar** | **Fortified Study:** draw +1 card during your Chronos Phase while active. |
| **Sailor** | **Sea Legs:** +5 DEF when location is a different era, +10 when eras match. |
| **Leader** | **Rally the Host:** +1 extra influence when lane is uncontested at Consolidation (stacks with base +1). |

Units may also have triggered abilities via `abilityTrigger`:

| Trigger | When it fires |
| --- | --- |
| `deploy` | When the unit enters the lane |
| `death` | When the unit is destroyed |
| `campaign_start` | At the start of your Campaign phase |

---

## 5. Turn Structure

Each turn has four phases:

### Phase 1: Chronos (Draw & Resource)

1. Refresh CP to the turn-track value
2. Draw 1 card
3. Draw +1 per friendly Scholar on the board

### Phase 2: Logistics (Deployment)

- **Locations:** play from hand onto the lane (pay CP). Overrides opponent location and resets influence.
- Deploy Characters/Units: pay CP, choose a lane (**requires a location on the lane**)
- **Era Synergy:** if unit Era matches Location Era, apply Location DEF buff (+10 to +90 by location rarity)
- **Time sickness:** cannot attack this turn
- **Merchant:** +20 CP on deploy
- **Events:** play from hand (see Event templates above)

### Phase 3: Campaign (Combat)

- Attacks stay within the same lane
- Warriors must be targeted first
- Simultaneous damage:
  - `Defender DEF -= Attacker ATK`
  - `Attacker DEF -= Defender ATK`
- Units at DEF ≤ 0 go to discard

### Phase 4: Consolidation

- **Lane dominance:** if you have units and opponent has none, place **1 influence token** on that Location
- **Propaganda / occupation:** some Events and deploy triggers grant influence even when contested
- **Siege delay:** `block_influence_gain` prevents the opponent from earning Consolidation influence that turn
- **Capture:** at **3 tokens** from one player, that player captures the Location (counts toward win); the lane is cleared — play a new location from hand to continue fighting there
- Pass turn to opponent

---

## 6. Standardized Ability Logic

- **Commanding Presence (Monarchs):** +10 ATK aura to other friendly units in lane
- **Shrewd Bargain (Merchants):** +20 CP refund on deploy
- **Fortified Study (Scholars):** +1 draw during Chronos while active
- **Giant Slayer (Warriors):** double ATK vs Epic/Legendary/Mythic
- **Unification (special Monarchs):** on deploy, move 1 friendly unit from an adjacent lane into this lane (when ability present)

---

## 7. Setup Checklist

1. Both players shuffle 40-card decks; draw **5** cards
2. If your opening hand has no location, you may **redraw** (reshuffle and draw 5 again) until you have one
3. Battlefield begins with **no location** on the lane
4. Decide starting player
5. Begin Turn 1 (50 CP)

---

## 8. Solo vs AI (Digital v1)

The app supports **Practice Match vs AI**: one human player, heuristic AI opponent, persisted match state, deck builder from owned collection cards.
