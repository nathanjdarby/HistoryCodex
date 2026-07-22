import { cookies } from "next/headers";
import { THEME_STORAGE_KEY, resolveThemePreference, type ThemePreference } from "@/lib/theme";

export async function getServerThemePreference(): Promise<ThemePreference> {
  const cookieStore = await cookies();
  return resolveThemePreference(cookieStore.get(THEME_STORAGE_KEY)?.value);
}
