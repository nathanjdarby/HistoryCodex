import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireAdmin, requireUser } from "@/lib/server/auth-context";
import { createEra, eraInputSchema, listEras } from "@/lib/server/eras";
import { listErasForUser } from "@/lib/server/user-eras";

export async function GET() {
  try {
    const user = await requireUser();
    const data =
      user.role === "admin" ? await listEras() : await listErasForUser(user.id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const input = eraInputSchema.parse(body);
    const created = await createEra(input);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
