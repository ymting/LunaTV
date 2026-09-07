import { afterEach, describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';
import React from 'react';

import { ThemePreset } from '../core/constants';
import { ThemePresetContext } from '../core/ThemePresetProvider';
import { getPlayerTheme, useArtPlayerTheme } from '../core/useArtPlayerTheme';

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe('播放器公共主题桥', () => {
  it('主题切换只改变颜色，保留同一个实例及播放状态', () => {
    const player = {
      theme: '#22c55e',
      currentTime: 128,
      volume: 0.7,
      quality: 'HD',
    };
    const ref = { current: player };
    function Bridge() {
      useArtPlayerTheme(ref);
      return null;
    }
    const scene = (preset: ThemePreset) => (
      <ThemePresetContext.Provider
        value={{
          preset,
          isNetflix: preset === 'netflix',
          enabled: true,
          ready: true,
          setPreset: () => undefined,
        }}
      >
        <Bridge />
      </ThemePresetContext.Provider>
    );
    const view = render(scene('classic'));
    document.documentElement.dataset.theme = 'netflix';
    view.rerender(scene('netflix'));
    expect(ref.current).toBe(player);
    expect(player).toEqual({
      theme: '#e50914',
      currentTime: 128,
      volume: 0.7,
      quality: 'HD',
    });
    delete document.documentElement.dataset.theme;
    view.rerender(scene('classic'));
    expect(player.theme).toBe('#22c55e');
  });

  it('异步创建时读取当前预设，允许尚无播放器的加载阶段', () => {
    function PendingBridge() {
      useArtPlayerTheme({ current: null });
      return null;
    }
    expect(() => render(<PendingBridge />)).not.toThrow();
    document.documentElement.dataset.theme = 'netflix';
    expect(getPlayerTheme()).toBe('#e50914');
  });
});
