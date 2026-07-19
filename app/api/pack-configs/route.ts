import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/server/auth-context";
import { createPackConfig, listPackConfigs, packConfigInputSchema } from "@/lib/server/packs";

export async function GET() {
  try {
    await requireAdmin();
    const data = await listPackConfigs();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const input = packConfigInputSchema.parse(body);
    const created = await createPackConfig(input);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
