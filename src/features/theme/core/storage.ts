import {
  ClassicColorScheme,
  isColorScheme,
  isThemePreset,
  THEME_STORAGE,
  ThemePreset,
} from './constants';

export interface StoredThemeState {
  preset: ThemePreset;
  classicScheme: ClassicColorScheme;
  scheme: ClassicColorScheme;
  valid: boolean;
}

export function readThemeStorage(enabled = true): StoredThemeState {
  const fallback: StoredThemeState = {
    preset: 'classic',
    classicScheme: 'system',
    scheme: 'system',
    valid: false,
  };
  if (!enabled) return fallback;
  try {
    const preset = localStorage.getItem(THEME_STORAGE.preset);
    const classic = localStorage.getItem(THEME_STORAGE.classic);
    const scheme = localStorage.getItem(THEME_STORAGE.scheme);
    if (
      (preset !== null && !isThemePreset(preset)) ||
      (classic !== null && !isColorScheme(classic)) ||
      (scheme !== null && !isColorScheme(scheme))
    ) {
      return fallback;
    }
    return {
      preset: preset || 'classic',
      classicScheme: classic || 'system',
      scheme: scheme || 'system',
      valid: true,
    };
  } catch {
    // 隐私模式或存储被禁用时，主题故障不能阻断业务页面。
    return fallback;
  }
}

export function writeThemeStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
