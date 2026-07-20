-- Flavor text for General Sudirman (Indonesia era character card).
UPDATE characters
SET flavor_text = 'Young in rank but steadfast in command, he led a barefoot army through jungle and rice fields. Illness could not unseat him—only the struggle for merdeka mattered.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'character' AND c.name = 'General Sudirman'
);
