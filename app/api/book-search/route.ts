import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import { searchBooks } from "@/lib/server/book-search";

export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const q = request.nextUrl.searchParams.get("q");
    const { results, warnings } = await searchBooks(q ?? "");
    return NextResponse.json({ results, warnings });
  } catch (error) {
    return handleApiError(error);
  }
}
