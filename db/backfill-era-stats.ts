import { sql } from "drizzle-orm";
import { db } from "./index";

/**
 * Backfill user_era_stats from historical milestone earnings and era-scoped pack spend.
 * Safe to rerun — uses ON CONFLICT DO NOTHING then UPDATE from aggregated ledger.
 */
async function main() {
  const earned = await db.execute(sql`
    INSERT INTO user_era_stats (user_id, era_id, points_balance, total_points_earned, updated_at)
    SELECT
      pl.user_id,
      b.era_id,
      0,
      SUM(pl.points),
      now()
    FROM points_ledger pl
    INNER JOIN books b ON b.id = pl.book_id
    WHERE pl.type LIKE 'milestone_%'
      AND pl.points > 0
      AND b.era_id IS NOT NULL
    GROUP BY pl.user_id, b.era_id
    ON CONFLICT (user_id, era_id) DO NOTHING
  `);

  await db.execute(sql`
    UPDATE user_era_stats
    SET
      total_points_earned = (
        SELECT COALESCE(SUM(pl.points), 0)
        FROM points_ledger pl
        INNER JOIN books b ON b.id = pl.book_id
        WHERE pl.user_id = user_era_stats.user_id
          AND b.era_id = user_era_stats.era_id
          AND pl.type LIKE 'milestone_%'
          AND pl.points > 0
      ),
      points_balance = (
        SELECT COALESCE(SUM(pl.points), 0)
        FROM points_ledger pl
        INNER JOIN books b ON b.id = pl.book_id
        WHERE pl.user_id = user_era_stats.user_id
          AND b.era_id = user_era_stats.era_id
          AND pl.type LIKE 'milestone_%'
          AND pl.points > 0
      ) - (
        SELECT COALESCE(SUM(ABS(pl.points)), 0)
        FROM points_ledger pl
        WHERE pl.user_id = user_era_stats.user_id
          AND pl.type = 'spend_pack'
          AND pl.era_id = user_era_stats.era_id
      ),
      updated_at = now()
  `);

  console.log(`Backfill touched ${earned.rowCount ?? 0} new user/era row(s). Era stats recalculated.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
