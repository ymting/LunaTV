'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useSite } from '@/components/SiteProvider';
import { UserMenu } from '@/components/UserMenu';

import { netflixNavigation } from '../data/navigation';

export default function NetflixHeader({ activePath }: { activePath: string }) {
  const { siteName } = useSite();
  const [enableLive, setEnableLive] = useState(false);
  const [enableCustom, setEnableCustom] = useState(false);
  useEffect(() => {
    const runtime = (
      window as Window & {
        RUNTIME_CONFIG?: {
          ENABLE_WEB_LIVE?: boolean;
          CUSTOM_CATEGORIES?: unknown[];
        };
      }
    ).RUNTIME_CONFIG;
    setEnableLive(Boolean(runtime?.ENABLE_WEB_LIVE));
    setEnableCustom(Boolean(runtime?.CUSTOM_CATEGORIES?.length));
  }, []);

  return (
    <header className='netflix-header'>
      <Link
        href='/'
        className='netflix-wordmark'
        aria-label={`${siteName} 首页`}
      >
        {siteName}
      </Link>
      <nav className='netflix-navigation' aria-label='影视导航'>
        {netflixNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={activePath === item.href ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
        {enableLive && (
          <Link
            href='/live'
            aria-current={activePath === '/live' ? 'page' : undefined}
          >
            直播
          </Link>
        )}
        {enableCustom && (
          <Link
            href='/douban?type=custom'
            aria-current={
              activePath === '/douban?type=custom' ? 'page' : undefined
            }
          >
            自定义
          </Link>
        )}
      </nav>
      <div className='netflix-header-actions'>
        <Link href='/search' className='netflix-search' aria-label='搜索影视'>
          <Search size={21} aria-hidden='true' />
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
