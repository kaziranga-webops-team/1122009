/**
 * The portal's existing light/dark state, in one place.
 *
 * It is a `dark` class on <html>, persisted in localStorage under `kazi-theme`,
 * falling back to the OS preference — exactly what ThemeToggle and the command
 * palette already do. This module only names that logic so the landscape hero
 * can reuse it rather than carry a third copy.
 */
export const THEME_STORAGE_KEY = 'kazi-theme';

/** Same resolution as ThemeToggle: stored 'dark', or nothing stored and the OS prefers dark. */
export function resolveDarkTheme(): boolean {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    // Storage can be blocked (private modes); fall through to the OS preference.
  }
  const prefersDark =
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return stored === 'dark' || (!stored && prefersDark);
}

export function applyStoredTheme(): void {
  document.documentElement.classList.toggle('dark', resolveDarkTheme());
}
