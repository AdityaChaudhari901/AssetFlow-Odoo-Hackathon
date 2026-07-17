export const THEME_STORAGE_KEY = "assetflow-theme";
export const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

const THEME_COLORS = {
  dark: "#18161d",
  light: "#ffffff",
};

export function isExplicitTheme(theme) {
  return theme === "light" || theme === "dark";
}

export function resolveTheme(theme, systemTheme) {
  if (isExplicitTheme(theme)) {
    return theme;
  }

  return isExplicitTheme(systemTheme) ? systemTheme : "light";
}

export function getThemeColor(theme) {
  return THEME_COLORS[resolveTheme(theme, "light")];
}
