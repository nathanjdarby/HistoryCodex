import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { DISPLAY_NAME_AS_ENUM, users } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import {
  displayNameOptions,
  normalizeDisplayNameAs,
  resolveDisplayName,
  type DisplayNameAs,
} from "@/lib/user-display-name";

function trimToNull(value: string | undefined | null) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const userProfileInputSchema = z.object({
  firstName: z.string().max(80).nullable().optional(),
  lastName: z.string().max(80).nullable().optional(),
  nickname: z.string().max(40).nullable().optional(),
  displayNameAs: z.enum(DISPLAY_NAME_AS_ENUM).optional(),
});

export type UserProfile = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  displayNameAs: DisplayNameAs;
  displayName: string;
  displayNameOptions: ReturnType<typeof displayNameOptions>;
};

function toProfile(row: typeof users.$inferSelect): UserProfile {
  const fields = {
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    nickname: row.nickname,
    displayNameAs: row.displayNameAs,
  };

  return {
    id: row.id,
    ...fields,
    displayName: resolveDisplayName(fields),
    displayNameOptions: displayNameOptions(fields),
  };
}

export async function getUserProfile(userId: number): Promise<UserProfile> {
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  if (!row) throw new ApiError(404, "User not found");
  return toProfile(row);
}

export async function updateUserProfile(
  userId: number,
  input: z.infer<typeof userProfileInputSchema>,
): Promise<UserProfile> {
  const parsed = userProfileInputSchema.parse(input);

  const [existing] = await db.select().from(users).where(eq(users.id, userId));
  if (!existing) throw new ApiError(404, "User not found");

  const firstName =
    parsed.firstName !== undefined ? trimToNull(parsed.firstName) : existing.firstName;
  const lastName =
    parsed.lastName !== undefined ? trimToNull(parsed.lastName) : existing.lastName;
  const nickname =
    parsed.nickname !== undefined ? trimToNull(parsed.nickname) : existing.nickname;

  const displayNameAs = normalizeDisplayNameAs(
    parsed.displayNameAs ?? existing.displayNameAs,
    { firstName, lastName, nickname },
  );

  const [updated] = await db
    .update(users)
    .set({
      firstName,
      lastName,
      nickname,
      displayNameAs,
    })
    .where(eq(users.id, userId))
    .returning();

  return toProfile(updated);
}
