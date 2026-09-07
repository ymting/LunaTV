import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  getThemeBootstrapScript,
  getThemeEnabled,
} from '../core/bootstrap-script';
import { THEME_STORAGE } from '../core/constants';
import { readThemeStorage } from '../core/storage';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.className = '';
  window.matchMedia = jest
    .fn()
    .mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
});

describe('首屏同步启动', () => {
  it('React 尚未运行时已设置 Netflix 暗色和浏览器颜色', () => {
    localStorage.setItem(THEME_STORAGE.preset, 'netflix');
    localStorage.setItem(THEME_STORAGE.classic, 'light');
    localStorage.setItem(THEME_STORAGE.scheme, 'light');
    window.eval(getThemeBootstrapScript());
    expect(document.documentElement.dataset.theme).toBe('netflix');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(
      document
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute('content')
    ).toBe('#141414');
    expect(localStorage.getItem(THEME_STORAGE.classic)).toBe('light');
  });

  it.each(['system', 'light', 'dark'])('经典 %s 不改变用户偏好', (scheme) => {
    localStorage.setItem('theme', scheme);
    window.eval(getThemeBootstrapScript());
    expect(localStorage.getItem('theme')).toBe(scheme);
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(
      document.documentElement.classList.contains(
        scheme === 'dark' ? 'dark' : 'light'
      )
    ).toBe(true);
  });

  it.each(Object.values(THEME_STORAGE))(
    '损坏的 %s 回退 classic + system',
    (key) => {
      localStorage.setItem(THEME_STORAGE.preset, 'netflix');
      localStorage.setItem(key, 'invalid');
      expect(readThemeStorage().valid).toBe(false);
      window.eval(getThemeBootstrapScript());
      expect(document.documentElement.dataset.theme).toBeUndefined();
      expect(localStorage.getItem('theme')).toBe('system');
    }
  );

  it('禁用开关忽略 Netflix，但保留预设与恢复偏好', () => {
    localStorage.setItem(THEME_STORAGE.preset, 'netflix');
    localStorage.setItem(THEME_STORAGE.classic, 'light');
    localStorage.setItem('theme', 'dark');
    window.eval(getThemeBootstrapScript(false));
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem('theme')).toBe('system');
    expect(localStorage.getItem(THEME_STORAGE.preset)).toBe('netflix');
    expect(localStorage.getItem(THEME_STORAGE.classic)).toBe('light');
  });

  it('存储被禁用时不抛错', () => {
    const spy = jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('denied');
      });
    expect(() => window.eval(getThemeBootstrapScript())).not.toThrow();
    expect(readThemeStorage().scheme).toBe('system');
    spy.mockRestore();
  });

  it('使用传入的服务端运行时开关', () => {
    expect(getThemeEnabled({ NEXT_PUBLIC_ENABLE_NETFLIX_THEME: 'false' })).toBe(
      false
    );
    expect(getThemeEnabled({ NEXT_PUBLIC_ENABLE_NETFLIX_THEME: 'true' })).toBe(
      true
    );
    expect(getThemeEnabled({})).toBe(true);
  });
});
