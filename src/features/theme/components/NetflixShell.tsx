'use client';

import NetflixHeader from './NetflixHeader';

export default function NetflixShell({ activePath }: { activePath: string }) {
  // 始终保留同一个布局插槽，CSS 决定导航可见性，不切换播放器父节点。
  return (
    <div className='netflix-shell'>
      <NetflixHeader activePath={activePath} />
    </div>
  );
}
