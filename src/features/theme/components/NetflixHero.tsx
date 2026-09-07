'use client';

import { ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { DoubanItem } from '@/lib/types';
import { processImageUrl } from '@/lib/utils';

export default function NetflixHero({
  movie,
  loading,
}: {
  movie: DoubanItem | null;
  loading: boolean;
}) {
  const [failedPoster, setFailedPoster] = useState(false);
  useEffect(() => setFailedPoster(false), [movie?.poster]);
  const poster = movie && !failedPoster ? processImageUrl(movie.poster) : null;
  // 复用既有播放页的按片名寻源入口；Hero 本身不拥有播放或搜索业务。
  const playHref = movie
    ? `/play?title=${encodeURIComponent(movie.title.trim())}${
        movie.year ? `&year=${encodeURIComponent(movie.year)}` : ''
      }&stype=movie`
    : '/search';

  return (
    <section className='netflix-hero' aria-label='精选推荐' aria-busy={loading}>
      {poster && (
        <div
          className='netflix-hero-backdrop'
          style={{ backgroundImage: `url(${JSON.stringify(poster)})` }}
          aria-hidden='true'
        />
      )}
      <div className='netflix-hero-shade' />
      <div className='netflix-hero-copy'>
        <p className='netflix-eyebrow'>
          今日精选 <span /> 值得沉浸的好故事
        </p>
        <h1>
          {movie?.title ||
            (loading ? '好故事，即将开场' : '下一部好故事，从这里开始')}
        </h1>
        <div className='netflix-hero-meta'>
          {movie?.rate && movie.rate !== '0' && (
            <span className='netflix-rating'>豆瓣 {movie.rate}</span>
          )}
          {movie?.year && <span>{movie.year}</span>}
          <span>{movie ? '热门电影' : '电影 · 剧集 · 动漫'}</span>
        </div>
        <p className='netflix-hero-description'>
          从热门佳作到心头所爱，留一点时间，给一段好故事。
        </p>
        <div className='netflix-hero-actions'>
          <Link
            href={playHref}
            className='netflix-button netflix-button-primary'
          >
            <Play size={19} fill='currentColor' aria-hidden='true' />
            {movie ? '立即播放' : '寻找影片'}
          </Link>
          <Link
            href='/douban?type=movie'
            className='netflix-button netflix-button-secondary'
          >
            浏览电影
            <ArrowRight size={18} aria-hidden='true' />
          </Link>
        </div>
      </div>
      {poster && (
        <div className='netflix-hero-art'>
          {/* 保持海报原始比例，背景虚化层承担宽屏氛围，不裁切人物主体。 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poster}
            alt={`${movie?.title}海报`}
            onError={() => setFailedPoster(true)}
            referrerPolicy='no-referrer'
          />
        </div>
      )}
    </section>
  );
}
