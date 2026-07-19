-- Flavor text for Sukarno (Indonesia era character card).
UPDATE characters
SET flavor_text = 'When the colonial flag still flew, he proclaimed merdeka to a waiting archipelago. With voice, defiance, and vision he forged a nation from a thousand islands.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'character' AND c.name = 'Sukarno'
);
