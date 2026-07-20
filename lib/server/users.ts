import bcrypt from "bcryptjs";
import { count, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  antiCheatEvents,
  books,
  matches,
  pointsLedger,
  readingSessions,
  USER_ROLE_ENUM,
  userCampaignProgress,
  userCharacters,
  userDeckCards,
  userDecks,
  userEraStats,
  userPointCaps,
  users,
  userStats,
  verificationQueue,
} from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { deleteBook } from "@/lib/server/books";
import { getUserStats } from "@/lib/server/stats";

export const adminUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(USER_ROLE_ENUM),
  pointsBalance: z.number().int().min(0).optional(),
});

export const adminUserUpdateSchema = adminUserInputSchema.partial().extend({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export type AdminUserSummary = {
  id: number;
  email: string;
  role: (typeof USER_ROLE_ENUM)[number];
  createdAt: Date;
  pointsBalance: number;
  totalPointsEarned: number;
  booksFinished: number;
  booksTotal: number;
  booksReading: {
    id: number;
    title: string;
    author: string | null;
    currentPage: number;
    totalPages: number;
    status: "to_read" | "reading" | "finished";
  }[];
  cardsOwned: number;
};

async function loadUserSummaries(userIds: number[]): Promise<AdminUserSummary[]> {
  if (userIds.length === 0) return [];

  const userRows = await db
    .select()
    .from(users)
    .where(inArray(users.id, userIds))
    .orderBy(desc(users.createdAt));

  const statsRows = await db
    .select()
    .from(userStats)
    .where(inArray(userStats.userId, userIds));
  const statsByUserId = new Map(statsRows.map((row) => [row.userId, row]));

  const bookRows = await db.select().from(books).where(inArray(books.userId, userIds));
  const booksByUserId = new Map<number, typeof bookRows>();
  for (const book of bookRows) {
    const list = booksByUserId.get(book.userId) ?? [];
    list.push(book);
    booksByUserId.set(book.userId, list);
  }

  const cardCountRows = await db
    .select({ userId: userCharacters.userId, value: count() })
    .from(userCharacters)
    .where(inArray(userCharacters.userId, userIds))
    .groupBy(userCharacters.userId);
  const cardsByUserId = new Map(cardCountRows.map((row) => [row.userId, row.value]));

  return userRows.map((user) => {
    const stats = statsByUserId.get(user.id);
    const userBooks = booksByUserId.get(user.id) ?? [];
    const readingBooks = userBooks
      .filter((book) => book.status === "reading")
      .map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        currentPage: book.currentPage,
        totalPages: book.totalPages,
        status: book.status,
      }));

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      pointsBalance: stats?.pointsBalance ?? 0,
      totalPointsEarned: stats?.totalPointsEarned ?? 0,
      booksFinished: stats?.booksFinished ?? 0,
      booksTotal: userBooks.length,
      booksReading: readingBooks,
      cardsOwned: cardsByUserId.get(user.id) ?? 0,
    };
  });
}

export async function listUsersForAdmin() {
  const allUsers = await db.select({ id: users.id }).from(users).orderBy(desc(users.createdAt));
  return loadUserSummaries(allUsers.map((user) => user.id));
}

export async function getUserForAdmin(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) throw new ApiError(404, "User not found");
  const [summary] = await loadUserSummaries([id]);
  return summary;
}

export async function createUserForAdmin(input: z.infer<typeof adminUserInputSchema>) {
  if (!input.password) {
    throw new ApiError(400, "Password is required when creating a user");
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 10);

  let createdUser;
  try {
    [createdUser] = await db
      .insert(users)
      .values({ email: normalizedEmail, passwordHash, role: input.role })
      .returning();
  } catch {
    throw new ApiError(409, "An account with this email already exists");
  }

  const stats = await getUserStats(createdUser.id);
  if (input.pointsBalance !== undefined && input.pointsBalance !== stats.pointsBalance) {
    await db
      .update(userStats)
      .set({
        pointsBalance: input.pointsBalance,
        totalPointsEarned: input.pointsBalance,
        updatedAt: new Date(),
      })
      .where(eq(userStats.userId, createdUser.id));
  }

  return getUserForAdmin(createdUser.id);
}

export async function updateUserForAdmin(
  id: number,
  input: z.infer<typeof adminUserUpdateSchema>,
  actingUserId: number,
) {
  const [existing] = await db.select().from(users).where(eq(users.id, id));
  if (!existing) throw new ApiError(404, "User not found");

  if (id === actingUserId && input.role === "user") {
    throw new ApiError(400, "You cannot demote your own admin account");
  }

  if (input.role === "user" && existing.role === "admin") {
    const adminRows = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
    if (adminRows.length <= 1) {
      throw new ApiError(400, "Cannot demote the last admin account");
    }
  }

  const updates: Partial<typeof users.$inferInsert> = {};
  if (input.email !== undefined) {
    updates.email = input.email.trim().toLowerCase();
  }
  if (input.role !== undefined) {
    updates.role = input.role;
  }
  if (input.password) {
    updates.passwordHash = await bcrypt.hash(input.password, 10);
  }

  if (Object.keys(updates).length > 0) {
    try {
      await db.update(users).set(updates).where(eq(users.id, id));
    } catch {
      throw new ApiError(409, "An account with this email already exists");
    }
  }

  if (input.pointsBalance !== undefined) {
    const stats = await getUserStats(id);
    const delta = input.pointsBalance - stats.pointsBalance;
    if (delta !== 0) {
      await db.insert(pointsLedger).values({
        userId: id,
        type: "manual_adjust",
        points: delta,
      });
      await db
        .update(userStats)
        .set({
          pointsBalance: input.pointsBalance,
          totalPointsEarned:
            delta > 0 ? stats.totalPointsEarned + delta : stats.totalPointsEarned,
          updatedAt: new Date(),
        })
        .where(eq(userStats.userId, id));
    }
  }

  return getUserForAdmin(id);
}

async function clearUserGameState(userId: number) {
  // Verification rows reference ledger/session ids — remove before points or books.
  await db.delete(verificationQueue).where(eq(verificationQueue.userId, userId));
  await db.delete(antiCheatEvents).where(eq(antiCheatEvents.userId, userId));

  await db.delete(matches).where(eq(matches.userId, userId));

  const deckRows = await db
    .select({ id: userDecks.id })
    .from(userDecks)
    .where(eq(userDecks.userId, userId));
  if (deckRows.length > 0) {
    const deckIds = deckRows.map((row) => row.id);
    await db.delete(userDeckCards).where(inArray(userDeckCards.deckId, deckIds));
    await db.delete(userDecks).where(eq(userDecks.userId, userId));
  }

  const userBooks = await db.select({ id: books.id }).from(books).where(eq(books.userId, userId));
  for (const book of userBooks) {
    await deleteBook(book.id);
  }

  await db.delete(userCharacters).where(eq(userCharacters.userId, userId));
  await db.delete(pointsLedger).where(eq(pointsLedger.userId, userId));
  await db.delete(readingSessions).where(eq(readingSessions.userId, userId));

  await db.delete(userEraStats).where(eq(userEraStats.userId, userId));
  await db.delete(userCampaignProgress).where(eq(userCampaignProgress.userId, userId));
  await db.delete(userPointCaps).where(eq(userPointCaps.userId, userId));

  await getUserStats(userId);
  await db
    .update(userStats)
    .set({
      pointsBalance: 0,
      totalPointsEarned: 0,
      booksFinished: 0,
      updatedAt: new Date(),
    })
    .where(eq(userStats.userId, userId));
}

export async function resetUserForAdmin(id: number) {
  const [existing] = await db.select().from(users).where(eq(users.id, id));
  if (!existing) throw new ApiError(404, "User not found");
  await clearUserGameState(id);
  return getUserForAdmin(id);
}

export async function deleteUserForAdmin(id: number, actingUserId: number) {
  if (id === actingUserId) {
    throw new ApiError(400, "You cannot delete your own account");
  }

  const [existing] = await db.select().from(users).where(eq(users.id, id));
  if (!existing) throw new ApiError(404, "User not found");

  if (existing.role === "admin") {
    const adminRows = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
    if (adminRows.length <= 1) {
      throw new ApiError(400, "Cannot delete the last admin account");
    }
  }

  await clearUserGameState(id);
  await db.delete(userStats).where(eq(userStats.userId, id));
  await db.delete(users).where(eq(users.id, id));
}
