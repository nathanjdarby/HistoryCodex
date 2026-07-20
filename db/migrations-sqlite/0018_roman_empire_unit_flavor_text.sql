-- Flavor text for Roman Empire unit cards (by card name).
UPDATE characters
SET flavor_text = 'He marched in the testudo, threw the pilum, and closed with the gladius—discipline forged into steel at the empire''s edge.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-empire' AND c.card_type = 'unit' AND c.name = 'Legionary Gladius-Bearer'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'Every levy, every grain ration, every promotion passed through his tablets—and the machine of empire ran on his ink.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-empire' AND c.card_type = 'unit' AND c.name = 'Imperial Tabularius'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'From the curule seat he spoke with the weight of law. Senators listened, provincials petitioned, and Rome''s order held.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-empire' AND c.card_type = 'unit' AND c.name = 'Curule Magistrate'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'In the Forum''s clamour he found profit—contracts, loans, and favours traded faster than any edict could follow.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-empire' AND c.card_type = 'unit' AND c.name = 'Forum Negotiator'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'They chose emperors and unmade them. The Praetorian barracks ran with politics as much as blood.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-empire' AND c.card_type = 'unit' AND c.name = 'Praetorian Guard'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'Fortune could strip him of all but reason, and reason alone was enough. In Rome''s courts, his calm outlasted every storm.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-empire' AND c.card_type = 'unit' AND c.name = 'Stoic Philosopher'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'The eagles still flew for Rome, but in the provinces a rival standard rose—and legions learned to question who truly wore the purple.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-empire' AND c.card_type = 'unit' AND c.name = 'Provincial Usurper'
);
--> statement-breakpoint
UPDATE characters
SET flavor_text = 'He commanded the fleets that fed Rome—grain from Africa, oil from Spain—and the city held its breath when his ships were late.'
WHERE id = (
  SELECT c.id FROM characters c
  JOIN eras e ON c.era_id = e.id
  WHERE e.slug = 'roman-empire' AND c.card_type = 'unit' AND c.name = 'Princeps Naviculariorum'
);
