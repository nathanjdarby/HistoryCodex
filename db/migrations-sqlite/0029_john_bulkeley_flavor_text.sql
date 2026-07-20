-- Flavor text for John Bulkeley (Georgian Britain character card).
UPDATE characters
SET flavor_text = 'When the Wager shattered on a hostile shore, he shaped her wreckage into a seaworthy boat and steered starving men through gales to Brazil. England read his account—and the court-martial agreed.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'character' AND c.name = 'John Bulkeley'
);
