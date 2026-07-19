-- Flavor text for character cards missing quotes (by card name).
UPDATE characters
SET flavor_text = 'She wore the false beard of kings and ruled as Pharaoh in her own name. While rivals were chiselled from the walls, her obelisks still shout across the centuries.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'character' AND c.name = 'Hatshepsut'
);

UPDATE characters
SET flavor_text = 'When the Danes held the kingdom, he hid in the marshes, learned their ways, and returned—not merely to reign, but to rebuild a realm worth defending.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'character' AND c.name = 'Alfred The Great'
);

UPDATE characters
SET flavor_text = 'At Brunanburh he broke the northern alliance and claimed a title no Saxon king had held before—the first true King of all England.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'character' AND c.name = 'Athelstan: The First King of England'
);

UPDATE characters
SET flavor_text = 'He spoke little English and loved Hanover more than London, yet his crown steadied a kingdom still haunted by civil war and disputed succession.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'character' AND c.name = 'George I'
);

UPDATE characters
SET flavor_text = 'At Dettingen he rode into musket fire—the last British king to lead his soldiers on the battlefield—and lent the Hanoverian line its stubborn nerve.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'character' AND c.name = 'George II'
);

UPDATE characters
SET flavor_text = 'Madness and majesty shared his throne; he lost America, endured riot and war, and outlived storms of opinion to die the longest-reigning king.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'character' AND c.name = 'George III'
);

UPDATE characters
SET flavor_text = 'He spent a fortune on palaces and pageantry while the country groaned under debt. Flamboyant, ridiculed, unforgettable—he turned the crown into theatre.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'character' AND c.name = 'George IV'
);

UPDATE characters
SET flavor_text = 'The Sailor King cast off the navy''s discipline for parliament''s quarrels, and in his short reign opened the door to a reformed Britain.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'character' AND c.name = 'William IV'
);

UPDATE characters
SET flavor_text = 'Six marriages, one break with Rome, and a crown that answered to no pope—he remade England''s soul to suit his dynasty and his appetite.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'character' AND c.name = 'Henry VIII'
);
