-- Flavor text for David Cheap (Georgian Britain character card).
UPDATE characters
SET flavor_text = 'Shipwrecked on a hostile shore and deposed by mutineers, he crossed wilderness and ocean to reach home again. The court-martial cleared his name—the sea had not finished with him.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'character' AND c.name = 'David Cheap'
);
