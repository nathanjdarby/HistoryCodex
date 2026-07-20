-- Flavor text for The Wager character and location cards (Georgian Britain).

UPDATE characters
SET flavor_text = 'Scarcely more than a boy when the Wager went aground, he endured hunger, mutiny, and open ocean—and lived to father a line that would one day shake English verse.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'georgian-britain' AND c.card_type = 'character' AND c.name = 'John Byron'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'He sailed to seize Spanish treasure and lost half his fleet to the Horn—yet returned with prize money, renown, and reforms that would reshape the navy he had commanded.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'georgian-britain' AND c.card_type = 'character' AND c.name = 'George Anson'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'While officers quarrelled over rank, the cooper shaped timber and hide into a vessel that could float. Craft, not pedigree, kept the castaways alive.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'georgian-britain' AND c.card_type = 'character' AND c.name = 'Henry Cozens'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'With axe and compass he turned wreckage into a boat, then put pen to paper beside the gunner. Their joint account became the record England would judge.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'georgian-britain' AND c.card_type = 'character' AND c.name = 'John Cummins'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'Marooned on a bleak Patagonian shore, he held the line between order and starvation—one more hand shaping the timbers that would carry survivors home.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'georgian-britain' AND c.card_type = 'character' AND c.name = 'James Mitchell'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'A marine sworn to discipline in a company falling to mutiny, he bore witness when authority cracked—and survived the long reckoning that followed.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'georgian-britain' AND c.card_type = 'character' AND c.name = 'John Duck'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'He reached Spanish Chile broken but breathing, traded his story for shelter, and waited—knowing London would demand an account of everything the Wager had done.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'georgian-britain' AND c.card_type = 'character' AND c.name = 'Robert Pemberton'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'From the naval yards of England the squadron weighed anchor—men, provisions, and orders to round the world and strike at Spanish plate.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'georgian-britain' AND c.card_type = 'location' AND c.name = 'Portsmouth, England'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'Where the Atlantic meets the Pacific in fury, the Wager met a gale that no seamanship could tame—and the southern ocean claimed another victim.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'georgian-britain' AND c.card_type = 'location' AND c.name = 'Cape Horn'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'A desolate Patagonian shore where shattered timber became shelter, quarrel became mutiny, and two hundred souls learned how small England feels.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'georgian-britain' AND c.card_type = 'location' AND c.name = 'Wager Island, Patagonia, Chile'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'Narrow waters, bitter winds, and charts that lied—many a ship gambled on the strait rather than face the Horn, and many lost.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'georgian-britain' AND c.card_type = 'location' AND c.name = 'The Strait of Magellan'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'Where Bulkeley''s starving crew at last tasted port wine and civilisation—Brazil''s harbour offered salvation to those who had sailed through hell.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'georgian-britain' AND c.card_type = 'location' AND c.name = 'Rio de Janeiro, Brazil'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'Off the coast of Spanish Chile, castaways fetched up on fog-bound shores—half the world from home, alive by accident and stubborn luck.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'georgian-britain' AND c.card_type = 'location' AND c.name = 'Chiloé Island, Chile'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'In the high capital of Chile the survivors became prisoners of hospitality and suspicion—Spanish captains and English officers trading questions, not trust.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'georgian-britain' AND c.card_type = 'location' AND c.name = 'Santiago, Chile'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'In Whitehall''s stone halls the survivors faced not enemies but their own navy—court-martials that would decide whether wreck and mutiny were crime or courage.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'georgian-britain' AND c.card_type = 'location' AND c.name = 'The Admiralty, London, England'
);
