'use client';

import type { DoubanItem } from '@/lib/types';

import NetflixHero from './NetflixHero';
import { getHomeFeatured } from '../data/home-featured';

export default function NetflixHome({
  movies,
  loading,
  activeTab,
}: {
  movies: DoubanItem[];
  loading: boolean;
  activeTab: 'home' | 'favorites';
}) {
  // 首屏保留同一个 Hero 插槽，由 bootstrap 写入的主题属性决定是否显示。
  if (activeTab !== 'home') return null;
  return <NetflixHero movie={getHomeFeatured(movies)} loading={loading} />;
}
