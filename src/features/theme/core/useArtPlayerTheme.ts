'use client';

import { RefObject, useEffect } from 'react';

import { useThemePreset } from './useThemePreset';

type ThemeablePlayer = { theme: string };

// 创建播放器时读取实时 DOM，避免异步初始化闭包捕获切换前的品牌色。
export function getPlayerTheme(): string {
  return typeof document !== 'undefined' &&
    document.documentElement.dataset.theme === 'netflix'
    ? '#e50914'
    : '#22c55e';
}

export function useArtPlayerTheme(
  playerRef: RefObject<ThemeablePlayer | null>
) {
  const { preset } = useThemePreset();

  // 只调用公共主题 setter，不改实例、视频地址或 HLS 生命周期。
  useEffect(() => {
    if (playerRef.current) playerRef.current.theme = getPlayerTheme();
  }, [preset, playerRef]);
}
