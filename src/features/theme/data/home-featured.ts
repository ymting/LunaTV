import type { DoubanItem } from '@/lib/types';

export function getHomeFeatured(movies: DoubanItem[]): DoubanItem | null {
  // 仅从首页已加载的数据挑选，不触发额外请求或依赖外部推荐源。
  return (
    movies.find(
      (movie) =>
        typeof movie.title === 'string' &&
        movie.title.trim() &&
        typeof movie.poster === 'string' &&
        /^(https?:\/\/|\/[^/])\S+$/i.test(movie.poster.trim())
    ) ?? null
  );
}
