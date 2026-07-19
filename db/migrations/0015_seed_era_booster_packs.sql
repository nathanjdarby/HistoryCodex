-- One booster pack per era that does not already have one, matching existing pack settings
-- (150 pts, 9 cards, 55/27/12/5/1/1 rarity weights, any card type).
INSERT INTO booster_packs (
  name,
  description,
  price,
  era_id,
  cards_per_pack,
  card_type,
  weight_common,
  weight_uncommon,
  weight_rare,
  weight_epic,
  weight_legendary,
  weight_mythic,
  active
)
SELECT
  eras.name,
  NULL,
  150,
  eras.id,
  9,
  NULL,
  55,
  27,
  12,
  5,
  1,
  1,
  1
FROM eras
WHERE NOT EXISTS (
  SELECT 1 FROM booster_packs WHERE booster_packs.era_id = eras.id
);
