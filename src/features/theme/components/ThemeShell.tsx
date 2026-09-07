'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import ThemePresetMenu from './ThemePresetMenu';
import { getThemeRoutePolicy } from '../core/route-policy';

export default function ThemeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // 作用域由路由稳定决定；主题仅改变 CSS，播放中的子树不会重新挂载。
  const route = getThemeRoutePolicy('netflix', pathname);
  const scope = route === 'player' ? 'consumer' : route;
  return (
    <div
      className='theme-shell'
      data-theme-scope={scope}
      data-theme-route={route}
      data-theme-surface='page'
    >
      {children}
      <ThemePresetMenu />
    </div>
  );
}
