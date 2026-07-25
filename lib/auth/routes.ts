/** Player-facing app routes — admins are redirected away from these. */
export const USER_APP_PREFIXES = [
  "/timeline",
  "/books",
  "/collection",
  "/packs",
  "/entries",
  "/profile",
  "/about",
  "/campaigns",
  "/play",
] as const;

/** Player-facing API routes — admins receive 403 on these. */
export const USER_API_PREFIXES = [
  "/api/stats",
  "/api/books",
  "/api/catalog-books",
  "/api/packs",
  "/api/entries",
  "/api/profile",
  "/api/decks",
  "/api/catalog-decks",
  "/api/matches",
] as const;

/** Play APIs admins may call when testing from /admin/play. */
export const ADMIN_PLAY_API_PREFIXES = [
  "/api/decks",
  "/api/catalog-decks",
  "/api/matches",
] as const;

export function isAdminPlayApiPath(pathname: string): boolean {
  return ADMIN_PLAY_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isUserAppPath(pathname: string): boolean {
  if (pathname === "/dashboard") return true;
  return USER_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isUserApiPath(pathname: string): boolean {
  if (pathname.match(/^\/api\/characters\/\d+\/unlock$/)) return true;
  return USER_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function defaultPathForRole(role: "user" | "admin"): string {
  return role === "admin" ? "/admin" : "/dashboard";
}
