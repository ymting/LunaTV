'use client';

import { useContext } from 'react';

import { ThemePresetContext } from './ThemePresetProvider';

export function useThemePreset() {
  return useContext(ThemePresetContext);
}
