import { THEME_COLORS, THEME_STORAGE } from './constants';

export function getThemeEnabled(
  environment: Record<string, string | undefined>
) {
  // 接收服务端运行时环境，避免 NEXT_PUBLIC 常量在 Docker 构建时被固化。
  return environment.NEXT_PUBLIC_ENABLE_NETFLIX_THEME !== 'false';
}

export function getThemeBootstrapScript(enabled = true): string {
  // head 中同步执行，必须先于 next-themes 的脚本写入实际明暗模式。
  return `(function(){var k=${JSON.stringify(THEME_STORAGE)},c=${JSON.stringify(
    THEME_COLORS
  )},e=${JSON.stringify(
    enabled
  )},p='classic',s='system',valid=e,d=document.documentElement;try{var a=localStorage.getItem(k.preset),b=localStorage.getItem(k.classic),t=localStorage.getItem(k.scheme);var ok=function(v){return v===null||v==='system'||v==='light'||v==='dark'};valid=e&&(a===null||a==='classic'||a==='netflix')&&ok(b)&&ok(t);if(valid){p=a||'classic';s=t||'system'}if(p==='netflix'){s='dark';localStorage.setItem(k.scheme,s)}else if(!valid){localStorage.setItem(k.scheme,'system')}}catch(_){p='classic';s='system';valid=false}var dark=s==='dark'||(s==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(p==='netflix'){d.setAttribute('data-theme','netflix')}else{d.removeAttribute('data-theme')}d.classList.remove('light','dark');d.classList.add(dark?'dark':'light');d.style.colorScheme=dark?'dark':'light';var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m)}m.content=p==='netflix'?c.netflix:(dark?c.dark:c.light);d.setAttribute('data-theme-storage-valid',valid?'true':'false')})();`;
}
