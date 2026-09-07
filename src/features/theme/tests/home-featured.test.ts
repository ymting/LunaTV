import { describe, expect, it } from '@jest/globals';

import { DoubanItem } from '@/lib/types';

import { getHomeFeatured } from '../data/home-featured';

describe('首页推荐数据降级', () => {
  const film: DoubanItem = {
    id: '1',
    title: '影片',
    poster: 'https://example.com/poster.jpg',
    rate: '8.0',
    year: '2025',
  };
  it('无影片时返回空态，无效封面被跳过', () => {
    expect(getHomeFeatured([])).toBeNull();
    expect(
      getHomeFeatured([
        { ...film, poster: 'javascript:alert(1)' },
        { ...film, title: ' ' },
        film,
      ])
    ).toBe(film);
  });
  it('接受已有站内封面，不改写业务数据', () => {
    const local = { ...film, poster: '/logo.png' };
    expect(getHomeFeatured([local])).toBe(local);
  });
});
