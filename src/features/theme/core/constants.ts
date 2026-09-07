export type ThemePreset = 'classic' | 'netflix';
export type ClassicColorScheme = 'system' | 'light' | 'dark';

export const THEME_STORAGE = {
  preset: 'lunatv:theme-preset',
  classic: 'lunatv:classic-color-scheme',
  scheme: 'theme',
} as const;

export const THEME_COLORS = {
  netflix: '#141414',
  dark: '#0c111c',
  light: '#f9fbfe',
  netflixBrand: '#e50914',
  classicBrand: '#22c55e',
} as const;

export function isThemePreset(value: unknown): value is ThemePreset {
  return value === 'classic' || value === 'netflix';
}

export function isColorScheme(value: unknown): value is ClassicColorScheme {
  return value === 'system' || value === 'light' || value === 'dark';
}
