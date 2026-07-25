import { NextResponse, type NextRequest } from "next/server";
import {
  defaultPathForRole,
  isAdminPlayApiPath,
  isUserApiPath,
  isUserAppPath,
} from "@/lib/auth/routes";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const GUEST_ONLY_PATHS = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/serve-upload") ||
    pathname.startsWith("/api/card-layouts") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (pathname === "/") {
    if (session) {
      return NextResponse.redirect(new URL(defaultPathForRole(session.role), request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/about") {
    return NextResponse.next();
  }

  if (GUEST_ONLY_PATHS.includes(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL(defaultPathForRole(session.role), request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.role === "admin") {
    if (isUserAppPath(pathname)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (
      pathname.startsWith("/api/") &&
      isUserApiPath(pathname) &&
      !isAdminPlayApiPath(pathname)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const adminApiPrefixes = ["/api/pack-configs", "/api/uploads", "/api/admin"];
  if (
    adminApiPrefixes.some((prefix) => pathname.startsWith(prefix)) &&
    session.role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
