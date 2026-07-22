export const THEME_STORAGE_KEY = "historycodex-theme";

export type ThemePreference = "light" | "dark";

export function resolveThemePreference(stored: string | null | undefined): ThemePreference {
  return stored === "light" ? "light" : "dark";
}

export function themeHtmlClass(theme: ThemePreference): string {
  return theme === "dark" ? "dark" : "";
}
