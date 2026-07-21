export function isLocalUploadUrl(url: string): boolean {
  return url.startsWith("/uploads/");
}

export function isSupabasePublicUploadUrl(url: string): boolean {
  return /\/storage\/v1\/object\/public\/[^/]+\/(characters|packs|books)\//.test(url);
}

export function isHostedUploadUrl(url: string): boolean {
  return isLocalUploadUrl(url) || isSupabasePublicUploadUrl(url);
}

export function isCustomBookCoverUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith("/uploads/books/") || /\/storage\/v1\/object\/public\/[^/]+\/books\//.test(url);
}
