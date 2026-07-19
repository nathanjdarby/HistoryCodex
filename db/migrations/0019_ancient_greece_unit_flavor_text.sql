-- Flavor text for Ancient Greece – Classical unit cards (by card name).
UPDATE characters
SET flavor_text = 'He closed in the press of battle where the spear broke and the xiphos did its work—Greek war turned intimate and merciless.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'ancient-greece-classical' AND c.card_type = 'unit' AND c.name = 'Xiphos Swordsman'
);

UPDATE characters
SET flavor_text = 'Like the father of history before him, he set down what was seen and heard—so the deeds of Greeks and barbarians would not vanish with the witnesses.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'ancient-greece-classical' AND c.card_type = 'unit' AND c.name = 'Herodotian Scribe'
);

UPDATE characters
SET flavor_text = 'For a year he held the archonship and spoke for the polis. Debate in the assembly rose and fell, but the city''s law bore his name.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'ancient-greece-classical' AND c.card_type = 'unit' AND c.name = 'Archon of the Polis'
);

UPDATE characters
SET flavor_text = 'Wine, olives, gossip, and credit changed hands under his awning. The agora''s noise was his ledger, and Athens ran on what he sold.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'ancient-greece-classical' AND c.card_type = 'unit' AND c.name = 'Agora Kapelos'
);

UPDATE characters
SET flavor_text = 'With the hoplon locked in the phalanx he did not yield a palm''s breadth of ground. Sparta asked for nothing louder than his silence in the line.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'ancient-greece-classical' AND c.card_type = 'unit' AND c.name = 'Spartan Hoplon-Bearer'
);

UPDATE characters
SET flavor_text = 'Beneath the colonnades he asked what virtue is, what the good life demands, and whether a city can be just. Athens listened, then argued back.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'ancient-greece-classical' AND c.card_type = 'unit' AND c.name = 'Lyceum Philosopher'
);

UPDATE characters
SET flavor_text = 'Invested with full command, he held the fate of fleet and phalanx in one voice. When the strategos spoke, allies marched or hesitated as one.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'ancient-greece-classical' AND c.card_type = 'unit' AND c.name = 'Strategos Autokrator'
);

UPDATE characters
SET flavor_text = 'He weighed the grain, taxed the ships, and kept the Piraeus honest—or close enough. When trade flowed, Athens ate; when it stalled, the city noticed.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'ancient-greece-classical' AND c.card_type = 'unit' AND c.name = 'Emporarch of Athens'
);
