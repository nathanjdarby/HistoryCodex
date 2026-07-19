import type { InferSelectModel } from "drizzle-orm";
import type {
  eras,
  books,
  timelineEntries,
  entryLinks,
  characters,
  userCharacters,
  pointsLedger,
  userStats,
  users,
  catalogBooks,
} from "@/db/schema";

export type Era = InferSelectModel<typeof eras>;
export type Book = InferSelectModel<typeof books> & { catalogBookId: number };
export type CatalogBook = InferSelectModel<typeof catalogBooks>;
export type TimelineEntry = InferSelectModel<typeof timelineEntries>;
export type EntryLink = InferSelectModel<typeof entryLinks>;
export type Character = InferSelectModel<typeof characters>;
export type User = InferSelectModel<typeof users>;
export type UserCharacter = InferSelectModel<typeof userCharacters>;
export type PointsLedgerRow = InferSelectModel<typeof pointsLedger>;
export type UserStats = InferSelectModel<typeof userStats>;
