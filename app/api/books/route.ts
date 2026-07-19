import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/server/auth-context";
import {
  addBookToLibrary,
  addToLibrarySchema,
  listBooks,
} from "@/lib/server/books";

export async function GET() {
  try {
    const user = await requireUser();
    const data = await listBooks(user.id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { catalogBookId } = addToLibrarySchema.parse(body);
    const created = await addBookToLibrary(user.id, catalogBookId);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
