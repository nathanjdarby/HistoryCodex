-- Flavor text for Roman Britain era cards (by card name).
UPDATE characters
SET flavor_text = 'When the eagles marched inland, the war-bands did not scatter—they painted themselves for death and met iron with fury.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-britain' AND c.name = 'Celtic War-Bandists'
);

UPDATE characters
SET flavor_text = 'The ouate read the birds, the bones, and the boundary stones—keeper of tribal memory when Rome tried to rewrite it.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-britain' AND c.name = 'Tribal Ouate'
);

UPDATE characters
SET flavor_text = 'Rome gave him a diadem and a magistrate''s seal. He bowed in the forum and ruled in the hillfort, smiling at both masters.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-britain' AND c.name = 'Client-King Magistrate'
);

UPDATE characters
SET flavor_text = 'From the grazing hills to the tribal markets, he drove horn and hide along paths Rome''s surveyors never mapped.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-britain' AND c.name = 'Cattle Drover'
);

UPDATE characters
SET flavor_text = 'Woad marked him as death''s herald before the first blow fell. Legionaries learned to dread the blue streaks gleaming in the mist.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-britain' AND c.name = 'Woad-Stained Champion'
);

UPDATE characters
SET flavor_text = 'In oak groves older than Rome, he read the sky, the sick, and the omens—and told no centurion what the gods had said.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-britain' AND trim(c.name) = 'Druid'
);

UPDATE characters
SET flavor_text = 'No province stamped his authority, yet the hill tribes rose when he called—an insurgent king Rome could not buy and could not ignore.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-britain' AND c.name = 'Tribal Insurgent'
);

UPDATE characters
SET flavor_text = 'Cornwall''s tin flowed to the Mediterranean while Rome watched its frontiers. He weighed every ingot and knew the empire''s hunger.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-britain' AND c.name = 'Tin Baron of Cornwall'
);

UPDATE characters
SET flavor_text = 'Where the Thames could be bridged, Rome built a city—and Londinium became the threshold where Britannia entered the empire''s order.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-britain' AND c.name = 'Londinium'
);

UPDATE characters
SET flavor_text = 'When Rome flogged a queen and seized her kingdom, she answered with fire—Camulodunum, Verulamium, and Londinium burned in her wrath.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-britain' AND c.name = 'Boudica'
);

UPDATE characters
SET flavor_text = 'Hunted through the Welsh hills, captured before Claudius, yet he spoke as a king unbroken—and Rome, astonished, let him live.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-britain' AND c.name = 'Caratacus'
);
