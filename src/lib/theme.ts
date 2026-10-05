/**
 * Light and dark theme: the visitor's choice when they made one, otherwise what
 * their system asks for. The theme is a class on <html> (see src/styles.css).
 */
export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "air-clear:theme";
const DARK_CLASS = "dark";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function parseTheme(value: unknown): Theme | null {
  return (THEMES as readonly unknown[]).includes(value) ? (value as Theme) : null;
}

export function resolveTheme(stored: unknown, systemPrefersDark: boolean): Theme {
  return parseTheme(stored) ?? (systemPrefersDark ? "dark" : "light");
}

export function nextTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

/** Storage can be missing or blocked (private mode); then the system setting applies. */
export function readStoredTheme(storage: StorageLike | null | undefined): Theme | null {
  try {
    return parseTheme(storage?.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function storeTheme(storage: StorageLike | null | undefined, theme: Theme): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Not being able to remember is harmless.
  }
}

export function applyTheme(root: Pick<HTMLElement, "classList">, theme: Theme): void {
  root.classList.toggle(DARK_CLASS, theme === "dark");
}

export function currentTheme(root: Pick<HTMLElement, "classList">): Theme {
  return root.classList.contains(DARK_CLASS) ? "dark" : "light";
}

/**
 * Runs in <head> before the first paint, so a dark-theme visitor never sees a
 * light flash. Kept in step with resolveTheme and applyTheme above.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var d=s==="dark"||(s!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle(${JSON.stringify(
  DARK_CLASS,
)},d)}catch(e){}})()`;
