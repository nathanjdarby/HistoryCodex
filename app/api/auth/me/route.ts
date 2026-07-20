import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { getCurrentUser } from "@/lib/server/auth-context";
import { resolveDisplayName } from "@/lib/user-display-name";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname,
        displayNameAs: user.displayNameAs,
        displayName: resolveDisplayName(user),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
