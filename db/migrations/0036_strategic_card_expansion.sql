-- Strategic card expansion: ability triggers + event cards + signature units

ALTER TABLE `characters` ADD `ability_trigger` text;
--> statement-breakpoint
-- Global event cards (usable in any era deck)
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Royal Survey', 'Scry the chronicles before the battle begins.', 'event-royal-survey', 'common', 'event', 15,
  NULL, 0, 0, 'Royal Survey', 'scry', 2, NULL
FROM `eras` e WHERE e.slug = 'roman-britain' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Westminster Archives', 'Search the records for the right commander.', 'event-westminster-archives', 'rare', 'event', 45,
  NULL, 0, 0, 'Archive Search', 'search_deck', 5, NULL
FROM `eras` e WHERE e.slug = 'medieval-england' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Historical Revision', 'Rewrite the record; restore a lost asset.', 'event-historical-revision', 'uncommon', 'event', 25,
  NULL, 0, 0, 'Selective Recall', 'discard_to_hand', 1, NULL
FROM `eras` e WHERE e.slug = 'tudor-england' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Mobilize Reserves', 'Cut the weak link; reinforce the line.', 'event-mobilize-reserves', 'common', 'event', 20,
  NULL, 0, 0, 'Supply Requisition', 'discard_draw', 2, NULL
FROM `eras` e WHERE e.slug = 'anglo-saxon' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Field Surgeon', 'Patch the wounded before the next clash.', 'event-field-surgeon', 'common', 'event', 25,
  NULL, 0, 0, 'Field Repair', 'heal_unit', 15, NULL
FROM `eras` e WHERE e.slug = 'georgian-britain' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Proclamation', 'A decree shifts the balance of power.', 'event-proclamation', 'rare', 'event', 50,
  NULL, 0, 0, 'Propaganda Push', 'add_influence', 1, NULL
FROM `eras` e WHERE e.slug = 'stuart-england' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Undermine Authority', 'Sow doubt among the occupiers.', 'event-undermine-authority', 'epic', 'event', 60,
  NULL, 0, 0, 'Counter-Influence', 'remove_influence', 1, NULL
FROM `eras` e WHERE e.slug = 'victorian-britain' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'War Bonds', 'Finance the next deployment at a discount.', 'event-war-bonds', 'uncommon', 'event', 30,
  NULL, 0, 0, 'War Bonds', 'cost_reduction', 15, NULL
FROM `eras` e WHERE e.slug = 'modern-britain' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Protracted Siege', 'Delay the enemy''s claim to the territory.', 'event-protracted-siege', 'rare', 'event', 40,
  NULL, 0, 0, 'Siege Delay', 'block_influence_gain', 1, NULL
FROM `eras` e WHERE e.slug = 'roman-britain' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Relocate Capital', 'Move the seat of power to fresher ground.', 'event-relocate-capital', 'legendary', 'event', 80,
  NULL, 0, 0, 'Relocate Capital', 'replace_location', 1, NULL
FROM `eras` e WHERE e.slug = 'medieval-england' LIMIT 1;
--> statement-breakpoint
-- Signature trigger units
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Royal Chronicler', 'Records every maneuver for posterity.', 'unit-royal-chronicler', 'uncommon', 'unit', 25,
  'scholar', 12, 28, 'Fresh Insight', 'draw_card', 1, 'deploy'
FROM `eras` e WHERE e.slug = 'tudor-england' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Fallen Martyr', 'Their sacrifice echoes beyond the grave.', 'unit-fallen-martyr', 'uncommon', 'unit', 22,
  'warrior', 22, 18, 'Martyrdom', 'vs_higher_rarity_attack', 10, 'death'
FROM `eras` e WHERE e.slug = 'anglo-saxon' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Rally Captain', 'Inspires the host at the opening of battle.', 'unit-rally-captain', 'rare', 'unit', 35,
  'leader', 18, 22, 'Opening Rally', 'flat_attack', 8, 'campaign_start'
FROM `eras` e WHERE e.slug = 'medieval-england' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Occupation Force', 'Establishes a foothold the moment they arrive.', 'unit-occupation-force', 'rare', 'unit', 40,
  'leader', 16, 24, 'Beachhead', 'add_influence', 1, 'deploy'
FROM `eras` e WHERE e.slug = 'roman-britain' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Coastal Navigator', 'Knows every tide and inlet.', 'unit-coastal-navigator', 'uncommon', 'unit', 28,
  'sailor', 14, 26, 'Sea Legs', 'flat_defense', 8, NULL
FROM `eras` e WHERE e.slug = 'georgian-britain' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Trade Convoy', 'Brings supplies and momentum to the front.', 'unit-trade-convoy', 'uncommon', 'unit', 24,
  'merchant', 10, 30, 'Supply Line', 'flat_attack', 5, 'deploy'
FROM `eras` e WHERE e.slug = 'victorian-britain' LIMIT 1;
--> statement-breakpoint
-- Location with influence threshold variant (capture at 2 instead of buff-only - use add_influence on capture via flavor)
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Hadrian''s Wall', 'A frontier that bends but does not break.', 'location-hadrians-wall', 'epic', 'location', 90,
  NULL, 0, 0, 'Frontier Hold', 'flat_defense', 40, NULL
FROM `eras` e WHERE e.slug = 'roman-britain' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Westminster Hall', 'Parliament''s heart beats with authority.', 'location-westminster-hall', 'legendary', 'location', 120,
  NULL, 0, 0, 'Seat of Power', 'flat_defense', 60, NULL
FROM `eras` e WHERE e.slug = 'medieval-england' LIMIT 1;
--> statement-breakpoint
INSERT INTO `characters` (
  `era_id`, `name`, `flavor_text`, `seed`, `rarity`, `card_type`, `cost`,
  `archetype`, `attack`, `defense`, `ability_name`, `ability_effect`, `ability_value`, `ability_trigger`
)
SELECT e.id, 'Dockyards of Portsmouth', 'The fleet gathers before the storm.', 'location-portsmouth-dockyards', 'rare', 'location', 75,
  NULL, 0, 0, 'Naval Base', 'flat_defense', 30, NULL
FROM `eras` e WHERE e.slug = 'georgian-britain' LIMIT 1;
