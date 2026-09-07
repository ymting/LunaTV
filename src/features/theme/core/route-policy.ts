import { ThemePreset } from './constants';

export type ThemeRoutePolicy =
  | 'classic'
  | 'consumer'
  | 'player'
  | 'admin'
  | 'auth';

export function getThemeRoutePolicy(
  preset: ThemePreset,
  pathname: string | null
): ThemeRoutePolicy {
  if (preset !== 'netflix' || !pathname) return 'classic';
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/admin' || path.startsWith('/admin/')) return 'admin';
  if (path === '/login') return 'auth';
  if (path === '/play' || path === '/live') return 'player';
  if (['/', '/search', '/douban', '/favorites', '/history'].includes(path)) {
    return 'consumer';
  }
  return 'classic';
}
