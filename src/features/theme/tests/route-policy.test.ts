import { describe, expect, it } from '@jest/globals';

import { getThemeRoutePolicy } from '../core/route-policy';

describe('路由展示策略', () => {
  it.each(['/', '/search', '/douban', '/play', '/live', '/admin', '/login'])(
    '经典 %s 保持上游布局',
    (path) => {
      expect(getThemeRoutePolicy('classic', path)).toBe('classic');
    }
  );
  it.each([
    ['/', 'consumer'],
    ['/search', 'consumer'],
    ['/douban/', 'consumer'],
    ['/play', 'player'],
    ['/live', 'player'],
    ['/admin', 'admin'],
    ['/admin/settings', 'admin'],
    ['/login', 'auth'],
    ['/unknown', 'classic'],
  ])('Netflix %s 映射 %s', (path, expected) => {
    expect(getThemeRoutePolicy('netflix', path)).toBe(expected);
  });
  it('空路由安全回退', () =>
    expect(getThemeRoutePolicy('netflix', null)).toBe('classic'));
});
