// src/themes/themeRegistry.ts
export const THEMES = {
  classic: {
    name: "Classic Deeprastore",
    path: "@/themes/classic",
    description: "Current stable production theme",
  },
  editorial_boutique: {
    name: "Editorial Boutique",
    path: "@/themes/editorial_boutique",
    description: "Ashion‑inspired editorial boutique theme",
  },
} as const;

export type ThemeKey = keyof typeof THEMES;

/**
 * Reads the currently selected theme from a JSON config file.
 * In a real CMS this would be stored in a database or settings table.
 */
export function getCurrentTheme(): ThemeKey {
  try {
    // eslint‑disable-next-line @typescript-eslint/no-var-requires
    const config = require("../themeConfig.json");
    const theme = config.theme as ThemeKey;
    if (theme && THEMES[theme]) {
      return theme;
    }
  } catch (e) {
    // ignore and fall back
  }
  return "classic";
}

/**
 * Helper to get the import path for the theme's root component.
 */
export function getThemeRootPath(theme: ThemeKey): string {
  return THEMES[theme].path + "/index";
}
