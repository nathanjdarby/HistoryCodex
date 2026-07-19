import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { USER_ROLE_ENUM, users } from "@/db/schema";
import { ApiError } from "@/lib/api-utils";
import { getUserStats } from "@/lib/server/stats";

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return user;
}

export async function createUser(
  email: string,
  password: string,
  role: (typeof USER_ROLE_ENUM)[number] = "user",
) {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const [created] = await db
      .insert(users)
      .values({ email: normalizedEmail, passwordHash, role })
      .returning();
    await getUserStats(created.id);
    return created;
  } catch {
    throw new ApiError(409, "An account with this email already exists");
  }
}
