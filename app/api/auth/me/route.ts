import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { getCurrentUser } from "@/lib/server/auth-context";

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
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
