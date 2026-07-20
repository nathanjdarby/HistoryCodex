-- Standard booster packs now contain 10 cards (two reveal rows of five).
UPDATE booster_packs SET cards_per_pack = 10, updated_at = unixepoch();
