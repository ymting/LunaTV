'use client';

import { useTheme } from 'next-themes';
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ClassicColorScheme,
  isColorScheme,
  isThemePreset,
  THEME_COLORS,
  THEME_STORAGE,
  ThemePreset,
} from './constants';
import { readThemeStorage, writeThemeStorage } from './storage';

export interface ThemePresetContextValue {
  preset: ThemePreset;
  isNetflix: boolean;
  setPreset: (preset: ThemePreset) => void;
  enabled: boolean;
  ready: boolean;
}

export const ThemePresetContext = createContext<ThemePresetContextValue>({
  preset: 'classic',
  isNetflix: false,
  setPreset: () => undefined,
  enabled: false,
  ready: false,
});

function applyDocumentTheme(preset: ThemePreset, scheme: ClassicColorScheme) {
  const root = document.documentElement;
  const dark =
    preset === 'netflix' ||
    scheme === 'dark' ||
    (scheme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (preset === 'netflix') root.setAttribute('data-theme', 'netflix');
  else root.removeAttribute('data-theme');
  root.classList.remove('light', 'dark');
  root.classList.add(dark ? 'dark' : 'light');
  root.style.colorScheme = dark ? 'dark' : 'light';
  const color =
    preset === 'netflix'
      ? THEME_COLORS.netflix
      : dark
      ? THEME_COLORS.dark
      : THEME_COLORS.light;
  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]'
  );
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  if (meta.content !== color) meta.content = color;
}

export function ThemePresetProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // 服务端和第一次客户端渲染始终一致；首帧配色已由 head 脚本接管。
  const [preset, updatePreset] = useState<ThemePreset>('classic');
  const [ready, setReady] = useState(false);
  const presetRef = useRef<ThemePreset>('classic');
  const classicRef = useRef<ClassicColorScheme>('system');
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const setThemeRef = useRef(setTheme);
  setThemeRef.current = setTheme;

  const apply = useCallback((next: ThemePreset, scheme: ClassicColorScheme) => {
    presetRef.current = next;
    updatePreset(next);
    applyDocumentTheme(next, scheme);
    const actual = next === 'netflix' ? 'dark' : scheme;
    if (themeRef.current !== actual) setThemeRef.current(actual);
  }, []);

  useEffect(() => {
    const stored = readThemeStorage(enabled);
    classicRef.current = stored.classicScheme;
    apply(stored.preset, stored.scheme);
    setReady(true);

    const sync = (event: StorageEvent) => {
      try {
        if (event.storageArea && event.storageArea !== localStorage) return;
      } catch {
        apply('classic', 'system');
        return;
      }
      if (
        event.key !== null &&
        !Object.values(THEME_STORAGE).some((key) => key === event.key)
      ) {
        return;
      }
      const next = readThemeStorage(enabled);
      classicRef.current = next.classicScheme;
      // 离开 Netflix 的事件必须恢复保存的偏好，不能沿用临时 dark。
      const restoring =
        presetRef.current === 'netflix' && next.preset === 'classic';
      apply(next.preset, restoring ? next.classicScheme : next.scheme);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [apply, enabled]);

  const setPreset = useCallback(
    (next: ThemePreset) => {
      if (!enabled || !isThemePreset(next) || next === presetRef.current)
        return;
      if (next === 'netflix') {
        classicRef.current = isColorScheme(themeRef.current)
          ? themeRef.current
          : 'system';
        if (!writeThemeStorage(THEME_STORAGE.classic, classicRef.current)) {
          apply('classic', 'system');
          return;
        }
      }
      if (!writeThemeStorage(THEME_STORAGE.preset, next)) {
        apply('classic', 'system');
        return;
      }
      apply(next, classicRef.current);
    },
    [apply, enabled]
  );

  useEffect(() => {
    if (!ready) return;
    const scheme = isColorScheme(theme) ? theme : 'system';
    if (!isColorScheme(theme)) setThemeRef.current('system');
    if (preset === 'netflix' && theme !== 'dark') setThemeRef.current('dark');
    applyDocumentTheme(preset, scheme);
    // 旧 ThemeToggle 在路由切换时也写 meta；局部监听保证同一最终颜色。
    const observer = new MutationObserver(() => {
      applyDocumentTheme(preset, scheme);
    });
    observer.observe(document.head, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['content'],
    });
    return () => observer.disconnect();
  }, [preset, ready, resolvedTheme, theme]);

  const value = useMemo(
    () => ({
      preset,
      isNetflix: preset === 'netflix',
      setPreset,
      enabled,
      ready,
    }),
    [enabled, preset, ready, setPreset]
  );
  return (
    <ThemePresetContext.Provider value={value}>
      {children}
    </ThemePresetContext.Provider>
  );
}
