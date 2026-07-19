import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "hc_session";

export type SessionUser = {
  userId: number;
  email: string;
  role: "user" | "admin";
};

function getSecret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "historycodex-dev-secret-change-me",
  );
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    userId: user.userId,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.userId !== "number" ||
      typeof payload.email !== "string" ||
      (payload.role !== "user" && payload.role !== "admin")
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  const secure =
    process.env.NODE_ENV === "production" && process.env.AUTH_COOKIE_SECURE !== "false";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
