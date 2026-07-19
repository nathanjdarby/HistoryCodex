import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { createEntry, createEntryForUser, entryFilterSchema, entryInputSchema, listEntriesForUser } from "@/lib/server/entries";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const filter = entryFilterSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    const data = await listEntriesForUser(user.id, filter);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const input = entryInputSchema.parse(body);
    const created = await createEntryForUser(user.id, input);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
