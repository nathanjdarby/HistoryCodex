-- Custom SQL migration file, put your code below! --

-- Seeds a default pack config matching the previously hardcoded pack behavior
-- (any era, 50 points, 55/27/12/5/1 rarity weights) so /packs keeps working
-- immediately after migrating, before an admin configures anything.
INSERT INTO booster_packs (name, description, price, era_id, weight_common, weight_uncommon, weight_rare, weight_epic, weight_legendary, active)
SELECT 'Standard Pack', 'Any-era pack with the original fixed odds.', 50, NULL, 55, 27, 12, 5, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM booster_packs);
