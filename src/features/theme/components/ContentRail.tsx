'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Children, ReactNode, useRef } from 'react';

import ScrollableRow from '@/components/ScrollableRow';

import NetflixCardFrame from './NetflixCardFrame';
import { useThemePreset } from '../core/useThemePreset';

export default function ContentRail({
  children,
  scrollDistance = 1000,
}: {
  children: ReactNode;
  scrollDistance?: number;
}) {
  const { isNetflix } = useThemePreset();
  const root = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => {
    // 滚动原始轨道，避免复制业务卡片或重建子树；尊重减少动态效果偏好。
    const track = root.current?.firstElementChild?.firstElementChild;
    if (!(track instanceof HTMLElement)) return;
    track.scrollBy({
      left: direction * track.clientWidth * 0.8,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  };
  // 原始轨道及业务卡片始终挂载，主题只调整外框展示，不重新请求卡片数据。
  return (
    <div
      data-theme-rail
      className='theme-content-rail'
      ref={root}
      role={isNetflix ? 'region' : undefined}
      aria-label={isNetflix ? '可横向浏览的影片列表' : undefined}
      tabIndex={isNetflix ? 0 : undefined}
      onKeyDown={(event) => {
        if (!isNetflix || event.target !== event.currentTarget) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          scroll(event.key === 'ArrowRight' ? 1 : -1);
        }
      }}
    >
      <ScrollableRow scrollDistance={scrollDistance}>
        {Children.map(children, (child) => (
          <NetflixCardFrame>{child}</NetflixCardFrame>
        ))}
      </ScrollableRow>
      <div className='theme-rail-buttons'>
        <button
          type='button'
          aria-label='向左浏览影片'
          onClick={() => scroll(-1)}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type='button'
          aria-label='向右浏览影片'
          onClick={() => scroll(1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
