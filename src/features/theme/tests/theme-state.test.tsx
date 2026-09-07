import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ThemeProvider, useTheme } from 'next-themes';
import React from 'react';

import { getThemeBootstrapScript } from '../core/bootstrap-script';
import { THEME_STORAGE } from '../core/constants';
import { ThemePresetProvider } from '../core/ThemePresetProvider';
import { useThemePreset } from '../core/useThemePreset';

function Controls() {
  const { preset, setPreset, ready, enabled } = useThemePreset();
  const { theme, setTheme } = useTheme();
  return (
    <>
      <output data-testid='state'>{`${preset}:${theme}:${ready}:${enabled}`}</output>
      <button onClick={() => setPreset('netflix')}>Netflix</button>
      <button onClick={() => setPreset('classic')}>Classic</button>
      <button onClick={() => setTheme('light')}>Legacy light</button>
    </>
  );
}

function mount(enabled = true) {
  window.eval(getThemeBootstrapScript(enabled));
  return render(
    <ThemeProvider attribute='class' defaultTheme='system'>
      <ThemePresetProvider enabled={enabled}>
        <Controls />
      </ThemePresetProvider>
    </ThemeProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  window.matchMedia = jest.fn().mockReturnValue({
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }) as unknown as typeof window.matchMedia;
});

describe('主题状态矩阵', () => {
  it.each(['system', 'light', 'dark'])(
    '%s 进入 Netflix 固定暗色，退出恢复',
    async (scheme) => {
      localStorage.setItem('theme', scheme);
      mount();
      fireEvent.click(screen.getByText('Netflix'));
      await waitFor(() =>
        expect(screen.getByTestId('state').textContent).toBe(
          'netflix:dark:true:true'
        )
      );
      expect(localStorage.getItem(THEME_STORAGE.classic)).toBe(scheme);
      fireEvent.click(screen.getByText('Classic'));
      await waitFor(() =>
        expect(screen.getByTestId('state').textContent).toBe(
          `classic:${scheme}:true:true`
        )
      );
      expect(document.documentElement.dataset.theme).toBeUndefined();
    }
  );

  it('刷新保持 Netflix 和此前 light 偏好', async () => {
    localStorage.setItem(THEME_STORAGE.preset, 'netflix');
    localStorage.setItem(THEME_STORAGE.classic, 'light');
    mount();
    await waitFor(() =>
      expect(screen.getByTestId('state').textContent).toBe(
        'netflix:dark:true:true'
      )
    );
    fireEvent.click(screen.getByText('Classic'));
    await waitFor(() =>
      expect(screen.getByTestId('state').textContent).toBe(
        'classic:light:true:true'
      )
    );
  });

  it('旧明暗入口不能打破 Netflix 暗色，meta 被旧组件写入后恢复', async () => {
    mount();
    fireEvent.click(screen.getByText('Netflix'));
    fireEvent.click(screen.getByText('Legacy light'));
    await waitFor(() =>
      expect(screen.getByTestId('state').textContent).toBe(
        'netflix:dark:true:true'
      )
    );
    act(() =>
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', '#0c111c')
    );
    await waitFor(() =>
      expect(
        document
          .querySelector('meta[name="theme-color"]')
          ?.getAttribute('content')
      ).toBe('#141414')
    );
  });

  it('其他标签进入与退出时同步并恢复 system', async () => {
    mount();
    act(() => {
      localStorage.setItem(THEME_STORAGE.classic, 'system');
      localStorage.setItem(THEME_STORAGE.preset, 'netflix');
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: THEME_STORAGE.preset,
          newValue: 'netflix',
        })
      );
    });
    await waitFor(() =>
      expect(screen.getByTestId('state').textContent).toBe(
        'netflix:dark:true:true'
      )
    );
    act(() => {
      localStorage.setItem(THEME_STORAGE.preset, 'classic');
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: THEME_STORAGE.preset,
          newValue: 'classic',
        })
      );
    });
    await waitFor(() =>
      expect(screen.getByTestId('state').textContent).toBe(
        'classic:system:true:true'
      )
    );
  });

  it('清空存储的跨标签事件恢复默认', async () => {
    mount();
    fireEvent.click(screen.getByText('Netflix'));
    act(() => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
    });
    await waitFor(() =>
      expect(screen.getByTestId('state').textContent).toBe(
        'classic:system:true:true'
      )
    );
  });

  it('kill switch 禁止切换并保留原预设', async () => {
    localStorage.setItem(THEME_STORAGE.preset, 'netflix');
    mount(false);
    fireEvent.click(screen.getByText('Netflix'));
    await waitFor(() =>
      expect(screen.getByTestId('state').textContent).toBe(
        'classic:system:true:false'
      )
    );
    expect(localStorage.getItem(THEME_STORAGE.preset)).toBe('netflix');
  });

  it('写入存储失败时安全留在 classic + system', async () => {
    localStorage.setItem('theme', 'light');
    mount();
    const spy = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota denied');
      });
    fireEvent.click(screen.getByText('Netflix'));
    await waitFor(() =>
      expect(screen.getByTestId('state').textContent).toBe(
        'classic:system:true:true'
      )
    );
    expect(document.documentElement.dataset.theme).toBeUndefined();
    spy.mockRestore();
  });

  it('损坏的偏好不会在 bootstrap 后被 Provider 重新启用', async () => {
    localStorage.setItem(THEME_STORAGE.preset, 'netflix');
    localStorage.setItem(THEME_STORAGE.classic, 'invalid');
    mount();
    await waitFor(() =>
      expect(screen.getByTestId('state').textContent).toBe(
        'classic:system:true:true'
      )
    );
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});
