-- Flavor text for location cards (by card name). Londinium already set in 0016.
UPDATE characters
SET flavor_text = 'Stone piled upon stone across decades, reaching for eternity. Pharaohs entered as gods; the pyramid remained when empires vanished.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'location' AND c.name = 'Great Pyramid of Giza'
);

UPDATE characters
SET flavor_text = 'Athena''s temple crowned the Acropolis—marble, proportion, and pride made visible. Democracy argued below; the gods looked on from above.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'location' AND c.name = 'The Parthenon'
);

UPDATE characters
SET flavor_text = 'When the other kingdoms faltered, Wessex endured—fortress, farm, and faith holding the line against the longship and the storm.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'location' AND c.name = 'Kingdom of Wessex'
);

UPDATE characters
SET flavor_text = 'Steam rose from the sacred springs long before the Georgians came. They built terraces of stone around old Roman waters and called it fashionable.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'location' AND c.name = 'Bath'
);

UPDATE characters
SET flavor_text = 'Crown jewels, ravens, and the memory of the axe—the Tower has guarded, imprisoned, and terrified London since the Conqueror''s day.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'location' AND c.name = 'Tower of London'
);

UPDATE characters
SET flavor_text = 'In silent rooms of paper and wire, clerks and scholars broke codes the enemy believed unbreakable—and shortened the war without firing a shot.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'location' AND c.name = 'Bletchley Park'
);

UPDATE characters
SET flavor_text = 'Red sandstone walls enclosed the Mughal emperors'' splendour—throne, serai, and the peacock''s dream made stone in Delhi.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'location' AND c.name = 'Red Fort'
);

UPDATE characters
SET flavor_text = 'Eighty arches opened onto sand and blood. Rome cheered as gladiator and beast fought beneath the emperor''s gaze—and called it peace.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'location' AND c.name = 'The Colosseum'
);

UPDATE characters
SET flavor_text = 'Kings plotted, preachers railed, and Cromwell''s soldiers tramped through halls where Tudor pageantry once dazzled—all politics under one roof.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'location' AND c.name = 'Palace of Whitehall'
);

UPDATE characters
SET flavor_text = 'A million souls lived within its walls at the Tang height—silk, scripture, and tribute converging on the western capital of the Middle Kingdom.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'location' AND c.name = 'Chang''an'
);

UPDATE characters
SET flavor_text = 'Henry''s hall still echoes with feasting; William''s gardens stretch in geometric pride. Two dynasties, one palace, and the Thames flowing past.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'location' AND c.name = 'Hampton Court Palace'
);

UPDATE characters
SET flavor_text = 'Iron and glass rose like a cathedral to industry—an empire on display under one vast shimmering roof, lit by the optimism of the age.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE c.card_type = 'location' AND c.name = 'Crystal Palace'
);
