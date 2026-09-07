'use client';

import { Palette } from 'lucide-react';

import { useThemePreset } from '../core/useThemePreset';

export default function ThemePresetMenu() {
  const { preset, setPreset, enabled, ready } = useThemePreset();
  if (!enabled || !ready) return null;

  return (
    <label className='theme-preset-menu'>
      <Palette size={16} aria-hidden='true' />
      <span className='sr-only'>界面风格</span>
      <select
        aria-label='界面风格'
        value={preset}
        onChange={(event) =>
          setPreset(event.target.value === 'netflix' ? 'netflix' : 'classic')
        }
      >
        <option value='classic'>经典主题</option>
        <option value='netflix'>Netflix 风格</option>
      </select>
    </label>
  );
}
